<?php

namespace Controllers;

use Core\Request;
use Core\Router;
use Core\Database;

class RatingController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function store(Request $request)
    {
        $recipeId = $request->body['recipe_id'] ?? null;
        $score = $request->body['score'] ?? null;
        
        $userId = isset($request->user) ? $request->user->sub : null;

        if (!$recipeId || !$score || $score < 1 || $score > 5) {
            Router::json(['success' => false, 'message' => 'Receta y puntaje válido (1-5) son obligatorios'], 400);
        }

        try {
            // Usamos ON DUPLICATE KEY UPDATE para sobrescribir la calificación si el usuario ya la había dado
            $stmt = $this->db->prepare("
                INSERT INTO ratings (recipe_id, user_id, score) 
                VALUES (:recipe_id, :user_id, :score)
                ON DUPLICATE KEY UPDATE score = VALUES(score)
            ");
            $stmt->execute([
                ':recipe_id' => $recipeId,
                ':user_id' => $userId,
                ':score' => $score
            ]);
            Router::json(['success' => true, 'message' => 'Calificación guardada']);
        } catch (\PDOException $e) {
            Router::json(['success' => false, 'message' => 'Error al calificar'], 500);
        }
    }

    /**
     * Elimina el rating que dio un usuario a una receta
     */
    public function destroy(Request $request)
    {
        $recipeId = $request->params[0] ?? null;
        $userId = isset($request->user) ? $request->user->sub : null;

        if (!$recipeId) {
            Router::json(['success' => false, 'message' => 'ID de receta requerido'], 400);
        }

        try {
            $stmt = $this->db->prepare("DELETE FROM ratings WHERE recipe_id = :recipe_id AND user_id = :user_id");
            $stmt->execute([
                ':recipe_id' => $recipeId,
                ':user_id' => $userId
            ]);
            Router::json(['success' => true, 'message' => 'Calificación eliminada']);
        } catch (\PDOException $e) {
            Router::json(['success' => false, 'message' => 'Error al eliminar calificación'], 500);
        }
    }
}
