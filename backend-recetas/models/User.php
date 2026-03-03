<?php

namespace Models;

use Core\Database;
use PDO;

/**
 * Modelo de Usuario
 * -----------------
 * Repositorio de datos y controlador de subqueries SQL para extraer y mutar
 * la información sensible del usuario (Credenciales, Perfiles Públicos).
 */
class User
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create($name, $email, $password)
    {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        
        $stmt = $this->db->prepare("INSERT INTO users (name, email, password) VALUES (:name, :email, :password)");
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password', $hash);
        
        if ($stmt->execute()) {
            return $this->db->lastInsertId();
        }
        return false;
    }

    public function findByEmail($email)
    {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        
        return $stmt->fetch();
    }

    /**
     * Extrae un árbol completo de datos sociales de un usuario:
     * Datos base, sumatoria de likes, recetarios creados, guardados y calificados.
     */
    public function getProfile($id)
    {
        // Obtener datos base del usuario, recetas creadas, y fecha de registro
        $stmt = $this->db->prepare("
            SELECT 
                u.id, u.name, u.email, u.avatar_url, u.bio, u.created_at,
                (SELECT COUNT(*) FROM recipes WHERE user_id = u.id) as total_recipes,
                (
                    SELECT COUNT(l.id) 
                    FROM likes l 
                    JOIN recipes r ON l.recipe_id = r.id 
                    WHERE r.user_id = u.id
                ) as total_likes
            FROM users u
            WHERE u.id = :id
            LIMIT 1
        ");
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        $profile = $stmt->fetch();
        
        if ($profile) {
            // Simulamos followers basados en likes
            $profile['followers_count'] = round((int)$profile['total_likes'] * 3.14 + (int)$id * 7);

            // También obtenemos las recetas para mostrarlas en su grid (estilo Instagram)
            $stmtRecipes = $this->db->prepare("
                SELECT id, title, main_image, created_at, status 
                FROM recipes 
                WHERE user_id = :id 
                ORDER BY created_at DESC
            ");
            $stmtRecipes->bindParam(':id', $id, PDO::PARAM_INT);
            $stmtRecipes->execute();
            $profile['recipes_grid'] = $stmtRecipes->fetchAll();

            // Obtenemos las recetas guardadas
            $stmtSaved = $this->db->prepare("
                SELECT r.id, r.title, r.main_image, sr.created_at, r.status 
                FROM saved_recipes sr
                JOIN recipes r ON sr.recipe_id = r.id
                WHERE sr.user_id = :id 
                ORDER BY sr.created_at DESC
            ");
            $stmtSaved->bindParam(':id', $id, PDO::PARAM_INT);
            $stmtSaved->execute();
            $profile['saved_recipes_grid'] = $stmtSaved->fetchAll();

            // Obtenemos las recetas calificadas
            $stmtRated = $this->db->prepare("
                SELECT r.id, r.title, r.main_image, rt.score, r.status 
                FROM ratings rt
                JOIN recipes r ON rt.recipe_id = r.id
                WHERE rt.user_id = :id 
                ORDER BY rt.id DESC
            ");
            $stmtRated->bindParam(':id', $id, PDO::PARAM_INT);
            $stmtRated->execute();
            $profile['rated_recipes_grid'] = $stmtRated->fetchAll();
        }

        return $profile;
    }

    public function updateProfile($id, $name, $bio, $avatarUrl)
    {
        $stmt = $this->db->prepare("
            UPDATE users 
            SET name = :name, bio = :bio, avatar_url = :avatar_url 
            WHERE id = :id
        ");
        
        return $stmt->execute([
            ':name' => $name,
            ':bio' => $bio,
            ':avatar_url' => $avatarUrl,
            ':id' => $id
        ]);
    }
}
