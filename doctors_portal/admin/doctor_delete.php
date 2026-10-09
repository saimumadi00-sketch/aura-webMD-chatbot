<?php
/* Validate mutation and session before deleting a selected doctor. */
require_once __DIR__ . '/../session.php';
require_post();
require_once __DIR__ . '/_auth.php';
$id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
if (!$id || $id < 1) { http_response_code(400); exit('Invalid doctor ID.'); }
$stmt = $conn->prepare('DELETE FROM doctors WHERE id = ?');
$stmt->bind_param('i', $id);
if (!$stmt->execute()) { http_response_code(409); exit('Could not delete doctor. Resolve associated appointments first.'); }
header('Location: doctors.php', true, 303);
exit;
