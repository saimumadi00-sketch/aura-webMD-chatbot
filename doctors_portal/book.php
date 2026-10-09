<?php
/* Public booking request: validate the doctor/form before storing any patient data. */
require_once __DIR__ . '/session.php';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') require_valid_csrf();
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/storage.php';
require_once __DIR__ . '/validation.php';
$raw_id = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' ? ($_POST['doctor_id'] ?? null) : ($_GET['doctor_id'] ?? null);
$doctor_id = filter_var(is_scalar($raw_id) ? $raw_id : null, FILTER_VALIDATE_INT);
if (!$doctor_id || $doctor_id < 1) { http_response_code(400); exit('Invalid doctor ID.'); }
$stmt = $conn->prepare('SELECT * FROM doctors WHERE id = ?');
$stmt->bind_param('i', $doctor_id);
$stmt->execute();
$doctor = $stmt->get_result()->fetch_assoc();
$stmt->close();
if (!$doctor) { http_response_code(404); exit('Doctor not found.'); }
$success_message = $_SESSION['booking_success'] ?? '';
unset($_SESSION['booking_success']);
$error_message = '';
$patient_name = $patient_email = $patient_phone = $date = $time = $reason = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $patient_name = post_text('patient_name');
    $patient_email = post_text('patient_email');
    $patient_phone = post_text('patient_phone');
    $date = post_text('appointment_date');
    $time = post_text('appointment_time');
    $reason = post_text('reason');
    $error_message = validate_booking($patient_name, $patient_email, $patient_phone, $date, $time, $reason);
    $chat_pdf_path = null;
    $destination = null;
    // Optional uploads are checked as actual PDF content, capped, and placed outside the web root.
    $upload = $_FILES['chat_pdf'] ?? null;
    if ($error_message === '' && $upload && ($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        if (!is_array($upload) || !is_string($upload['tmp_name'] ?? null) || !is_string($upload['name'] ?? null) || ($upload['error'] ?? null) !== UPLOAD_ERR_OK) {
            $error_message = 'Could not upload the PDF. Check the server upload limit.';
        } elseif (strtolower(pathinfo($upload['name'], PATHINFO_EXTENSION)) !== 'pdf' || !is_uploaded_file($upload['tmp_name']) || !valid_pdf($upload['tmp_name'])) {
            $error_message = 'Attach a valid PDF no larger than 5 MB.';
        } else {
            try {
                $chat_pdf_path = bin2hex(random_bytes(16)) . '.pdf';
                $destination = portal_upload_directory() . DIRECTORY_SEPARATOR . $chat_pdf_path;
                if (!move_uploaded_file($upload['tmp_name'], $destination)) throw new RuntimeException('Upload failed.');
                chmod($destination, 0600);
            } catch (RuntimeException $e) { $error_message = 'Private PDF storage is unavailable. Contact the portal administrator.'; }
        }
    }
    if ($error_message === '') {
        $stmt = $conn->prepare('INSERT INTO appointments (doctor_id, patient_name, patient_email, patient_phone, appointment_date, appointment_time, reason, chat_pdf_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        if (!$stmt) $error_message = 'Could not save appointment. Please try again.';
        else {
            $stmt->bind_param('isssssss', $doctor_id, $patient_name, $patient_email, $patient_phone, $date, $time, $reason, $chat_pdf_path);
            if ($stmt->execute()) {
                // Redirect after insertion: refreshing the result page cannot submit a duplicate request.
                $_SESSION['booking_success'] = 'Your appointment request has been recorded. Contact the clinic to confirm availability.';
                unset($_SESSION['csrf_token']);
                header('Location: book.php?doctor_id=' . $doctor_id, true, 303);
                exit;
            }
            $error_message = 'Could not save appointment. Please try again.';
            $stmt->close();
        }
    }
    // Failed inserts must not leave patient files orphaned in storage.
    if ($error_message !== '' && $destination && is_file($destination)) unlink($destination);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Aura | Doctor support</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

    <link rel="stylesheet" href="assets/style.css">
    <script src="assets/theme.js"></script>
</head>

<body class="page-book">
<div class="gradient-bar"></div>
<nav class="navbar navbar-expand-lg navbar-dark main-navbar">

    <div class="container">
        <a class="navbar-brand" href="index.php"><img class="portal-brand-icon" src="assets/brand.svg" alt="">Aura<span class="portal-section">Doctor support</span></a>
        <div class="portal-nav"><a href="index.php" class="btn btn-outline-light btn-sm">Find a doctor</a><button type="button" data-theme-toggle class="btn btn-outline-light btn-sm">Change theme</button></div>
    </div>
</nav>

<main class="main-shell">
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <div class="booking-shell">
          <h1 class="mb-4">Book appointment</h1>

          <div class="d-flex align-items-center mb-4">
            <div>
              <h5 class="mb-1"><?php echo htmlspecialchars($doctor['name']); ?></h5>
              <?php if (!empty($doctor['specialty'])): ?>
                <p class="mb-1 doctor-location">
                  <?php echo htmlspecialchars($doctor['specialty']); ?>
                </p>
              <?php endif; ?>
              <p class="mb-0 doctor-location">
                <?php if (!empty($doctor['hospital'])) echo htmlspecialchars($doctor['hospital']); ?>
                <?php if (!empty($doctor['city'])) echo " &bull; " . htmlspecialchars($doctor['city']); ?>
              </p>
            </div>
          </div>

          <?php if ($success_message): ?>
            <div class="alert alert-soft-success mb-4">
              <?php echo htmlspecialchars($success_message); ?>
            </div>
          <?php elseif ($error_message): ?>
            <div class="alert alert-soft-error mb-4">
              <?php echo htmlspecialchars($error_message); ?>
            </div>
          <?php endif; ?>

          <form method="post" enctype="multipart/form-data" class="mt-3">
            <?php echo csrf_field(); ?>
            <input type="hidden" name="doctor_id" value="<?php echo $doctor_id; ?>">

            <div class="mb-3">
              <label for="patient_name" class="form-label">Your name *</label>
              <input type="text" autocomplete="name" id="patient_name" name="patient_name" value="<?php echo htmlspecialchars($patient_name, ENT_QUOTES, 'UTF-8'); ?>" class="form-control" required>
            </div>

            <div class="mb-3">
              <label for="patient_email" class="form-label">Email (optional)</label>
              <input type="email" autocomplete="email" id="patient_email" name="patient_email" value="<?php echo htmlspecialchars($patient_email, ENT_QUOTES, 'UTF-8'); ?>" class="form-control">
            </div>

            <div class="mb-3">
              <label for="patient_phone" class="form-label">Phone (optional)</label>
              <input type="tel" autocomplete="tel" id="patient_phone" name="patient_phone" value="<?php echo htmlspecialchars($patient_phone, ENT_QUOTES, 'UTF-8'); ?>" class="form-control">
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="appointment_date" class="form-label">Date *</label>
                <input type="date" id="appointment_date" name="appointment_date" value="<?php echo htmlspecialchars($date, ENT_QUOTES, 'UTF-8'); ?>" class="form-control" required>
              </div>
              <div class="col-md-6 mb-3">
                <label for="appointment_time" class="form-label">Time *</label>
                <input type="time" id="appointment_time" name="appointment_time" value="<?php echo htmlspecialchars($time, ENT_QUOTES, 'UTF-8'); ?>" class="form-control" required>
              </div>
            </div>

            <div class="mb-3">
              <label for="reason" class="form-label">Reason / notes (optional)</label>
              <textarea id="reason" name="reason" class="form-control" rows="3"><?php echo htmlspecialchars($reason, ENT_QUOTES, 'UTF-8'); ?></textarea>
            </div>

            <div class="mb-3">
              <label for="chat_pdf" class="form-label">Attach chat history (PDF, optional)</label>
              <input type="file" id="chat_pdf" name="chat_pdf" accept="application/pdf" class="form-control">
              <div class="form-text">
                Optional PDF, up to 5 MB. It is available only to signed-in portal administrators.
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-4">
              <a href="index.php" class="btn btn-outline-light">
                Back to doctors
              </a>
              <button type="submit" class="btn btn-glow">
                Submit appointment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</main>
</body>
</html>









