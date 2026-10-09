<?php
/* Admin login: query by username, verify the stored password hash, then record identity in the PHP session. */
require_once __DIR__ . '/../session.php';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') require_valid_csrf();
require_once __DIR__ . '/../config.php';

if (isset($_SESSION['admin_id'])) {
    header("Location: dashboard.php");
    exit;
}

$error = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = post_text('username');
    $password = is_string($_POST['password'] ?? null) ? $_POST['password'] : '';

    if ($username === "" || $password === "") {
        $error = "Please enter both username and password.";
    } else {
        $stmt = $conn->prepare("SELECT id, username, password_hash FROM admins WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        $admin = $result->fetch_assoc();
        $stmt->close();

        // Verify the submitted password against its one-way hash; no plaintext password is stored.
        if ($admin && password_verify($password, $admin['password_hash'])) {
            session_regenerate_id(true);
            unset($_SESSION['csrf_token']);
            $_SESSION['admin_id'] = $admin['id'];
            $_SESSION['admin_username'] = $admin['username'];
            header("Location: dashboard.php");
            exit;
        } else {
            $error = "Invalid username or password.";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin Login - Doctors Portal</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="../assets/style.css">
    <script src="../assets/theme.js"></script>
</head>
<body>
<nav class="main-navbar"><div class="container d-flex justify-content-between align-items-center flex-wrap gap-3"><a class="navbar-brand" href="../index.php"><img class="portal-brand-icon" src="../assets/brand.svg" alt="">Aura<span class="portal-section">Doctor support</span></a><button type="button" class="btn btn-outline-light btn-sm" data-theme-toggle>Change theme</button></div></nav>
<main class="portal-login">
    <div class="booking-shell">
        <div>
            <h3 class="mb-3 text-center">Admin sign in</h3>
            <?php if ($error): ?>
                <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            <form method="post"><?php echo csrf_field(); ?>
                <div class="mb-3">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" id="username" autocomplete="username" name="username" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" autocomplete="current-password" name="password" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-primary w-100">Login</button>
            </form>
        </div>
    </div>
</main>
</body>
</html>
