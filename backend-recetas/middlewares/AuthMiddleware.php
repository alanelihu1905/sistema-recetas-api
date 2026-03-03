<?php

namespace Middlewares;

use Core\Request;
use Core\Router;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

/**
 * Middleware de Autenticación
 * ---------------------------
 * Actúa como una pared de seguridad antes de ejecutar ciertos controladores.
 * Intercepta y decodifica el JSON Web Token de la cabecera 'Authorization: Bearer'.
 * Si el token es fraudulento o expirado, deniega el acceso con Error 401.
 */
class AuthMiddleware
{
    public static function handle(Request $request)
    {
        $authHeader = $request->getHeader('Authorization');
        
        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            Router::json(['success' => false, 'message' => 'No autorizado. Token faltante.'], 401);
        }

        $token = $matches[1];
        
        try {
            $env = parse_ini_file(__DIR__ . '/../.env');
            $secret = $env['JWT_SECRET'] ?? 'secret';
            
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
            
            // Adjuntar datos del usuario al request para uso posterior
            $request->user = $decoded;
            
        } catch (Exception $e) {
            Router::json(['success' => false, 'message' => 'Token inválido o expirado'], 401);
        }
    }

    public static function tryHandle(Request $request)
    {
        $authHeader = $request->getHeader('Authorization');
        
        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return false;
        }

        $token = $matches[1];
        
        try {
            $env = parse_ini_file(__DIR__ . '/../.env');
            $secret = $env['JWT_SECRET'] ?? 'secret';
            
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
            $request->user = $decoded;
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
}
