<?php
require_once "_header.php";

// Handle status update
if (isset($_GET['id'], $_GET['set_status'])) {
    $id = (int)$_GET['id'];
    $new_status = $_GET['set_status'];
    $allowed = ['pending', 'approved', 'cancelled'];
    if ($id > 0 && in_array($new_status, $allowed, true)) {
        $stmt = $conn->prepare("UPDATE appointments SET status=? WHERE id=?");
        $stmt->bind_param("si", $new_status, $id);
        $stmt->execute();
        $stmt->close();
        header("Location: appointments.php");
        exit;
    }
}

// Load appointments
$sql = "
    SELECT a.*, d.name AS doctor_name
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
";
$result = $conn->query($sql);
?>
<h1 class="mb-4">Appointments</h1>

<table class="table table-striped table-sm">
    <thead>
  <tr>
    <th>ID</th>
    <th>Doctor</th>
    <th>Patient</th>
    <th>Date</th>
    <th>Time</th>
    <th>Status</th>
    <th>Contact</th>
    <th>Reason</th>
    <th>Chat PDF</th>
    <th>Change Status</th>
  </tr>
</thead>

    <tbody>
    <?php if ($result && $result->num_rows > 0): ?>
        <?php while ($row = $result->fetch_assoc()): ?>
            <tr>
                <td><?php echo $row['id']; ?></td>
                <td><?php echo htmlspecialchars($row['doctor_name']); ?></td>
                <td><?php echo htmlspecialchars($row['patient_name']); ?></td>
                <td><?php echo htmlspecialchars($row['appointment_date']); ?></td>
                <td><?php echo htmlspecialchars($row['appointment_time']); ?></td>
                <td>
  <?php if (!empty($row['chat_pdf_path'])): ?>
    <a href="../<?php echo htmlspecialchars($row['chat_pdf_path']); ?>" target="_blank">
      View PDF
    </a>
  <?php else: ?>
    -
  <?php endif; ?>
</td>
<td><?php echo htmlspecialchars($row['status']); ?></td>
                <td>
                    <?php echo htmlspecialchars($row['patient_email']); ?><br>
                    <?php echo htmlspecialchars($row['patient_phone']); ?>
                </td>
                <td><?php echo nl2br(htmlspecialchars($row['reason'])); ?></td>
                <td>
                    <a class="btn btn-sm btn-outline-secondary"
                       href="appointments.php?id=<?php echo $row['id']; ?>&set_status=pending">
                       Pending
                    </a>
                    <a class="btn btn-sm btn-outline-success"
                       href="appointments.php?id=<?php echo $row['id']; ?>&set_status=approved">
                       Approve
                    </a>
                    <a class="btn btn-sm btn-outline-danger"
                       href="appointments.php?id=<?php echo $row['id']; ?>&set_status=cancelled">
                       Cancel
                    </a>
                </td>
            </tr>
        <?php endwhile; ?>
    <?php else: ?>
        <tr><td colspan="9">No appointments found.</td></tr>
    <?php endif; ?>
    </tbody>
</table>

<?php require_once "_footer.php"; ?>
