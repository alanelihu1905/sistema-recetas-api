<?php

namespace Core;

use PDO;
use PDOException;

/**
 * Gestor de Base de Datos (Singleton)
 * -----------------------------------
 * Instancia y devuelve una conexión persistente PDO hacia MySQL.
 * Utiliza el patrón Singleton (`getInstance`) para asegurar que solo exista
 * un único hilo de conexión a la base de datos en todo el ciclo de ejecución.
 */
class Database
{
    private static $instance = null;
    private $pdo;

    private function __construct()
    {
        // Cargar variables de entorno manualmente (parser simple)
        $env = parse_ini_file(__DIR__ . '/../.env');
        
        $host = $env['DB_HOST'] ?? '127.0.0.1';
        $port = $env['DB_PORT'] ?? '3306';
        $db   = $env['DB_DATABASE'] ?? 'recetas_db';
        $user = $env['DB_USERNAME'] ?? 'root';
        $pass = $env['DB_PASSWORD'] ?? '';

        $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
        
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $this->pdo = new PDO($dsn, $user, $pass, $options);
        } catch (PDOException $e) {
            die(json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()]));
        }
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance->pdo;
    }
}
