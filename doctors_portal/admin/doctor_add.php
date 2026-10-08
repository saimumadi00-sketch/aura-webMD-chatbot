<?php
require_once "_header.php";

$error = "";
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name      = trim($_POST['name'] ?? "");
    $specialty = trim($_POST['specialty'] ?? "");
    $email     = trim($_POST['email'] ?? "");
    $phone     = trim($_POST['phone'] ?? "");
    $fee       = trim($_POST['fee'] ?? "");
    $hospital  = trim($_POST['hospital'] ?? "");
    $city      = trim($_POST['city'] ?? "");
    $about     = trim($_POST['about'] ?? "");

    if ($name === "") {
        $error = "Name is required.";
    } else {
        $stmt = $conn->prepare("
            INSERT INTO doctors (name, specialty, email, phone, fee, hospital, city, about)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param(
            "ssssssss",
            $name,
            $specialty,
            $email,
            $phone,
            $fee,
            $hospital,
            $city,
            $about
        );
        if ($stmt->execute()) {
            header("Location: doctors.php");
            exit;
        } else {
            $error = "Could not save doctor.";
        }
        $stmt->close();
    }
}
?>
<h1 class="mb-4">Add Doctor</h1>

<?php if ($error): ?>
    <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
<?php endif; ?>

<form method="post">
    <div class="mb-3">
        <label class="form-label">Name *</label>
        <input type="text" name="name" class="form-control" required>
    </div>
    <div class="mb-3">
        <label class="form-label">Specialty</label>
        <input type="text" name="specialty" class="form-control">
    </div>
    <div class="mb-3">
        <label class="form-label">Email</label>
        <input type="email" name="email" class="form-control">
    </div>
    <div class="mb-3">
        <label class="form-label">Phone</label>
        <input type="text" name="phone" class="form-control">
    </div>
    <div class="mb-3">
        <label class="form-label">Fee</label>
        <input type="text" name="fee" class="form-control">
    </div>
    <div class="mb-3">
        <label class="form-label">Hospital / Clinic</label>
        <input type="text" name="hospital" class="form-control">
    </div>
    <div class="mb-3">
        <label class="form-label">City</label>
        <input type="text" name="city" class="form-control">
    </div>
    <div class="mb-3">
        <label class="form-label">About / Notes</label>
        <textarea name="about" class="form-control" rows="3"></textarea>
    </div>
    <button type="submit" class="btn btn-success">Save</button>
    <a href="doctors.php" class="btn btn-secondary">Cancel</a>
</form>

<?php require_once "_footer.php"; ?>
