<?php

namespace Controllers;

use Core\Request;
use Core\Router;
use Models\Like;

class LikeController
{
    private $likeModel;

    public function __construct()
    {
        $this->likeModel = new Like();
    }

    public function toggle(Request $request)
    {
        // AuthMiddleware garantiza que haya usuario sub
        $userId = $request->user->sub;
        $recipeId = $request->params[0] ?? null;

        if (!$recipeId) {
            Router::json(['success' => false, 'message' => 'El ID de la receta es requerido'], 400);
        }

        $result = $this->likeModel->toggle($userId, $recipeId);
        $newCount = $this->likeModel->getRecipeLikesCount($recipeId);

        Router::json([
            'success' => true, 
            'action' => $result['action'],
            'likes_count' => $newCount
        ]);
    }
}
