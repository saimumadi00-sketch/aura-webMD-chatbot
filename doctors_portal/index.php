<?php
/* Public doctor directory: query doctors alphabetically and render escaped database values into booking cards. */
require_once "config.php";

// Listing cards use this query result; booking links carry the selected doctor ID.
$result = $conn->query("SELECT * FROM doctors ORDER BY name");
// Separate PHP hosts can link back to the frontend; packaged deployments use ../.
$app_url = getenv('AURA_APP_URL') ?: '../';
if ($app_url !== '../' && (!filter_var($app_url, FILTER_VALIDATE_URL) || !in_array(strtolower(parse_url($app_url, PHP_URL_SCHEME) ?: ''), ['http', 'https'], true))) $app_url = '../';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Aura | Doctor support</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

    <link rel="stylesheet" href="assets/style.css">
    <script src="assets/theme.js"></script>
</head>

<body class="page-doctors">
<div class="gradient-bar"></div>
<nav class="navbar navbar-expand-lg navbar-dark main-navbar">

    <div class="container">
        <a class="navbar-brand" href="index.php"><img class="portal-brand-icon" src="assets/brand.svg" alt="">Aura<span class="portal-section">Doctor support</span></a>
        <div class="portal-nav">
            <a class="btn btn-outline-light btn-sm" href="<?php echo htmlspecialchars($app_url, ENT_QUOTES, 'UTF-8'); ?>">Back to Aura</a>
            <button type="button" data-theme-toggle class="btn btn-outline-light btn-sm">Change theme</button>
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
        Browse the doctor directory and request an appointment. You can optionally share a conversation summary to give your doctor context.
      </p>
    </section>

    <?php if ($result && $result->num_rows > 0): ?>
      <section class="doctors-grid">
        <div class="row g-4">
          <?php while ($row = $result->fetch_assoc()): ?>
            <div class="col-md-6 col-lg-4">
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




