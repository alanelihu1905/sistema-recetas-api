<?php

namespace Controllers;

use Core\Request;
use Core\Router;
use Models\User;
use Firebase\JWT\JWT;

/**
 * Controlador de Autenticación
 * ----------------------------
 * Gestiona el acceso al sistema (Login) y el alta de nuevos usuarios (Registro).
 * Despacha los Tokens de seguridad mediante JSON Web Tokens (JWT) permitiendo
 * el consumo protegido de los endpoints del sistema.
 */
class AuthController
{
    private $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    /**
     * Endpoint: POST /api/auth/register
     * Lee nombre, email y contraseña en texto plano, valida que no exista el correo y genera el hash seguro.
     * Retorna el Token JWT inmediatamente si el registro es exitoso.
     * 
     * @param Request $request Petición HTTP parseada con el payload JSON.
     * @return void Imprime JSON puro.
     */
    public function register(Request $request)
    {
        $name = $request->body['name'] ?? null;
        $email = $request->body['email'] ?? null;
        $password = $request->body['password'] ?? null;

        if (!$name || !$email || !$password) {
            Router::json(['success' => false, 'message' => 'Faltan campos obligatorios'], 400);
        }

        // Verificar si existe
        if ($this->userModel->findByEmail($email)) {
             Router::json(['success' => false, 'message' => 'El email ya está registrado'], 409);
        }

        $userId = $this->userModel->create($name, $email, $password);

        if ($userId) {
            Router::json([
                'success' => true, 
                'message' => 'Usuario registrado exitosamente',
                'token' => $this->generateToken($userId, $name, $email)
            ], 201);
        }

        Router::json(['success' => false, 'message' => 'Error al registrar al usuario'], 500);
    }

    /**
     * Endpoint: POST /api/auth/login
     * Verifica que el correo exista y que el Hash de BD coincida con la contraseña provista.
     * 
     * @param Request $request Petición HTTP.
     * @return void Emite un JSON de respuesta con el Token de Sesión si todo es correcto.
     */
    public function login(Request $request)
    {
        $email = $request->body['email'] ?? null;
        $password = $request->body['password'] ?? null;

        if (!$email || !$password) {
            Router::json(['success' => false, 'message' => 'Correo y contraseña son requeridos'], 400);
        }

        $user = $this->userModel->findByEmail($email);

        if ($user && password_verify($password, $user['password'])) {
            Router::json([
                'success' => true,
                'message' => 'Login exitoso',
                'token' => $this->generateToken($user['id'], $user['name'], $user['email'])
            ]);
        }

        Router::json(['success' => false, 'message' => 'Credenciales inválidas'], 401);
    }

    /**
     * Firma criptográfica y construcción del Token JWT.
     * Incorpora el ID (sub), Nombre y Email en el 'Payload' y le otorga 1 día de expiración técnica.
     * 
     * @param int $id ID de la base de datos MySQL asignado a este Usuario
     * @param string $name
     * @param string $email
     * @return string Token JWT alfanumérico codificado con HS256.
     */
    private function generateToken($id, $name, $email)
    {
        $env = parse_ini_file(__DIR__ . '/../.env');
        $secret = $env['JWT_SECRET'] ?? 'secret';

        $payload = [
            'iss' => 'backend-recetas',
            'iat' => time(),
            'exp' => time() + (60 * 60 * 24), // 1 día
            'sub' => $id,
            'name' => $name,
            'email' => $email
        ];

        return JWT::encode($payload, $secret, 'HS256');
    }
}
