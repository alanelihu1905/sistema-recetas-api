<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RecipeController;

Route::apiResource('recipes', RecipeController::class);

Route::post('recipes/{id}/images', [RecipeController::class, 'uploadImage']);