<?php
/* Doctor editing: load the selected ID first, then update its fields when a valid form is submitted. */
require_once "_auth.php";

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    die("Invalid doctor ID.");
}

$error = "";

// Load doctor
$stmt = $conn->prepare("SELECT * FROM doctors WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();
$doctor = $res->fetch_assoc();
$stmt->close();

// Stop before rendering or updating if the requested doctor does not exist.
if (!$doctor) {
    die("Doctor not found.");
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name      = post_text('name');
    $specialty = post_text('specialty');
    $email     = post_text('email');
    $phone     = post_text('phone');
    $fee       = post_text('fee');
    $hospital  = post_text('hospital');
    $city      = post_text('city');
    $about     = post_text('about');

    if ($name === "") {
        $error = "Name is required.";
    } else {
        $stmt = $conn->prepare("
            UPDATE doctors
            SET name=?, specialty=?, email=?, phone=?, fee=?, hospital=?, city=?, about=?
            WHERE id=?
        ");
        $stmt->bind_param(
            "ssssssssi",
            $name,
            $specialty,
            $email,
            $phone,
            $fee,
            $hospital,
            $city,
            $about,
            $id
        );
        if ($stmt->execute()) {
            header("Location: doctors.php");
            exit;
        } else {
            $error = "Could not update doctor.";
        }
        $stmt->close();
    }
}
?>
<?php require_once "_header.php"; ?>
<h1 class="mb-4">Edit Doctor</h1>

<?php if ($error): ?>
    <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
<?php endif; ?>

<form method="post">
    <?php echo csrf_field(); ?>
    <div class="mb-3">
        <label class="form-label">Name *</label>
        <input type="text" name="name" class="form-control" required
               value="<?php echo htmlspecialchars($doctor['name']); ?>">
    </div>
    <div class="mb-3">
        <label class="form-label">Specialty</label>
        <input type="text" name="specialty" class="form-control"
               value="<?php echo htmlspecialchars($doctor['specialty']); ?>">
    </div>
    <div class="mb-3">
        <label class="form-label">Email</label>
        <input type="email" name="email" class="form-control"
               value="<?php echo htmlspecialchars($doctor['email']); ?>">
    </div>
    <div class="mb-3">
        <label class="form-label">Phone</label>
        <input type="text" name="phone" class="form-control"
               value="<?php echo htmlspecialchars($doctor['phone']); ?>">
    </div>
    <div class="mb-3">
        <label class="form-label">Fee</label>
        <input type="text" name="fee" class="form-control"
               value="<?php echo htmlspecialchars($doctor['fee']); ?>">
    </div>
    <div class="mb-3">
        <label class="form-label">Hospital / Clinic</label>
        <input type="text" name="hospital" class="form-control"
               value="<?php echo htmlspecialchars($doctor['hospital']); ?>">
    </div>
    <div class="mb-3">
        <label class="form-label">City</label>
        <input type="text" name="city" class="form-control"
               value="<?php echo htmlspecialchars($doctor['city']); ?>">
    </div>
    <div class="mb-3">
        <label class="form-label">About / Notes</label>
        <textarea name="about" class="form-control" rows="3"><?php
            echo htmlspecialchars($doctor['about']);
        ?></textarea>
    </div>
    <button type="submit" class="btn btn-success">Save Changes</button>
    <a href="doctors.php" class="btn btn-secondary">Cancel</a>
</form>

<?php require_once "_footer.php"; ?>
