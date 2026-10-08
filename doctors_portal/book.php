<?php
require_once "config.php";

$doctor_id = isset($_GET['doctor_id']) ? (int)$_GET['doctor_id'] : 0;

// Messages for user feedback
$success_message = "";
$error_message = "";

// When form is submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $doctor_id     = (int)($_POST['doctor_id'] ?? 0);
    $patient_name  = trim($_POST['patient_name'] ?? "");
    $patient_email = trim($_POST['patient_email'] ?? "");
    $patient_phone = trim($_POST['patient_phone'] ?? "");
    $date          = $_POST['appointment_date'] ?? "";
    $time          = $_POST['appointment_time'] ?? "";
    $reason        = trim($_POST['reason'] ?? "");
    $chat_pdf_path = null;

    if ($doctor_id <= 0 || $patient_name === "" || $date === "" || $time === "") {
        $error_message = "Please fill in all required fields (Name, Date, Time).";
    }

    // Handle chat PDF upload (optional) if no previous error
    if ($error_message === "" && isset($_FILES['chat_pdf']) && $_FILES['chat_pdf']['error'] !== UPLOAD_ERR_NO_FILE) {
        if ($_FILES['chat_pdf']['error'] === UPLOAD_ERR_OK) {
            $tmpName  = $_FILES['chat_pdf']['tmp_name'];
            $origName = basename($_FILES['chat_pdf']['name']);
            $ext      = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

            if ($ext !== 'pdf') {
                $error_message = "Chat history must be a PDF file.";
            } else {
                $uploadDir = __DIR__ . '/uploads/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                $safeName = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $origName);
                $newName  = 'chat_' . time() . '_' . $safeName;
                $dest     = $uploadDir . $newName;

                if (move_uploaded_file($tmpName, $dest)) {
                    $chat_pdf_path = 'uploads/' . $newName; // relative path for links
                } else {
                    $error_message = "Failed to upload chat PDF.";
                }
            }
        } else {
            $error_message = "File upload error.";
        }
    }

    // If everything is okay, insert appointment
    if ($error_message === "") {
        $stmt = $conn->prepare("INSERT INTO appointments
            (doctor_id, patient_name, patient_email, patient_phone,
             appointment_date, appointment_time, reason, chat_pdf_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param(
            "isssssss",
            $doctor_id,
            $patient_name,
            $patient_email,
            $patient_phone,
            $date,
            $time,
            $reason,
            $chat_pdf_path
        );

        if ($stmt->execute()) {
            $success_message = "Your appointment request has been sent. We will contact you soon.";
        } else {
            $error_message = "Could not save appointment. Please try again.";
        }
        $stmt->close();
    }
}

// Load doctor info
$stmt = $conn->prepare("SELECT * FROM doctors WHERE id = ?");
$stmt->bind_param("i", $doctor_id);
$stmt->execute();
$doctor_result = $stmt->get_result();
$doctor = $doctor_result->fetch_assoc();
$stmt->close();

if (!$doctor) {
    die("Doctor not found.");
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Doctors Portal</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Fonts + custom styles -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/style.css">
</head>

<body class="page-book">
<div class="gradient-bar"></div>
<nav class="navbar navbar-expand-lg navbar-dark main-navbar">

    <div class="container">
        <a class="navbar-brand" href="index.php">Doctors Portal</a>
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
            <input type="hidden" name="doctor_id" value="<?php echo $doctor_id; ?>">

            <div class="mb-3">
              <label class="form-label">Your name *</label>
              <input type="text" name="patient_name" class="form-control" required>
            </div>

            <div class="mb-3">
              <label class="form-label">Email (optional)</label>
              <input type="email" name="patient_email" class="form-control">
            </div>

            <div class="mb-3">
              <label class="form-label">Phone (optional)</label>
              <input type="text" name="patient_phone" class="form-control">
            </div>

            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Date *</label>
                <input type="date" name="appointment_date" class="form-control" required>
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Time *</label>
                <input type="time" name="appointment_time" class="form-control" required>
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Reason / notes (optional)</label>
              <textarea name="reason" class="form-control" rows="3"></textarea>
            </div>

            <div class="mb-3">
              <label class="form-label">Attach chat history (PDF, optional)</label>
              <input type="file" name="chat_pdf" accept="application/pdf" class="form-control">
              <div class="form-text">
                Export your chat from Aura as a PDF, then upload it here so the doctor can review it.
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-4">
              <a href="index.php" class="btn btn-outline-light">
                <- Back
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









