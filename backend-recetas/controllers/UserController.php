<?php

namespace Controllers;

use Core\Request;
use Core\Router;
use Models\User;

class UserController
{
    private $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    public function show(Request $request)
    {
        $id = $request->params[0] ?? null;
        
        if (!$id) {
            Router::json(['success' => false, 'message' => 'ID no proporcionado'], 400);
        }

        $profile = $this->userModel->getProfile($id);

        if ($profile) {
            Router::json([
                'success' => true, 
                'data' => $profile
            ]);
        }
        
        Router::json(['success' => false, 'message' => 'Usuario no encontrado'], 404);
    }

    public function update(Request $request)
    {
        $userId = $request->user->sub; // from AuthMiddleware
        
        $name = $_POST['name'] ?? $request->body['name'] ?? null;
        $bio = $_POST['bio'] ?? $request->body['bio'] ?? null;
        $avatarUrl = $_POST['avatar_url'] ?? $request->body['avatar_url'] ?? null;

        if (!$name) {
            Router::json(['success' => false, 'message' => 'El nombre es obligatorio'], 400);
        }

        // El avatar Url ahora viene codificado en Base64 desde el JSON Body
        $updated = $this->userModel->updateProfile($userId, $name, $bio, $avatarUrl);

        if ($updated !== false) {
            Router::json(['success' => true, 'message' => 'Perfil actualizado correctamente']);
        }

        Router::json(['success' => false, 'message' => 'No se pudo actualizar el perfil'], 500);
    }
}
