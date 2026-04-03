<?php
declare(strict_types=1);

require_once __DIR__ . "/config.php";

function admin_config(): array
{
  global $admin_config;
  return $admin_config;
}

function admin_start_session(): void
{
  if (session_status() === PHP_SESSION_ACTIVE) {
    return;
  }

  $config = admin_config();
  if (!empty($config["session_name"])) {
    session_name($config["session_name"]);
  }
  session_start();
}

function admin_is_logged_in(): bool
{
  admin_start_session();
  return !empty($_SESSION["admin_logged_in"]);
}

function admin_require_login(): void
{
  if (!admin_is_logged_in()) {
    header("Location: index.php");
    exit;
  }
}

function admin_password_configured(): bool
{
  $config = admin_config();
  return !empty($config["password_hash"]);
}

function admin_verify_login(string $user, string $password): bool
{
  $config = admin_config();
  if (!admin_password_configured()) {
    return false;
  }
  if ($user !== ($config["user"] ?? "")) {
    return false;
  }
  return password_verify($password, $config["password_hash"]);
}

function admin_logout(): void
{
  admin_start_session();
  $_SESSION = [];
  if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), "", time() - 42000, $params["path"], $params["domain"], $params["secure"], $params["httponly"]);
  }
  session_destroy();
}

function admin_csrf_token(): string
{
  admin_start_session();
  if (empty($_SESSION["csrf_token"])) {
    $_SESSION["csrf_token"] = bin2hex(random_bytes(16));
  }
  return $_SESSION["csrf_token"];
}

function admin_verify_csrf(?string $token): bool
{
  admin_start_session();
  return isset($_SESSION["csrf_token"]) && $token !== null
    && hash_equals($_SESSION["csrf_token"], $token);
}

function admin_flash(string $type, string $message): void
{
  admin_start_session();
  $_SESSION["flash"] = ["type" => $type, "message" => $message];
}

function admin_get_flash(): ?array
{
  admin_start_session();
  if (empty($_SESSION["flash"])) {
    return null;
  }
  $flash = $_SESSION["flash"];
  unset($_SESSION["flash"]);
  return $flash;
}

function admin_limit_text(string $value, int $limit): string
{
  if (function_exists("mb_substr")) {
    return mb_substr($value, 0, $limit);
  }
  return substr($value, 0, $limit);
}

function admin_clean_text($value, int $limit = 2000): string
{
  $text = trim((string) $value);
  $text = preg_replace("/\\s+/", " ", $text);
  $text = strip_tags($text);
  return admin_limit_text($text, $limit);
}

function admin_load_projects(): array
{
  $config = admin_config();
  $file = $config["data_file"];

  if (!file_exists($file)) {
    return ["projects" => []];
  }

  $json = file_get_contents($file);
  if ($json === false) {
    return ["projects" => []];
  }

  $data = json_decode($json, true);
  if (!is_array($data) || !isset($data["projects"]) || !is_array($data["projects"])) {
    return ["projects" => []];
  }

  return $data;
}

function admin_save_projects(array $data): void
{
  $config = admin_config();
  $file = $config["data_file"];
  $payload = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
  if ($payload === false) {
    $payload = "{\"projects\":[]}";
  }
  file_put_contents($file, $payload . PHP_EOL, LOCK_EX);
}

function admin_generate_project_id(): string
{
  return "proj-" . date("Ymd-His") . "-" . bin2hex(random_bytes(3));
}

function admin_find_project(array $projects, string $id): ?array
{
  foreach ($projects as $project) {
    if (($project["id"] ?? "") === $id) {
      return $project;
    }
  }
  return null;
}

function admin_find_project_index(array $projects, string $id): ?int
{
  foreach ($projects as $index => $project) {
    if (($project["id"] ?? "") === $id) {
      return $index;
    }
  }
  return null;
}

function admin_prepare_upload_dir(string $projectId): string
{
  $config = admin_config();
  $root = $config["upload_root"];
  $projectDir = rtrim($root, "/") . "/" . $projectId;

  if (!is_dir($projectDir)) {
    mkdir($projectDir, 0775, true);
  }

  return $projectDir;
}

function admin_is_image_file(string $tmpPath, string &$extension): bool
{
  $allowed = [
    "image/jpeg" => "jpg",
    "image/png" => "png",
    "image/webp" => "webp",
  ];

  $mime = "";
  if (class_exists("finfo")) {
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string) $finfo->file($tmpPath);
  } else {
    $imageInfo = getimagesize($tmpPath);
    if ($imageInfo && isset($imageInfo["mime"])) {
      $mime = (string) $imageInfo["mime"];
    }
  }

  if ($mime === "" || !isset($allowed[$mime])) {
    return false;
  }

  $extension = $allowed[$mime];
  return true;
}

function admin_save_uploaded_images(string $projectId, array $files): array
{
  $config = admin_config();
  $maxSize = (int) ($config["max_image_size"] ?? 0);
  $saved = [];

  if (empty($files["name"])) {
    return $saved;
  }

  $names = is_array($files["name"]) ? $files["name"] : [$files["name"]];
  $tmpNames = is_array($files["tmp_name"]) ? $files["tmp_name"] : [$files["tmp_name"]];
  $errors = is_array($files["error"]) ? $files["error"] : [$files["error"]];
  $sizes = is_array($files["size"]) ? $files["size"] : [$files["size"]];

  $projectDir = admin_prepare_upload_dir($projectId);

  foreach ($names as $index => $name) {
    if (($errors[$index] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
      continue;
    }

    $tmpPath = $tmpNames[$index] ?? "";
    if ($tmpPath === "" || !is_uploaded_file($tmpPath)) {
      continue;
    }

    $size = (int) ($sizes[$index] ?? 0);
    if ($maxSize > 0 && $size > $maxSize) {
      continue;
    }

    $extension = "";
    if (!admin_is_image_file($tmpPath, $extension)) {
      continue;
    }

    $safeName = bin2hex(random_bytes(8)) . "." . $extension;
    $targetPath = $projectDir . "/" . $safeName;

    if (!move_uploaded_file($tmpPath, $targetPath)) {
      continue;
    }

    $relative = "uploads/projects/" . $projectId . "/" . $safeName;
    $saved[] = ["src" => $relative, "alt" => ""];
  }

  return $saved;
}

function admin_delete_project_image(string $relativePath): bool
{
  $config = admin_config();
  $base = realpath($config["upload_root"]);
  if ($base === false) {
    return false;
  }

  $fullPath = realpath(__DIR__ . "/../" . ltrim($relativePath, "/"));
  if ($fullPath === false || strpos($fullPath, $base) !== 0) {
    return false;
  }

  if (!is_file($fullPath)) {
    return false;
  }

  return unlink($fullPath);
}

function admin_delete_project_folder(string $projectId): void
{
  $config = admin_config();
  $folder = rtrim($config["upload_root"], "/") . "/" . $projectId;
  if (!is_dir($folder)) {
    return;
  }

  $files = glob($folder . "/*");
  if (is_array($files)) {
    foreach ($files as $file) {
      if (is_file($file)) {
        unlink($file);
      }
    }
  }

  @rmdir($folder);
}
