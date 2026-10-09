<?php
/* Render only after the page handler has completed mutations and redirects. */
require_once __DIR__ . '/_auth.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Doctors Portal - Admin</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="../assets/style.css">
    <script src="../assets/theme.js"></script>
</head>
<body class="portal-admin">
<nav class="navbar main-navbar mb-4">
    <div class="container">
        <a class="navbar-brand" href="dashboard.php"><img class="portal-brand-icon" src="../assets/brand.svg" alt="">Aura<span class="portal-section">Admin</span></a>
        <div class="admin-nav">
            <a href="dashboard.php">Overview</a>
            <a href="doctors.php">Doctors</a>
            <a href="appointments.php">Appointments</a>
            <a href="../index.php">Directory</a>
            <button type="button" class="btn btn-outline-light btn-sm" data-theme-toggle>Change theme</button>
            <span class="navbar-text me-3">
                <?php echo htmlspecialchars($_SESSION['admin_username'] ?? ""); ?>
            </span>
            <form method="post" action="logout.php"><?php echo csrf_field(); ?><button class="btn btn-outline-light btn-sm">Logout</button></form>
        </div>
    </div>
</nav>
<div class="container">
