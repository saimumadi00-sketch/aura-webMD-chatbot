<?php
/* Logout is a CSRF-protected mutation and needs no database connection. */
require_once __DIR__ . '/../session.php';
require_post();
session_unset();
session_destroy();
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => $params['path'], 'secure' => $params['secure'], 'httponly' => true, 'samesite' => 'Lax']);
}
header('Location: login.php', true, 303);
exit;
