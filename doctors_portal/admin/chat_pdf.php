<?php
/* Serve an authorized appointment PDF as a download, never as executable page content. */
require_once __DIR__ . '/_auth.php';
require_once __DIR__ . '/../storage.php';
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id || $id < 1) { http_response_code(400); exit('Invalid appointment.'); }
$stmt = $conn->prepare('SELECT chat_pdf_path FROM appointments WHERE id = ?');
$stmt->bind_param('i', $id);
$stmt->execute();
$record = $stmt->get_result()->fetch_assoc();
$name = $record['chat_pdf_path'] ?? '';
if (!preg_match('/^[a-f0-9]{32}\.pdf$/D', $name)) { http_response_code(404); exit('PDF not available.'); }
try { $file = portal_upload_directory() . DIRECTORY_SEPARATOR . $name; }
catch (RuntimeException $e) { http_response_code(503); exit('PDF storage unavailable.'); }
if (!is_file($file) || is_link($file)) { http_response_code(404); exit('PDF not available.'); }
header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="chat-history.pdf"');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, no-store');
header('Content-Length: ' . filesize($file));
readfile($file);
