<?php
declare(strict_types=1);

require_once __DIR__ . "/lib.php";

admin_start_session();

if (admin_is_logged_in()) {
  header("Location: projects.php");
  exit;
}

$errors = [];
$config = admin_config();
$setupRequired = !admin_password_configured();

if ($_SERVER["REQUEST_METHOD"] === "POST" && !$setupRequired) {
  $token = $_POST["csrf_token"] ?? "";
  if (!admin_verify_csrf($token)) {
    $errors[] = "La sesión expiró, intenta nuevamente.";
  } else {
    $user = admin_clean_text($_POST["usuario"] ?? "", 60);
    $password = (string) ($_POST["password"] ?? "");

    if (admin_verify_login($user, $password)) {
      $_SESSION["admin_logged_in"] = true;
      admin_flash("success", "Bienvenido. Sesión iniciada.");
      header("Location: projects.php");
      exit;
    }
    $errors[] = "Usuario o contraseña incorrectos.";
  }
}

$csrf = admin_csrf_token();
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KP DELTA | Acceso a proyectos</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body>
  <div class="admin-shell login-wrap">
    <div class="admin-card">
      <div class="admin-header">
        <div>
          <div class="admin-title">Panel de proyectos</div>
          <div class="admin-subtitle">Acceso restringido</div>
        </div>
      </div>

      <?php if ($setupRequired): ?>
        <div class="flash error">
          Aún no se configura una contraseña de acceso. Edita
          <code>admin/config.php</code> y agrega un hash en <code>password_hash</code>.
        </div>
        <p class="hint">Ejemplo para generar el hash:</p>
        <p><code>php -r "echo password_hash('TU_CONTRASEÑA', PASSWORD_DEFAULT);"</code></p>
      <?php endif; ?>

      <?php if (!empty($errors)): ?>
        <div class="flash error"><?php echo htmlspecialchars(implode(" ", $errors), ENT_QUOTES, "UTF-8"); ?></div>
      <?php endif; ?>

      <form method="post" <?php echo $setupRequired ? "aria-disabled=\"true\"" : ""; ?>>
        <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf, ENT_QUOTES, "UTF-8"); ?>">
        <div class="form-row">
          <label for="usuario">Usuario</label>
          <input id="usuario" name="usuario" type="text" autocomplete="username" required <?php echo $setupRequired ? "disabled" : ""; ?>>
        </div>
        <div class="form-row">
          <label for="password">Contraseña</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required <?php echo $setupRequired ? "disabled" : ""; ?>>
        </div>
        <button class="btn" type="submit" <?php echo $setupRequired ? "disabled" : ""; ?>>Entrar</button>
      </form>
    </div>
  </div>
</body>
</html>
