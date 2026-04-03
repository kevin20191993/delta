<?php
declare(strict_types=1);

$wantsJson = isset($_SERVER["HTTP_ACCEPT"])
  && strpos($_SERVER["HTTP_ACCEPT"], "application/json") !== false;

function respond(bool $ok, string $message, int $status, bool $wantsJson): void
{
  http_response_code($status);

  if ($wantsJson) {
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode(["ok" => $ok, "message" => $message]);
    exit;
  }

  header("Content-Type: text/html; charset=UTF-8");
  $title = $ok ? "Mensaje enviado" : "Error al enviar";
  $safeMessage = htmlspecialchars($message, ENT_QUOTES, "UTF-8");

  echo "<!doctype html>";
  echo "<html lang=\"es\">";
  echo "<head>";
  echo "<meta charset=\"utf-8\">";
  echo "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">";
  echo "<title>{$title}</title>";
  echo "<style>";
  echo "body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#071423;color:#f3f7f9;}";
  echo ".card{max-width:560px;margin:8vh auto;padding:24px;border-radius:18px;";
  echo "background:#0b1d2e;box-shadow:0 18px 45px rgba(0,21,34,0.4);}";
  echo "a{color:#2bc1d7;text-decoration:none;}";
  echo "</style>";
  echo "</head>";
  echo "<body>";
  echo "<div class=\"card\">";
  echo "<h1>{$title}</h1>";
  echo "<p>{$safeMessage}</p>";
  echo "<p><a href=\"/\">Volver al sitio</a></p>";
  echo "</div>";
  echo "</body>";
  echo "</html>";
  exit;
}

function clean_text($value): string
{
  $text = trim((string) $value);
  $text = str_replace(["\r", "\n"], " ", $text);
  $text = strip_tags($text);
  return $text;
}

function encode_header(string $value): string
{
  if (function_exists("mb_encode_mimeheader")) {
    return mb_encode_mimeheader($value, "UTF-8", "B");
  }

  return $value;
}

function normalize_crlf(string $value): string
{
  $value = str_replace(["\r\n", "\r"], "\n", $value);
  return str_replace("\n", "\r\n", $value);
}

function smtp_read($socket, ?int &$code = null): string
{
  $response = "";
  $code = null;

  while (!feof($socket)) {
    $line = fgets($socket, 515);
    if ($line === false) {
      break;
    }

    $response .= $line;

    if (preg_match("/^([0-9]{3})[ ]/", $line, $matches)) {
      $code = (int) $matches[1];
      break;
    }
  }

  return $response;
}

function smtp_command($socket, string $command, array $expectedCodes, string &$error): bool
{
  fwrite($socket, $command . "\r\n");
  $code = null;
  $response = smtp_read($socket, $code);

  if ($code === null || !in_array($code, $expectedCodes, true)) {
    $error = "Respuesta SMTP inesperada: " . trim($response);
    return false;
  }

  return true;
}

function smtp_send(
  array $config,
  string $to,
  string $subject,
  string $body,
  array $headers,
  string &$error
): bool {
  $host = $config["host"] ?? "";
  $port = (int) ($config["port"] ?? 0);
  $username = $config["username"] ?? "";
  $password = $config["password"] ?? "";
  $fromEmail = $config["from_email"] ?? "";
  $encryption = $config["encryption"] ?? "tls";
  $timeout = (int) ($config["timeout"] ?? 15);

  if ($host === "" || $port === 0 || $username === "" || $password === "" || $fromEmail === "") {
    $error = "Configuración SMTP incompleta.";
    return false;
  }

  $transport = $encryption === "ssl" ? "ssl" : "tcp";
  $socket = stream_socket_client(
    "{$transport}://{$host}:{$port}",
    $errno,
    $errstr,
    $timeout,
    STREAM_CLIENT_CONNECT
  );

  if (!$socket) {
    $error = "No se pudo conectar a SMTP: {$errstr} ({$errno}).";
    return false;
  }

  stream_set_timeout($socket, $timeout);

  $code = null;
  $greeting = smtp_read($socket, $code);
  if ($code !== 220) {
    $error = "Saludo SMTP inválido: " . trim($greeting);
    fclose($socket);
    return false;
  }

  $hostname = $_SERVER["SERVER_NAME"] ?? "localhost";

  if (!smtp_command($socket, "EHLO {$hostname}", [250], $error)) {
    fclose($socket);
    return false;
  }

  if ($encryption === "tls") {
    if (!smtp_command($socket, "STARTTLS", [220], $error)) {
      fclose($socket);
      return false;
    }

    if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
      $error = "No se pudo iniciar TLS.";
      fclose($socket);
      return false;
    }

    if (!smtp_command($socket, "EHLO {$hostname}", [250], $error)) {
      fclose($socket);
      return false;
    }
  }

  if (!smtp_command($socket, "AUTH LOGIN", [334], $error)) {
    fclose($socket);
    return false;
  }

  if (!smtp_command($socket, base64_encode($username), [334], $error)) {
    fclose($socket);
    return false;
  }

  if (!smtp_command($socket, base64_encode($password), [235], $error)) {
    fclose($socket);
    return false;
  }

  if (!smtp_command($socket, "MAIL FROM:<{$fromEmail}>", [250], $error)) {
    fclose($socket);
    return false;
  }

  if (!smtp_command($socket, "RCPT TO:<{$to}>", [250, 251], $error)) {
    fclose($socket);
    return false;
  }

  if (!smtp_command($socket, "DATA", [354], $error)) {
    fclose($socket);
    return false;
  }

  $headerLines = array_merge(
    ["Subject: " . encode_header($subject)],
    $headers
  );

  $message = implode("\r\n", $headerLines) . "\r\n\r\n" . normalize_crlf($body);
  $message = preg_replace("/(?m)^\\./", "..", $message);
  fwrite($socket, $message . "\r\n.\r\n");

  $code = null;
  $dataResponse = smtp_read($socket, $code);
  if ($code !== 250) {
    $error = "SMTP no aceptó el mensaje: " . trim($dataResponse);
    fclose($socket);
    return false;
  }

  smtp_command($socket, "QUIT", [221], $error);
  fclose($socket);
  return true;
}

if (($_SERVER["REQUEST_METHOD"] ?? "") !== "POST") {
  respond(false, "Método no permitido.", 405, $wantsJson);
}

$nombre = clean_text($_POST["nombre"] ?? "");
$empresa = clean_text($_POST["empresa"] ?? "");
$correo = clean_text($_POST["correo"] ?? "");
$telefono = clean_text($_POST["telefono"] ?? "");
$mensaje = trim((string) ($_POST["mensaje"] ?? ""));

if ($nombre === "" || $correo === "" || $telefono === "" || $mensaje === "") {
  respond(false, "Faltan campos requeridos.", 400, $wantsJson);
}

if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
  respond(false, "Correo inválido.", 400, $wantsJson);
}

$to = "gerencia@kp-delta-ing-tech.mx";
$subject = "Contacto web - " . ($nombre !== "" ? $nombre : "Sin nombre");

$bodyLines = [
  "Nombre: " . ($nombre !== "" ? $nombre : "No especificado"),
  "Empresa: " . ($empresa !== "" ? $empresa : "No especificada"),
  "Correo: " . $correo,
  "Teléfono: " . ($telefono !== "" ? $telefono : "No especificado"),
  "",
  "Mensaje:",
  $mensaje,
];

$bodyPlain = implode("\n", $bodyLines);

$safeNombre = htmlspecialchars($nombre !== "" ? $nombre : "No especificado", ENT_QUOTES, "UTF-8");
$safeEmpresa = htmlspecialchars($empresa !== "" ? $empresa : "No especificada", ENT_QUOTES, "UTF-8");
$safeCorreo = htmlspecialchars($correo, ENT_QUOTES, "UTF-8");
$safeTelefono = htmlspecialchars($telefono !== "" ? $telefono : "No especificado", ENT_QUOTES, "UTF-8");
$safeMensaje = nl2br(htmlspecialchars($mensaje, ENT_QUOTES, "UTF-8"));

$bodyHtml = "<!doctype html>\n";
$bodyHtml .= "<html lang=\"es\">\n";
$bodyHtml .= "<head><meta charset=\"UTF-8\"><title>Contacto web</title></head>\n";
$bodyHtml .= "<body style=\"font-family:Arial,Helvetica,sans-serif;color:#111;\">\n";
$bodyHtml .= "<h2>Nuevo mensaje desde el sitio</h2>\n";
$bodyHtml .= "<table cellpadding=\"6\" cellspacing=\"0\" style=\"border-collapse:collapse;\">\n";
$bodyHtml .= "<tr><th align=\"left\">Nombre</th><td>{$safeNombre}</td></tr>\n";
$bodyHtml .= "<tr><th align=\"left\">Empresa</th><td>{$safeEmpresa}</td></tr>\n";
$bodyHtml .= "<tr><th align=\"left\">Correo</th><td>{$safeCorreo}</td></tr>\n";
$bodyHtml .= "<tr><th align=\"left\">Teléfono</th><td>{$safeTelefono}</td></tr>\n";
$bodyHtml .= "</table>\n";
$bodyHtml .= "<h3>Mensaje</h3>\n";
$bodyHtml .= "<p>{$safeMensaje}</p>\n";
$bodyHtml .= "</body></html>";

$configPath = __DIR__ . "/config.smtp.php";

if (!file_exists($configPath)) {
  error_log("Falta configuración SMTP: {$configPath}");
  respond(false, "No se pudo enviar. Intenta de nuevo o llámanos.", 500, $wantsJson);
}

$smtpConfig = require $configPath;

$fromEmail = $smtpConfig["from_email"] ?? "no-reply@kp-delta-ing-tech.mx";
$fromName = $smtpConfig["from_name"] ?? "KP DELTA";

if (empty($smtpConfig["password"])) {
  $envPassword = getenv("KP_DELTA_SMTP_PASSWORD");
  if ($envPassword !== false && $envPassword !== "") {
    $smtpConfig["password"] = $envPassword;
  }
}

$smtpConfig["from_email"] = $fromEmail;

$boundary = "b1_" . bin2hex(random_bytes(12));
$dateHeader = gmdate("D, d M Y H:i:s") . " +0000";
$messageId = "<" . bin2hex(random_bytes(16)) . "@kp-delta-ing-tech.mx>";

$headers = [
  "From: " . encode_header($fromName) . " <{$fromEmail}>",
  "Reply-To: {$correo}",
  "To: {$to}",
  "Date: {$dateHeader}",
  "Message-ID: {$messageId}",
  "MIME-Version: 1.0",
  "Content-Type: multipart/alternative; boundary=\"{$boundary}\"",
];

$body = "--{$boundary}\r\n";
$body .= "Content-Type: text/plain; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$body .= normalize_crlf($bodyPlain) . "\r\n\r\n";
$body .= "--{$boundary}\r\n";
$body .= "Content-Type: text/html; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
$body .= normalize_crlf($bodyHtml) . "\r\n\r\n";
$body .= "--{$boundary}--";

$error = "";
$sent = smtp_send($smtpConfig, $to, $subject, $body, $headers, $error);

if (!$sent) {
  error_log("SMTP falló: " . $error);
  respond(false, "No se pudo enviar. Intenta de nuevo o llámanos.", 500, $wantsJson);
}

respond(true, "Mensaje enviado correctamente.", 200, $wantsJson);
