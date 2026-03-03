<?php

namespace Models;

use Core\Database;
use PDO;

/**
 * Modelo Recipe (Receta)
 * ----------------------
 * Interactúa directamente con la tabla `recipes`. 
 * Encargado de construir consultas SQL complejas (Subconsultas, JOINs, Filtros)
 * para listar el feed general, obtener el detalle de una receta, y manejar el CRUD.
 */
class Recipe
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Obtiene una lista paginada de recetas, aplicando filtros (búsqueda, autor, categoría).
     * Oculta los "Borradores" salvo cuando un usuario consulta su propio perfil.
     */
    public function all($limit, $offset, $filters = [], $currentUserId = null)
    {
        $query = "SELECT r.*, u.name as author_name, 
                  c.name as category_name, c.id as category_id,
                  (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as likes_count,
                  (SELECT AVG(score) FROM ratings WHERE recipe_id = r.id) as ratings_avg
                  ";
                  
        if ($currentUserId) {
            $query .= ", (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id AND user_id = :current_user_like) as is_liked ";
            $query .= ", (SELECT COUNT(*) FROM saved_recipes WHERE recipe_id = r.id AND user_id = :current_user_save) as is_saved ";
        } else {
            $query .= ", 0 as is_liked, 0 as is_saved ";
        }

        $query .= "FROM recipes r 
                  JOIN users u ON r.user_id = u.id 
                  LEFT JOIN recipe_category rc ON r.id = rc.recipe_id
                  LEFT JOIN categories c ON rc.category_id = c.id
                  WHERE 1=1";
        
        $params = [];

        if ($currentUserId) {
            $params[':current_user_like'] = $currentUserId;
            $params[':current_user_save'] = $currentUserId;
        }

        // Si estamos viendo nuestro propio perfil, mostramos borradores. Si no, solo publicadas.
        if (!empty($filters['author']) && $currentUserId && $filters['author'] == $currentUserId) {
            // No agregamos filtro de status, muestra todo (Borrador y Publicada)
        } else {
            $query .= " AND r.status = 'Publicada'";
        }

        if (!empty($filters['keyword'])) {
            $query .= " AND (r.title LIKE :keyword OR r.description LIKE :keyword)";
            $params[':keyword'] = '%' . $filters['keyword'] . '%';
        }
        
        if (!empty($filters['date'])) {
            $query .= " AND DATE(r.created_at) = :date";
            $params[':date'] = $filters['date'];
        }

        if (!empty($filters['author'])) {
            $query .= " AND r.user_id = :author";
            $params[':author'] = $filters['author'];
        }

        if (!empty($filters['category'])) {
            $query .= " AND r.id IN (SELECT recipe_id FROM recipe_category WHERE category_id = :category)";
            $params[':category'] = $filters['category'];
        }

        if (!empty($filters['sort']) && $filters['sort'] === 'trending') {
            $query .= " ORDER BY ratings_avg DESC, likes_count DESC, r.created_at DESC LIMIT :limit OFFSET :offset";
        } else {
            $query .= " ORDER BY r.created_at DESC LIMIT :limit OFFSET :offset";
        }

        $stmt = $this->db->prepare($query);
        
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    public function create($userId, $title, $description, $status = 'Borrador', $mainImage = null, $prepTime = '30 min', $ingredients = '[]', $steps = '[]')
    {
        $stmt = $this->db->prepare("INSERT INTO recipes (user_id, title, description, status, main_image, prep_time, ingredients, steps) VALUES (:user_id, :title, :description, :status, :main_image, :prep_time, :ingredients, :steps)");
        if ($stmt->execute([
            ':user_id' => $userId,
            ':title' => $title,
            ':description' => $description,
            ':status' => $status,
            ':main_image' => $mainImage,
            ':prep_time' => $prepTime,
            ':ingredients' => $ingredients,
            ':steps' => $steps
        ])) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function find($id, $currentUserId = null)
    {
        $query = "
            SELECT r.*, u.name as author_name,
            c.name as category_name, c.id as category_id,
            (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id) as likes_count,
            (SELECT AVG(score) FROM ratings WHERE recipe_id = r.id) as ratings_avg
        ";
        
        if ($currentUserId) {
            $query .= ", (SELECT COUNT(*) FROM likes WHERE recipe_id = r.id AND user_id = :current_user_like) as is_liked ";
            $query .= ", (SELECT COUNT(*) FROM saved_recipes WHERE recipe_id = r.id AND user_id = :current_user_save) as is_saved ";
            $query .= ", (SELECT score FROM ratings WHERE recipe_id = r.id AND user_id = :current_user_rating LIMIT 1) as user_rating ";
        } else {
            $query .= ", 0 as is_liked, 0 as is_saved, 0 as user_rating ";
        }

        $query .= "
            FROM recipes r 
            JOIN users u ON r.user_id = u.id 
            LEFT JOIN recipe_category rc ON r.id = rc.recipe_id
            LEFT JOIN categories c ON rc.category_id = c.id
            WHERE r.id = :id LIMIT 1
        ";

        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        if ($currentUserId) {
            $stmt->bindParam(':current_user_like', $currentUserId, PDO::PARAM_INT);
            $stmt->bindParam(':current_user_save', $currentUserId, PDO::PARAM_INT);
            $stmt->bindParam(':current_user_rating', $currentUserId, PDO::PARAM_INT);
        }
        
        $stmt->execute();
        return $stmt->fetch();
    }

    /**
     * Obtiene recetas al azar recomendadas para el usuario.
     */
    public function recommended($limit = 3)
    {
        // For You: Obtener recetas publicadas de forma aleatoria o más recientes
        $stmt = $this->db->prepare("
            SELECT r.*, u.name as author_name, c.name as category_name
            FROM recipes r 
            JOIN users u ON r.user_id = u.id 
            LEFT JOIN recipe_category rc ON r.id = rc.recipe_id
            LEFT JOIN categories c ON rc.category_id = c.id
            WHERE r.status = 'Publicada'
            ORDER BY RAND() LIMIT :limit
        ");
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function update($id, $userId, $title, $description, $status, $prepTime, $ingredients, $steps)
    {
        // Verifica que la receta pertenezca al usuario antes de actualizar
        $stmt = $this->db->prepare("
            UPDATE recipes 
            SET title = :title, description = :description, status = :status, 
                prep_time = :prep_time, ingredients = :ingredients, steps = :steps
            WHERE id = :id AND user_id = :user_id
        ");
        $stmt->execute([
            ':title' => $title,
            ':description' => $description,
            ':status' => $status,
            ':prep_time' => $prepTime,
            ':ingredients' => $ingredients,
            ':steps' => $steps,
            ':id' => $id,
            ':user_id' => $userId
        ]);
        return $stmt->rowCount() > 0;
    }

    public function delete($id, $userId)
    {
        // Verifica que la receta pertenezca al usuario antes de eliminar
        $stmt = $this->db->prepare("DELETE FROM recipes WHERE id = :id AND user_id = :user_id");
        $stmt->execute([
            ':id' => $id,
            ':user_id' => $userId
        ]);
        return $stmt->rowCount() > 0;
    }

    public function toggleSave($userId, $recipeId)
    {
        $check = $this->db->prepare("SELECT * FROM saved_recipes WHERE user_id = :user_id AND recipe_id = :recipe_id");
        $check->execute([':user_id' => $userId, ':recipe_id' => $recipeId]);
        
        if ($check->rowCount() > 0) {
            // Already saved, let's remove it
            $stmt = $this->db->prepare("DELETE FROM saved_recipes WHERE user_id = :user_id AND recipe_id = :recipe_id");
            $stmt->execute([':user_id' => $userId, ':recipe_id' => $recipeId]);
            return ['saved' => false, 'message' => 'Receta removida de guardados'];
        } else {
            $stmt = $this->db->prepare("INSERT INTO saved_recipes (user_id, recipe_id) VALUES (:user_id, :recipe_id)");
            $stmt->execute([':user_id' => $userId, ':recipe_id' => $recipeId]);
            return ['saved' => true, 'message' => 'Receta guardada exitosamente'];
        }
    }

    public function getComments($recipeId)
    {
        $stmt = $this->db->prepare("
            SELECT c.*, u.name as user_name, u.avatar_url,
            (SELECT score FROM ratings WHERE user_id = c.user_id AND recipe_id = c.recipe_id LIMIT 1) as rating_score
            FROM comments c 
            LEFT JOIN users u ON c.user_id = u.id 
            WHERE c.recipe_id = :recipe_id 
            ORDER BY c.created_at DESC
        ");
        $stmt->execute([':recipe_id' => $recipeId]);
        return $stmt->fetchAll();
    }
}
