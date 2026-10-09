<?php
/* Authenticate and validate mutations before any page output or database operation. */
require_once __DIR__ . '/../session.php';
if (empty($_SESSION['admin_id'])) {
    header('Location: login.php');
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') require_valid_csrf();
require_once __DIR__ . '/../config.php';
