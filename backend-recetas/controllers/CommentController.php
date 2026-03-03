<?php

namespace Controllers;

use Core\Request;
use Core\Router;
use Core\Database;

class CommentController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function store(Request $request)
    {
        $recipeId = $request->body['recipe_id'] ?? null;
        $content = $request->body['content'] ?? null;
        
        // Si hay un token de usuario autenticado
        $userId = isset($request->user) ? $request->user->sub : null;
        $guestName = !$userId ? ($request->body['guest_name'] ?? 'Anónimo') : null;

        if (!$recipeId || !$content) {
            Router::json(['success' => false, 'message' => 'Falta receta o contenido del comentario'], 400);
        }

        $stmt = $this->db->prepare("INSERT INTO comments (recipe_id, user_id, guest_name, content) VALUES (:recipe_id, :user_id, :guest_name, :content)");
        
        if ($stmt->execute([
            ':recipe_id' => $recipeId,
            ':user_id' => $userId,
            ':guest_name' => $guestName,
            ':content' => $content
        ])) {
            Router::json(['success' => true, 'message' => 'Comentario publicado'], 201);
        }

        Router::json(['success' => false, 'message' => 'Error al publicar comentario'], 500);
    }

    public function update(Request $request)
    {
        $commentId = $request->params[0] ?? null;
        $content = $request->body['content'] ?? null;
        $userId = isset($request->user) ? $request->user->sub : null;

        if (!$commentId || !$content || !$userId) {
            Router::json(['success' => false, 'message' => 'Datos inválidos o falta autorización'], 400);
        }

        $stmt = $this->db->prepare("UPDATE comments SET content = :content WHERE id = :id AND user_id = :user_id");
        $stmt->execute([
            ':content' => $content,
            ':id' => $commentId,
            ':user_id' => $userId
        ]);

        if ($stmt->rowCount() > 0) {
            Router::json(['success' => true, 'message' => 'Comentario actualizado']);
        }

        Router::json(['success' => false, 'message' => 'Error al actualizar o no tienes permiso'], 403);
    }

    public function destroy(Request $request)
    {
        $commentId = $request->params[0] ?? null;
        $userId = isset($request->user) ? $request->user->sub : null;

        if (!$commentId || !$userId) {
            Router::json(['success' => false, 'message' => 'Datos inválidos o falta autorización'], 400);
        }

        // Borrar comentario
        $stmt = $this->db->prepare("DELETE FROM comments WHERE id = :id AND user_id = :user_id");
        $stmt->execute([
            ':id' => $commentId,
            ':user_id' => $userId
        ]);

        if ($stmt->rowCount() > 0) {
            Router::json(['success' => true, 'message' => 'Comentario eliminado']);
        }

        Router::json(['success' => false, 'message' => 'Error al eliminar o no tienes permiso'], 403);
    }
}
