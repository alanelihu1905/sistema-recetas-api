<?php
// server.php
// Este archivo emula el comportamiento de Apache mod_rewrite
// para el servidor HTTP integrado de PHP.

$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)
);

// Este script asume que se arranca desde la carpeta public/
// Si el archivo físico existe, sírvelo directamente
if ($uri !== '/' && file_exists(__DIR__ . $uri)) {
    return false;
}

// En cualquier otro caso, redirigimos a index.php
require_once __DIR__ . '/index.php';
