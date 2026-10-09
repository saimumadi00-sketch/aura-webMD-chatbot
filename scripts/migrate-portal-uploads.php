<?php
/* One-time server-shell migration: preserve referenced legacy PDFs in private storage. */
if (PHP_SAPI !== 'cli') { http_response_code(403); exit('CLI only.'); }
require_once __DIR__ . '/../doctors_portal/config.php';
require_once __DIR__ . '/../doctors_portal/storage.php';
$legacy = realpath(__DIR__ . '/../doctors_portal/uploads');
if (!$legacy) exit("No legacy upload directory.\n");
$destination = portal_upload_directory();
$rows = $conn->query("SELECT id, chat_pdf_path FROM appointments WHERE chat_pdf_path LIKE 'uploads/%'");
if (!$rows) exit("Could not read legacy PDF records.\n");
while ($row = $rows->fetch_assoc()) {
    $source = realpath($legacy . DIRECTORY_SEPARATOR . basename($row['chat_pdf_path']));
    if (!$source || dirname($source) !== $legacy || is_link($legacy . DIRECTORY_SEPARATOR . basename($row['chat_pdf_path'])) || !valid_pdf($source)) {
        fwrite(STDERR, 'Skipped invalid/missing PDF for appointment ' . (int)$row['id'] . "\n");
        continue;
    }
    $name = bin2hex(random_bytes(16)) . '.pdf';
    $target = $destination . DIRECTORY_SEPARATOR . $name;
    if (!copy($source, $target)) { fwrite(STDERR, "Copy failed.\n"); continue; }
    chmod($target, 0600);
    $stmt = $conn->prepare('UPDATE appointments SET chat_pdf_path = ? WHERE id = ? AND chat_pdf_path = ?');
    $stmt->bind_param('sis', $name, $row['id'], $row['chat_pdf_path']);
    if (!$stmt->execute() || $stmt->affected_rows !== 1) { unlink($target); fwrite(STDERR, "Record update failed; original preserved.\n"); continue; }
    // Remove the public copy only after the database points to the successful private copy.
    if (!unlink($source)) fwrite(STDERR, "Remove the remaining public copy manually.\n");
    echo 'Migrated appointment ' . (int)$row['id'] . "\n";
}
