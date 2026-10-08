<?php
require_once "../config.php";
if (!isset($_SESSION['admin_id'])) {
    header("Location: login.php");
    exit;
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Doctors Portal - Admin</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
    <div class="container">
        <a class="navbar-brand" href="dashboard.php">Admin Panel</a>
        <div class="collapse navbar-collapse">
            <ul class="navbar-nav me-auto">
                <li class="nav-item">
                    <a class="nav-link" href="doctors.php">Doctors</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="appointments.php">Appointments</a>
                </li>
            </ul>
            <span class="navbar-text me-3">
                <?php echo htmlspecialchars($_SESSION['admin_username'] ?? ""); ?>
            </span>
            <a class="btn btn-outline-light btn-sm" href="logout.php">Logout</a>
        </div>
    </div>
</nav>
<div class="container">
