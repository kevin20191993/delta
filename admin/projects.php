<?php
declare(strict_types=1);

require_once __DIR__ . "/lib.php";

admin_require_login();

$data = admin_load_projects();
$projects = $data["projects"];
$config = admin_config();

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $token = $_POST["csrf_token"] ?? "";
  if (!admin_verify_csrf($token)) {
    admin_flash("error", "La sesión expiró, intenta nuevamente.");
    header("Location: projects.php");
    exit;
  }

  $action = $_POST["action"] ?? "";

  if ($action === "create_project") {
    $title = admin_clean_text($_POST["title"] ?? "", 160);
    $description = admin_clean_text($_POST["description"] ?? "", 1200);

    if ($title === "") {
      admin_flash("error", "El proyecto necesita un título.");
      header("Location: projects.php");
      exit;
    }

    $projectId = admin_generate_project_id();
    $now = date("Y-m-d H:i:s");
    $images = admin_save_uploaded_images($projectId, $_FILES["images"] ?? []);

    $projects[] = [
      "id" => $projectId,
      "title" => $title,
      "description" => $description,
      "images" => $images,
      "created_at" => $now,
      "updated_at" => $now,
    ];

    $data["projects"] = $projects;
    admin_save_projects($data);

    admin_flash("success", "Proyecto creado. Puedes editarlo y subir más imágenes.");
    header("Location: project.php?id=" . urlencode($projectId));
    exit;
  }

  if ($action === "delete_project") {
    $projectId = admin_clean_text($_POST["project_id"] ?? "", 80);
    $index = admin_find_project_index($projects, $projectId);

    if ($index === null) {
      admin_flash("error", "No se encontró el proyecto.");
      header("Location: projects.php");
      exit;
    }

    $project = $projects[$index];
    if (!empty($project["images"]) && is_array($project["images"])) {
      foreach ($project["images"] as $image) {
        if (!empty($image["src"])) {
          admin_delete_project_image($image["src"]);
        }
      }
    }

    admin_delete_project_folder($projectId);
    array_splice($projects, $index, 1);
    $data["projects"] = $projects;
    admin_save_projects($data);

    admin_flash("success", "Proyecto eliminado.");
    header("Location: projects.php");
    exit;
  }
}

$flash = admin_get_flash();
$csrf = admin_csrf_token();
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KP DELTA | Proyectos</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body>
  <div class="admin-shell">
    <div class="admin-header">
      <div>
        <div class="admin-title">Proyectos</div>
        <div class="admin-subtitle">Administra proyectos y carruseles del home.</div>
      </div>
      <div class="top-links">
        <a class="btn btn-secondary" href="../index.html" target="_blank" rel="noreferrer">Ver sitio</a>
        <a class="btn btn-secondary" href="logout.php">Cerrar sesión</a>
      </div>
    </div>

    <?php if ($flash): ?>
      <div class="flash <?php echo htmlspecialchars($flash["type"], ENT_QUOTES, "UTF-8"); ?>">
        <?php echo htmlspecialchars($flash["message"], ENT_QUOTES, "UTF-8"); ?>
      </div>
    <?php endif; ?>

    <div class="admin-card">
      <h2>Nuevo proyecto</h2>
      <form method="post" enctype="multipart/form-data">
        <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf, ENT_QUOTES, "UTF-8"); ?>">
        <input type="hidden" name="action" value="create_project">
        <div class="form-row">
          <label for="title">Título</label>
          <input id="title" name="title" type="text" required>
        </div>
        <div class="form-row">
          <label for="description">Descripción</label>
          <textarea id="description" name="description" placeholder="Resumen del proyecto"></textarea>
        </div>
        <div class="form-row">
          <label for="images">Imágenes (opcional)</label>
          <input id="images" name="images[]" type="file" accept="image/*" multiple>
          <div class="hint">Formatos permitidos: JPG, PNG, WebP. Tamaño máximo 6 MB por imagen.</div>
        </div>
        <button class="btn" type="submit">Crear proyecto</button>
      </form>
    </div>

    <div class="admin-card">
      <h2>Proyectos existentes</h2>
      <?php if (empty($projects)): ?>
        <p class="hint">Aún no hay proyectos cargados.</p>
      <?php else: ?>
        <div class="project-list">
          <?php foreach ($projects as $project): ?>
            <div class="project-item">
              <div>
                <strong><?php echo htmlspecialchars($project["title"] ?? "Proyecto", ENT_QUOTES, "UTF-8"); ?></strong>
              </div>
              <div class="hint">
                <?php echo htmlspecialchars($project["description"] ?? "", ENT_QUOTES, "UTF-8"); ?>
              </div>
              <div class="hint">Imágenes: <?php echo isset($project["images"]) ? count((array) $project["images"]) : 0; ?></div>
              <div class="project-actions">
                <a class="btn btn-secondary" href="project.php?id=<?php echo urlencode($project["id"] ?? ""); ?>">Editar</a>
                <form method="post" onsubmit="return confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.');">
                  <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrf, ENT_QUOTES, "UTF-8"); ?>">
                  <input type="hidden" name="action" value="delete_project">
                  <input type="hidden" name="project_id" value="<?php echo htmlspecialchars($project["id"] ?? "", ENT_QUOTES, "UTF-8"); ?>">
                  <button class="btn btn-danger" type="submit">Eliminar</button>
                </form>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>
