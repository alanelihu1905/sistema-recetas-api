<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\RecipeController;


Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);

    // Crear receta solo autenticado
    Route::post('/recipes', [RecipeController::class, 'store']);

    // Subir imágenes autenticado
    Route::post('/recipes/{id}/images', [RecipeController::class, 'uploadImage']);

});

// Públicas
Route::get('/recipes', [RecipeController::class, 'index']);
Route::get('/recipes/{id}', [RecipeController::class, 'show']);

Route::post('/recipes/{id}/comments', [RecipeController::class, 'addComment']);
Route::post('/recipes/{id}/ratings', [RecipeController::class, 'addRating']);