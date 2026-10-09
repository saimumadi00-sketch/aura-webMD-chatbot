<?php
/* Apply CSRF-protected status updates before emitting the table layout. */
require_once __DIR__ . '/_auth.php';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $id = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
    $status = post_text('set_status');
    if (!$id || $id < 1 || !in_array($status, ['pending', 'approved', 'cancelled'], true)) {
        http_response_code(400); exit('Invalid appointment status update.');
    }
    $stmt = $conn->prepare('UPDATE appointments SET status = ? WHERE id = ?');
    $stmt->bind_param('si', $status, $id);
    if (!$stmt->execute()) { http_response_code(500); exit('Could not update appointment.'); }
    header('Location: appointments.php', true, 303); exit;
}
$result = $conn->query('SELECT a.*, d.name AS doctor_name FROM appointments a JOIN doctors d ON a.doctor_id = d.id ORDER BY a.appointment_date DESC, a.appointment_time DESC');
require_once __DIR__ . '/_header.php';
?>
<h1 class="mb-4">Appointments</h1>
<div class="table-responsive">
<table class="table table-striped table-sm">
<thead><tr><th>ID</th><th>Doctor</th><th>Patient</th><th>Date</th><th>Time</th><th>Status</th><th>Contact</th><th>Reason</th><th>Chat PDF</th><th>Change Status</th></tr></thead>
<tbody>
<?php if ($result && $result->num_rows > 0): ?>
<?php while ($row = $result->fetch_assoc()): ?>
<tr>
<td><?php echo (int)$row['id']; ?></td>
<td><?php echo htmlspecialchars($row['doctor_name']); ?></td>
<td><?php echo htmlspecialchars($row['patient_name']); ?></td>
<td><?php echo htmlspecialchars($row['appointment_date']); ?></td>
<td><?php echo htmlspecialchars($row['appointment_time']); ?></td>
<td><?php echo htmlspecialchars($row['status']); ?></td>
<td><?php echo htmlspecialchars($row['patient_email']); ?><br><?php echo htmlspecialchars($row['patient_phone']); ?></td>
<td><?php echo nl2br(htmlspecialchars($row['reason'])); ?></td>
<td><?php if (!empty($row['chat_pdf_path'])): ?><a href="chat_pdf.php?id=<?php echo (int)$row['id']; ?>">Download PDF</a><?php else: ?>-<?php endif; ?></td>
<td>
<?php foreach (['pending' => 'Pending', 'approved' => 'Approve', 'cancelled' => 'Cancel'] as $value => $label): ?>
<form method="post" class="d-inline">
<?php echo csrf_field(); ?>
<input type="hidden" name="id" value="<?php echo (int)$row['id']; ?>">
<button class="btn btn-sm btn-outline-secondary" name="set_status" value="<?php echo $value; ?>"><?php echo $label; ?></button>
</form>
<?php endforeach; ?>
</td>
</tr>
<?php endwhile; ?>
<?php else: ?><tr><td colspan="10">No appointments found.</td></tr><?php endif; ?>
</tbody></table></div>
<?php require_once __DIR__ . '/_footer.php'; ?>
