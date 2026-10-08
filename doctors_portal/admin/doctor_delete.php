<?php
require_once "_header.php";

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id > 0) {
    $stmt = $conn->prepare("DELETE FROM doctors WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();
}
header("Location: doctors.php");
exit;
