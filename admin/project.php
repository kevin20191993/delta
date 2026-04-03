<?php
declare(strict_types=1);

require_once __DIR__ . "/lib.php";

admin_require_login();

$data = admin_load_projects();
$projects = $data["projects"];

$projectId = admin_clean_text($_GET["id"] ?? "", 80);
$projectIndex = $projectId !== "" ? admin_find_project_index($projects, $projectId) : null;

if ($projectIndex === null) {
  admin_flash("error", "Proyecto no encontrado.");
  header("Location: projects.php");
  exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $token = $_POST["csrf_token"] ?? "";
  if (!admin_verify_csrf($token)) {
    admin_flash("error", "La sesión expiró, intenta nuevamente.");
    header("Location: project.php?id=" . urlencode($projectId));
    exit;
  }

  $action = $_POST["action"] ?? "";

  if ($action === "update_project") {
    $title = admin_clean_text($_POST["title"] ?? "", 160);
    $description = admin_clean_text($_POST["description"] ?? "", 1200);

    if ($title === "") {
      admin_flash("error", "El proyecto necesita un título.");
    } else {
      $projects[$projectIndex]["title"] = $title;
      $projects[$projectIndex]["description"] = $description;
      $projects[$projectIndex]["updated_at"] = date("Y-m-d H:i:s");
      $data["projects"] = $projects;
      admin_save_projects($data);
      admin_flash("success", "Proyecto actualizado.");
    }

    header("Location: project.php?id=" . urlencode($projectId));
    exit;
  }

  if ($action === "add_images") {
    $newImages = admin_save_uploaded_images($projectId, $_FILES["images"] ?? []);
    if (!empty($newImages)) {
      $projects[$projectIndex]["images"] = array_values(array_merge($projects[$projectIndex]["images"] ?? [], $newImages));
      $projects[$projectIndex]["updated_at"] = date("Y-m-d H:i:s");
      $data["projects"] = $projects;
      admin_save_projects($data);
      admin_flash("success", "Imágenes agregadas.");
    } else {
      admin_flash("error", "No se pudieron subir las imágenes.");
    }

    header("Location: project.php?id=" . urlencode($projectId));
    exit;
  }

  if ($action === "delete_image") {
    $imageSrc = admin_clean_text($_POST["image_src"] ?? "", 300);
    $images = $projects[$projectIndex]["images"] ?? [];
    $updated = [];
    $removed = false;

    foreach ((array) $images as $image) {
      if (!$removed && isset($image["src"]) && $image["src"] === $imageSrc) {
        admin_delete_project_image($imageSrc);
        $removed = true;
        continue;
      }
      $updated[] = $image;
    }

    if ($removed) {
      $projects[$projectIndex]["images"] = $updated;
      $projects[$projectIndex]["updated_at"] = date("Y-m-d H:i:s");
      $data["projects"] = $projects;
      admin_save_projects($data);
      admin_flash("success", "Imagen eliminada.");
    } else {
      admin_flash("error", "No se encontró la imagen.");
    }

    header("Location: project.php?id=" . urlencode($projectId));
    exit;
  }
}

$project = $projects[$projectIndex];
$flash = admin_get_flash();
$csrf = admin_csrf_token();
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KP DELTA | Editar proyecto</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body>
  <div class="admin-shell">
    <div class="admin-header">
      <div>
        <div class="admin-title">Editar proyecto</div>
        <div class="admin-subtitle"><?php echo htmlspecialchars($project["title"] ?? "", ENT_QUOTES, "UTF-8"); ?></div>
      </div>
      <div class="top-links">
        <a class="btn btn-secondary" href="projects.php">Volver a proyectos</a>
        <a class="btn btn-secondary" href="logout.php">Cerrar sesión</a>
      </div>
    </div>

    <?php if ($flash): ?>
      <div class="flash <?php echo htmlspecialchars($flash["type"], ENT_QUOTES, "UTF-8"); ?>">
        <?php echo htmlspecialchars($flash["message"], ENT_QUOTES, "UTF-8"); ?>
      </div>
    <?php endif; ?>

    <div class="admin-card">
      <h2>Datos del proyecto</h2>
      <form method="post">
        <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf, ENT_QUOTES, "UTF-8"); ?>">
        <input type="hidden" name="action" value="update_project">
        <div class="form-row">
          <label for="title">Título</label>
          <input id="title" name="title" type="text" value="<?php echo htmlspecialchars($project["title"] ?? "", ENT_QUOTES, "UTF-8"); ?>" required>
        </div>
        <div class="form-row">
          <label for="description">Descripción</label>
          <textarea id="description" name="description"><?php echo htmlspecialchars($project["description"] ?? "", ENT_QUOTES, "UTF-8"); ?></textarea>
        </div>
        <button class="btn" type="submit">Guardar cambios</button>
      </form>
    </div>

    <div class="admin-card">
      <h2>Agregar imágenes</h2>
      <form method="post" enctype="multipart/form-data">
        <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf, ENT_QUOTES, "UTF-8"); ?>">
        <input type="hidden" name="action" value="add_images">
        <div class="form-row">
          <label for="images">Selecciona imágenes</label>
          <input id="images" name="images[]" type="file" accept="image/*" multiple>
        </div>
        <button class="btn" type="submit">Subir imágenes</button>
      </form>
    </div>

    <div class="admin-card">
      <h2>Imágenes actuales</h2>
      <?php if (empty($project["images"])): ?>
        <p class="hint">Aún no hay imágenes en este proyecto.</p>
      <?php else: ?>
        <div class="image-grid">
          <?php foreach ($project["images"] as $image): ?>
            <div class="image-card">
              <img src="../<?php echo htmlspecialchars($image["src"], ENT_QUOTES, "UTF-8"); ?>" alt="">
              <form method="post" onsubmit="return confirm('¿Eliminar esta imagen?');">
                <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf, ENT_QUOTES, "UTF-8"); ?>">
                <input type="hidden" name="action" value="delete_image">
                <input type="hidden" name="image_src" value="<?php echo htmlspecialchars($image["src"], ENT_QUOTES, "UTF-8"); ?>">
                <button class="btn btn-danger" type="submit">Eliminar</button>
              </form>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>
