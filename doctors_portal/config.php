<?php
/* Shared connection bootstrap: credentials come from the PHP server environment. */
require_once __DIR__ . '/session.php';
if (!class_exists('mysqli')) { http_response_code(503); exit('Portal unavailable: enable the PHP mysqli extension.'); }
mysqli_report(MYSQLI_REPORT_OFF);
$conn = new mysqli(getenv('DB_HOST') ?: 'localhost', getenv('DB_USER') ?: 'root', getenv('DB_PASSWORD') ?: '', getenv('DB_NAME') ?: 'doctors_portal', (int)(getenv('DB_PORT') ?: 3306));
if ($conn->connect_error) { http_response_code(503); exit('Portal database unavailable. Check server configuration.'); }
$conn->set_charset('utf8mb4');
