<?php
require_once "config.php";

$result = $conn->query("SELECT * FROM doctors ORDER BY name");
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Doctors Portal</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Fonts + custom styles -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/style.css">
</head>

<body class="page-doctors">
<div class="gradient-bar"></div>
<nav class="navbar navbar-expand-lg navbar-dark main-navbar">

    <div class="container">
        <a class="navbar-brand" href="index.php">Doctors Portal</a>
        <div class="d-flex">
            <a class="btn btn-outline-light btn-sm" href="admin/login.php">Admin Login</a>
        </div>
    </div>
</nav>

<main class="main-shell">
  <div class="container py-5">
    <section class="hero mb-5">
      <p class="hero-eyebrow">Need professional support?</p>
      <h1 class="hero-title">Find a doctor who understands your story.</h1>
      <p class="hero-subtitle">
        Browse trusted professionals and share your chat history so they can start with context from day one.
      </p>
    </section>

    <?php if ($result && $result->num_rows > 0): ?>
      <section class="doctors-grid">
        <div class="row g-4">
          <?php while ($row = $result->fetch_assoc()): ?>
            <div class="col-md-4 fade-in-up">
              <div class="card doctor-card h-100">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title mb-0">
                      <?php echo htmlspecialchars($row['name']); ?>
                    </h5>
                    <?php if (!empty($row['specialty'])): ?>
                      <span class="doctor-badge">
                        <?php echo htmlspecialchars($row['specialty']); ?>
                      </span>
                    <?php endif; ?>
                  </div>

                  <?php if (!empty($row['hospital']) || !empty($row['city'])): ?>
                    <p class="doctor-location mb-2">
                      <?php echo htmlspecialchars($row['hospital']); ?>
                      <?php if (!empty($row['city'])) echo " &bull; " . htmlspecialchars($row['city']); ?>
                    </p>
                  <?php endif; ?>

                  <?php if (!empty($row['fee'])): ?>
                    <p class="mb-0">
                      <small>Consultation fee</small><br>
                      <strong><?php echo htmlspecialchars($row['fee']); ?></strong>
                    </p>
                  <?php endif; ?>
                </div>
                <div class="card-footer d-flex justify-content-end bg-transparent border-0">
                  <a class="btn btn-sm btn-glow"
                     href="book.php?doctor_id=<?php echo $row['id']; ?>">
                    Book appointment
                  </a>
                </div>
              </div>
            </div>
          <?php endwhile; ?>
        </div>
      </section>
    <?php else: ?>
      <div class="empty-state mt-4">
        <h2>No doctors yet</h2>
        <p>Ask the admin to add doctors in the portal. They will appear here automatically.</p>
      </div>
    <?php endif; ?>
  </div>
</main>

</body>
</html>




