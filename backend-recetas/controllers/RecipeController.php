<?php

namespace Controllers;

use Core\Request;
use Core\Router;
use Models\Recipe;

/**
 * Controlador Principal de Recetas
 * --------------------------------
 * Orquesta las peticiones HTTP (MVC) interconectando el cliente de React con el Modelo de la BD.
 * Valida payloads, gestiona la paginación universal en `/api/recipes` e inyecta
 * el ID del usuario en sesión (`$request->user->sub`) para operaciones protegidas.
 */
class RecipeController
{
    private $recipeModel;

    public function __construct()
    {
        $this->recipeModel = new Recipe();
    }

    /**
     * Endpoint: GET /api/recipes
     * Recibe query parameters paginados (?page=1&keyword=taco) y devuelve el feed público.
     */
    public function index(Request $request)
    {
        $page = isset($request->query['page']) ? (int)$request->query['page'] : 1;
        $limit = 8;
        $offset = ($page - 1) * $limit;

        $filters = [
            'keyword' => $request->query['keyword'] ?? null,
            'date' => $request->query['date'] ?? null,
            'author' => $request->query['author'] ?? null,
            'category' => $request->query['category'] ?? null,
            'sort' => $request->query['sort'] ?? null,
        ];

        // Intentar obtener al usuario actual si manda Token
        $currentUserId = null;
        if ($request->getHeader('Authorization')) {
            if (\Middlewares\AuthMiddleware::tryHandle($request)) {
                $currentUserId = $request->user->sub ?? null;
            }
        }

        $recipes = $this->recipeModel->all($limit, $offset, $filters, $currentUserId);
        
        Router::json([
            'success' => true,
            'data' => $recipes,
            'page' => $page,
            'limit' => $limit
        ]);
    }

    /**
     * Endpoint: POST /api/recipes
     * Crea un nuevo registro decodificando el Payload JSON crudo y asociándolo al Autor actual.
     */
    public function store(Request $request)
    {
        // AuthMiddleware ya parseó el token
        $userId = $request->user->sub;
        
        // En multipart/form-data, los campos vienen en $_POST directamente en lugar del JSON body.
        $title = $_POST['title'] ?? $request->body['title'] ?? null;
        $description = $_POST['description'] ?? $request->body['description'] ?? null;
        $prepTime = $_POST['prep_time'] ?? $request->body['prep_time'] ?? '30 min';
        
        // Ingredients and steps may come as JSON strings or raw arrays depending on FormData
        $ingredients = $_POST['ingredients'] ?? $request->body['ingredients'] ?? '[]';
        if (is_array($ingredients)) $ingredients = json_encode($ingredients);
        
        $steps = $_POST['steps'] ?? $request->body['steps'] ?? '[]';
        if (is_array($steps)) $steps = json_encode($steps);

        $status = $_POST['status'] ?? $request->body['status'] ?? 'Borrador';

        if (!$title || !$description) {
            Router::json(['success' => false, 'message' => 'Título y descripción obligatorios'], 400);
        }

        $mainImageUrl = $request->body['image'] ?? null;

        $recipeId = $this->recipeModel->create($userId, $title, $description, $status, $mainImageUrl, $prepTime, $ingredients, $steps);

        if ($recipeId) {
            // Also save category if provided
            $categoryId = $_POST['category_id'] ?? $request->body['category_id'] ?? null;
            if ($categoryId) {
                $db = \Core\Database::getInstance();
                $stmt = $db->prepare("INSERT INTO recipe_category (recipe_id, category_id) VALUES (?, ?)");
                $stmt->execute([$recipeId, $categoryId]);
            }

            Router::json(['success' => true, 'message' => 'Receta creada', 'id' => $recipeId], 201);
        }

        Router::json(['success' => false, 'message' => 'Error al crear la receta en BD'], 500);
    }

    /**
     * Endpoint: GET /api/recipes/recommended
     * Obtiene 3 recetas al azar u ordenadas por likes para mostrar en una sección destacada del Home.
     * No requiere JWT (Es público).
     */
    public function recommended(Request $request)
    {
        $recipes = $this->recipeModel->recommended(3);
        Router::json(['success' => true, 'data' => $recipes]);
    }

    /**
     * Endpoint: GET /api/recipes/{id}
     * Muestra el detalle completo de una receta (ingredientes, pasos, autor).
     * Soporta Inyección JWT Opcional: Si el usuario manda Token, se revisa si él ya le dio "Like" o "Guardar".
     */
    public function show(Request $request)
    {
        $id = $request->params[0] ?? null; // ID viene de /api/recipes/{id} regex matcher
        if (!$id) Router::json(['success' => false, 'message' => 'ID no proporcionado'], 400);

        // Opcionalmente parsear el userId si viene Token
        $currentUserId = null;
        if ($request->getHeader('Authorization')) {
            if (\Middlewares\AuthMiddleware::tryHandle($request)) {
                $currentUserId = $request->user->sub ?? null;
            }
        }

        $recipe = $this->recipeModel->find($id, $currentUserId);

        if ($recipe) {
            $recipe['comments'] = $this->recipeModel->getComments($id);
            Router::json(['success' => true, 'data' => $recipe]);
        }
        Router::json(['success' => false, 'message' => 'Receta no encontrada'], 404);
    }

    /**
     * Endpoint: PUT /api/recipes/{id}
     * Edita los campos permitidos validando siempre que pertenezcan al autor.
     */
    public function update(Request $request)
    {
        $id = $request->params[0] ?? null;
        $userId = $request->user->sub;

        $title = $request->body['title'] ?? null;
        $description = $request->body['description'] ?? null;
        $prepTime = $request->body['prep_time'] ?? '30 min';
        
        $ingredients = $request->body['ingredients'] ?? '[]';
        if (is_array($ingredients)) $ingredients = json_encode($ingredients);
        
        $steps = $request->body['steps'] ?? '[]';
        if (is_array($steps)) $steps = json_encode($steps);

        $status = $request->body['status'] ?? 'Borrador';

        if (!$id || (!$title && !$description)) {
            Router::json(['success' => false, 'message' => 'Faltan datos obligatorios'], 400);
        }

        $updated = $this->recipeModel->update($id, $userId, $title, $description, $status, $prepTime, $ingredients, $steps);
        if ($updated) {
            Router::json(['success' => true, 'message' => 'Receta actualizada']);
        }
        Router::json(['success' => false, 'message' => 'No se pudo actualizar o no tienes permisos'], 403);
    }

    /**
     * Endpoint: DELETE /api/recipes/{id}
     * Elimina permanentemente una receta.
     * Requiere JWT Activo y Validación de Propiedad (Solo el creador puede borrarla).
     */
    public function destroy(Request $request)
    {
        $id = $request->params[0] ?? null;
        $userId = $request->user->sub; // Obligatorio por el middleware

        if (!$id) {
            Router::json(['success' => false, 'message' => 'Faltan datos obligatorios'], 400);
        }

        $deleted = $this->recipeModel->delete($id, $userId);
        if ($deleted) {
            Router::json(['success' => true, 'message' => 'Receta eliminada']);
        }
        Router::json(['success' => false, 'message' => 'No se pudo eliminar o no tienes permisos'], 403);
    }

    /**
     * Endpoint: POST /api/recipes/{id}/save
     * Funcionalidad interactiva: El usuario alterna el estado de guardado (Save/Unsave) de una receta.
     * Requiere JWT (Se debe estar logueado para guardar recetas).
     */
    public function toggleSave(Request $request)
    {
        $recipeId = $request->params[0] ?? null;
        $userId = $request->user->sub;

        if (!$recipeId) {
            Router::json(['success' => false, 'message' => 'ID de receta requerido'], 400);
        }

        $result = $this->recipeModel->toggleSave($userId, $recipeId);
        Router::json(['success' => true] + $result);
    }
}
