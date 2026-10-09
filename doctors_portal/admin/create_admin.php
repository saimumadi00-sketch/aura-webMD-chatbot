<?php
/* Server-shell provisioning: reject web requests before database access and store a password hash for the requested username. */
// Provisioning is restricted to a shell on the server, including the first admin.
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Administrator creation is available only from the server command line.');
}
$username = trim($argv[1] ?? '');
$password = getenv('AURA_ADMIN_PASSWORD');
if ($username === '' || !$password || strlen($password) < 12) {
    fwrite(STDERR, "Usage: php create_admin.php USERNAME (set AURA_ADMIN_PASSWORD to at least 12 characters)\n");
    exit(1);
}
require_once __DIR__ . '/../config.php';
$stmt = $conn->prepare('SELECT id FROM admins WHERE username = ?');
$stmt->bind_param('s', $username);
$stmt->execute();
if ($stmt->get_result()->fetch_assoc()) {
    fwrite(STDERR, "Username already exists.\n");
    exit(1);
}
$stmt->close();
// Store only the hash; the login page uses password_verify against this value.
$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $conn->prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)');
$stmt->bind_param('ss', $username, $hash);
if (!$stmt->execute()) {
    fwrite(STDERR, "Could not create administrator.\n");
    exit(1);
}
$stmt->close();
echo "Administrator created.\n";
