<?php

namespace Core;

/**
 * Objeto de Petición HTTP (Request)
 * ---------------------------------
 * Clase utilitaria inyectada en todos los Controladores.
 * Captura y estandariza la entrada del usuario: extrae el Body (ya sea JSON o form-data),
 * los Query Parameters y unifica la lectura de Headers (esencial para los JWT Tokens).
 */
class Request
{
    public $method;
    public $uri;
    public $body;
    public $query;
    public $params = []; // Para parámetros de URL tipo /recipes/1
    public $user = null; // Para el auth middleware

    public function __construct()
    {
        $this->method = $_SERVER['REQUEST_METHOD'];
        
        // Remove query string and base folder name if running in XAMPP
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $baseFolder = '/backend-recetas/public';
        
        if (strpos($uri, $baseFolder) === 0) {
            $uri = substr($uri, strlen($baseFolder));
        }
        
        $this->uri = $uri === '' ? '/' : $uri;

        $this->query = $_GET;
        
        // Parsear JSON de forma segura
        $input = file_get_contents('php://input');
        $decoded = json_decode($input, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $this->body = $decoded;
        } else {
            $this->body = $_POST;
        }
    }

    public function getHeader($name)
    {
        $headers = getallheaders();
        if (is_array($headers)) {
            $nameLower = strtolower($name);
            foreach ($headers as $key => $value) {
                if (strtolower($key) === $nameLower) return $value;
            }
        }
        $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return $_SERVER[$serverKey] ?? null;
    }
}
