<?php

namespace Models;

use Core\Database;
use PDO;

class Like
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function toggle($userId, $recipeId)
    {
        // Verificar si ya existe el like
        $stmt = $this->db->prepare("SELECT id FROM likes WHERE user_id = :user_id AND recipe_id = :recipe_id LIMIT 1");
        $stmt->execute([':user_id' => $userId, ':recipe_id' => $recipeId]);
        
        if ($stmt->fetch()) {
            // Existe, quitar like
            $delStmt = $this->db->prepare("DELETE FROM likes WHERE user_id = :user_id AND recipe_id = :recipe_id");
            $delStmt->execute([':user_id' => $userId, ':recipe_id' => $recipeId]);
            return ['action' => 'removed'];
        } else {
            // No existe, dar like
            $insStmt = $this->db->prepare("INSERT INTO likes (user_id, recipe_id) VALUES (:user_id, :recipe_id)");
            $insStmt->execute([':user_id' => $userId, ':recipe_id' => $recipeId]);
            return ['action' => 'added'];
        }
    }

    public function getRecipeLikesCount($recipeId)
    {
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM likes WHERE recipe_id = :recipe_id");
        $stmt->execute([':recipe_id' => $recipeId]);
        return (int)$stmt->fetch()['count'];
    }

    public function hasUserLiked($userId, $recipeId)
    {
        $stmt = $this->db->prepare("SELECT id FROM likes WHERE user_id = :user_id AND recipe_id = :recipe_id LIMIT 1");
        $stmt->execute([':user_id' => $userId, ':recipe_id' => $recipeId]);
        return $stmt->fetch() ? true : false;
    }
}
