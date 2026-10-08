<?php
require_once "_header.php";

$result = $conn->query("SELECT * FROM doctors ORDER BY name");
?>
<h1 class="mb-4">Doctors</h1>

<a href="doctor_add.php" class="btn btn-primary mb-3">Add Doctor</a>

<table class="table table-striped">
    <thead>
        <tr>
            <th>Name</th>
            <th>Specialty</th>
            <th>Hospital / City</th>
            <th>Fee</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
    <?php if ($result && $result->num_rows > 0): ?>
        <?php while ($row = $result->fetch_assoc()): ?>
            <tr>
                <td><?php echo htmlspecialchars($row['name']); ?></td>
                <td><?php echo htmlspecialchars($row['specialty']); ?></td>
                <td>
                    <?php echo htmlspecialchars($row['hospital']); ?>
                    <?php if (!empty($row['city'])) echo " • " . htmlspecialchars($row['city']); ?>
                </td>
                <td><?php echo htmlspecialchars($row['fee']); ?></td>
                <td>
                    <a class="btn btn-sm btn-secondary" href="doctor_edit.php?id=<?php echo $row['id']; ?>">Edit</a>
                    <a class="btn btn-sm btn-danger"
                       href="doctor_delete.php?id=<?php echo $row['id']; ?>"
                       onclick="return confirm('Delete this doctor? This will also delete their appointments.');">
                        Delete
                    </a>
                </td>
            </tr>
        <?php endwhile; ?>
    <?php else: ?>
        <tr><td colspan="5">No doctors found.</td></tr>
    <?php endif; ?>
    </tbody>
</table>

<?php require_once "_footer.php"; ?>
