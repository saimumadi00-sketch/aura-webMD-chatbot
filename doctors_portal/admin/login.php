<?php
require_once "../config.php";

if (isset($_SESSION['admin_id'])) {
    header("Location: dashboard.php");
    exit;
}

$error = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? "");
    $password = $_POST['password'] ?? "";

    if ($username === "" || $password === "") {
        $error = "Please enter both username and password.";
    } else {
        $stmt = $conn->prepare("SELECT id, username, password_hash FROM admins WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        $admin = $result->fetch_assoc();
        $stmt->close();

        if ($admin && password_verify($password, $admin['password_hash'])) {
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
<html>
<head>
    <meta charset="utf-8">
    <title>Admin Login - Doctors Portal</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
<div class="container">
    <div class="row justify-content-center mt-5">
        <div class="col-md-4">
            <h3 class="mb-3 text-center">Admin Login</h3>
            <?php if ($error): ?>
                <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            <form method="post">
                <div class="mb-3">
                    <label class="form-label">Username</label>
                    <input type="text" name="username" class="form-control" required>
                </div>
                <div class="mb-3">
                    <label class="form-label">Password</label>
                    <input type="password" name="password" class="form-control" required>
                </div>
                <button type="submit" class="btn btn-primary w-100">Login</button>
            </form>
        </div>
    </div>
</div>
</body>
</html>
