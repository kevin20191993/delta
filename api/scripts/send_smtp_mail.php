<?php
declare(strict_types=1);

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

  $hostname = gethostname() ?: "localhost";

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

$input = stream_get_contents(STDIN);
$payload = json_decode($input ?: "{}", true);

if (!is_array($payload)) {
  fwrite(STDERR, "JSON inválido.\n");
  exit(1);
}

$config = require dirname(__DIR__) . '/../config.smtp.php';
$to = (string) ($payload["to"] ?? "");
$subject = (string) ($payload["subject"] ?? "");
$text = (string) ($payload["text"] ?? "");

if ($to === "" || $subject === "" || $text === "") {
  fwrite(STDERR, "Faltan datos para enviar el correo.\n");
  exit(1);
}

$headers = [
  "From: " . encode_header((string) ($config["from_name"] ?? "KP Delta")) . " <" . ($config["from_email"] ?? "") . ">",
  "To: <{$to}>",
  "MIME-Version: 1.0",
  "Content-Type: text/plain; charset=UTF-8",
  "Content-Transfer-Encoding: 8bit",
];

$error = "";

if (!smtp_send($config, $to, $subject, $text, $headers, $error)) {
  fwrite(STDERR, $error . "\n");
  exit(1);
}

echo "ok\n";
