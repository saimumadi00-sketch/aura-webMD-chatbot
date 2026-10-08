<?php
// config.php - DB connection + session

$host = "localhost";
$user = "root";      // XAMPP default
$pass = "";          // XAMPP default is empty password
$dbname = "doctors_portal";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>
