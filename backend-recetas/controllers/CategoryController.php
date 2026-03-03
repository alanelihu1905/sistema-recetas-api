<?php

namespace Controllers;

use Core\Request;
use Core\Router;
use Core\Database;

class CategoryController
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function index(Request $request)
    {
        $stmt = $this->db->query("SELECT * FROM categories ORDER BY name ASC");
        $categories = $stmt->fetchAll();

        Router::json([
            'success' => true,
            'data' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $name = $request->body['name'] ?? null;

        if (!$name) {
            Router::json(['success' => false, 'message' => 'El nombre de la categoría es requerido'], 400);
        }

        $stmt = $this->db->prepare("INSERT INTO categories (name) VALUES (:name)");
        
        try {
            $stmt->execute([':name' => $name]);
            Router::json(['success' => true, 'message' => 'Categoría creada', 'id' => $this->db->lastInsertId()]);
        } catch (\PDOException $e) {
            if ($e->errorInfo[1] == 1062) {
                Router::json(['success' => false, 'message' => 'La categoría ya existe'], 409);
            }
            Router::json(['success' => false, 'message' => 'Error en base de datos'], 500);
        }
    }
}
