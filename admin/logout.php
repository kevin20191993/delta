<?php
declare(strict_types=1);

require_once __DIR__ . "/lib.php";

admin_logout();
header("Location: index.php");
exit;
