<?php

/**
 * Front Controller & Entry Point
 * ------------------------------
 * Este archivo actúa como el único punto de entrada (Single Entry Point) de la API REST Backend.
 * Recibe absolutamente todas las peticiones desde el cliente React. Define las cabeceras de CORS,
 * invoca la configuración de Router y establece explícitamente qué métodos / URLs (Endpoint)
 * ejecutarán qué Controladores de PHP según su nivel de protección (Público vs Privado).
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Core\Router;
use Core\Request;

// Habilitar errores para entorno de desarrollo (local)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Configuración de CORS nativa (ya que php -S ignora .htaccess)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");
header("Access-Control-Allow-Methods: PUT, GET, POST, DELETE, OPTIONS");

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

$router = new Router();
$request = new Request();

// Endpoints Auth
$router->post('/api/auth/register', ['Controllers\AuthController', 'register']);
$router->post('/api/auth/login', ['Controllers\AuthController', 'login']);

// Rutas Públicas de Recetas
$router->get('/api/recipes/recommended', ['Controllers\RecipeController', 'recommended']);
$router->get('/api/recipes/([0-9]+)', ['Controllers\RecipeController', 'show']);
$router->get('/api/recipes', ['Controllers\RecipeController', 'index']);

// Rutas Públicas de Usuarios (Perfil)
$router->get('/api/users/([0-9]+)', ['Controllers\UserController', 'show']);
$router->post('/api/users/profile', function(Request $request) {
    \Middlewares\AuthMiddleware::handle($request);
    $controller = new \Controllers\UserController();
    $controller->update($request);
});

// Rutas Protegidas (Requieren Token)
$router->post('/api/recipes', function(Request $request) {
    \Middlewares\AuthMiddleware::handle($request);
    $controller = new \Controllers\RecipeController();
    $controller->store($request);
});
$router->put('/api/recipes/([0-9]+)', function(Request $request) {
    \Middlewares\AuthMiddleware::handle($request);
    $controller = new \Controllers\RecipeController();
    $controller->update($request);
});
$router->delete('/api/recipes/([0-9]+)', function(Request $request) {
    \Middlewares\AuthMiddleware::handle($request);
    $controller = new \Controllers\RecipeController();
    $controller->destroy($request);
});
$router->post('/api/categories', function(Request $request) {
    \Middlewares\AuthMiddleware::handle($request);
    $controller = new \Controllers\CategoryController();
    $controller->store($request);
});

// Rutas de Likes (Requieren Token)
$router->post('/api/recipes/([0-9]+)/like', function(Request $request) {
    \Middlewares\AuthMiddleware::handle($request);
    $controller = new \Controllers\LikeController();
    $controller->toggle($request);
});

// Rutas de Guardado (Requieren Token)
$router->post('/api/recipes/([0-9]+)/save', function(Request $request) {
    \Middlewares\AuthMiddleware::handle($request);
    $controller = new \Controllers\RecipeController();
    $controller->toggleSave($request);
});

// Rutas Públicas de Categorías, Comentarios y Ratings
$router->get('/api/categories', ['Controllers\CategoryController', 'index']);

// Rutas Híbridas (Pueden o no tener token para estos dos, usar closure libre)
$router->post('/api/comments', function(Request $request) {
    if ($request->getHeader('Authorization')) {
         \Middlewares\AuthMiddleware::handle($request);
    }
    $controller = new \Controllers\CommentController();
    $controller->store($request);
});

$router->put('/api/comments/([0-9]+)', function(Request $request) {
    \Middlewares\AuthMiddleware::handle($request);
    $controller = new \Controllers\CommentController();
    $controller->update($request);
});

$router->delete('/api/comments/([0-9]+)', function(Request $request) {
    \Middlewares\AuthMiddleware::handle($request);
    $controller = new \Controllers\CommentController();
    $controller->destroy($request);
});

$router->post('/api/ratings', function(Request $request) {
    if ($request->getHeader('Authorization')) {
         \Middlewares\AuthMiddleware::handle($request);
    }
    $controller = new \Controllers\RatingController();
    $controller->store($request);
});

$router->delete('/api/ratings/([0-9]+)', function(Request $request) {
    \Middlewares\AuthMiddleware::handle($request);
    $controller = new \Controllers\RatingController();
    $controller->destroy($request);
});

// Rutas de prueba para confirmar conexión
$router->get('/api/test', function(Request $request) {
    try {
        $db = \Core\Database::getInstance();
        return Router::json(['success' => true, 'message' => '¡API escuchando! Conexión a DB MySQL Pdo nativo exitosa']);
    } catch (\Exception $e) {
        return Router::json(['success' => false, 'message' => 'Error DB', 'error' => $e->getMessage()], 500);
    }
});

// Despachar la ruta
$router->dispatch($request);
