<?php
/* Admin overview: aggregate counts and join recent appointment requests with their doctor names. */
require_once "_header.php";

// Stats
$doctors_count = $conn->query("SELECT COUNT(*) AS c FROM doctors")->fetch_assoc()['c'];
$appt_count = $conn->query("SELECT COUNT(*) AS c FROM appointments")->fetch_assoc()['c'];
$pending_count = $conn->query("SELECT COUNT(*) AS c FROM appointments WHERE status='pending'")->fetch_assoc()['c'];

// Join doctor names into the newest five requests for the dashboard preview.
$recent = $conn->query("
    SELECT a.*, d.name AS doctor_name
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    ORDER BY a.created_at DESC
    LIMIT 5
");
?>
<h1 class="mb-4">Dashboard</h1>

<div class="row mb-4">
    <div class="col-md-4">
        <div class="card text-bg-primary mb-3">
            <div class="card-body">
                <h5 class="card-title">Doctors</h5>
                <p class="card-text display-6"><?php echo $doctors_count; ?></p>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card text-bg-success mb-3">
            <div class="card-body">
                <h5 class="card-title">Total Appointments</h5>
                <p class="card-text display-6"><?php echo $appt_count; ?></p>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card text-bg-warning mb-3">
            <div class="card-body">
                <h5 class="card-title">Pending</h5>
                <p class="card-text display-6"><?php echo $pending_count; ?></p>
            </div>
        </div>
    </div>
</div>

<h3>Recent Appointments</h3>
<div class="table-responsive">
<table class="table table-striped">
    <thead>
        <tr>
            <th>Doctor</th>
            <th>Patient</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
        </tr>
    </thead>
    <tbody>
        <?php if ($recent && $recent->num_rows > 0): ?>
            <?php while ($row = $recent->fetch_assoc()): ?>
                <tr>
                    <td><?php echo htmlspecialchars($row['doctor_name']); ?></td>
                    <td><?php echo htmlspecialchars($row['patient_name']); ?></td>
                    <td><?php echo htmlspecialchars($row['appointment_date']); ?></td>
                    <td><?php echo htmlspecialchars($row['appointment_time']); ?></td>
                    <td><?php echo htmlspecialchars($row['status']); ?></td>
                </tr>
            <?php endwhile; ?>
        <?php else: ?>
            <tr><td colspan="5">No appointments yet.</td></tr>
        <?php endif; ?>
    </tbody>
</table>
</div>

<?php require_once "_footer.php"; ?>
