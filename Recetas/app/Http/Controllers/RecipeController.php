<?php

namespace App\Http\Controllers;

use App\Models\Recipe;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
    $query = Recipe::with(['user', 'categories', 'images'])
        ->withAvg('ratings', 'rating')
        ->withCount('ratings')
        ->where('status', 'publicada');

    if ($request->keyword) {
        $query->where('title', 'like', '%' . $request->keyword . '%');
    }

    if ($request->date) {
        $query->whereDate('created_at', $request->date);
    }

    if ($request->user_id) {
        $query->where('user_id', $request->user_id);
    }

    if ($request->category_id) {
        $query->whereHas('categories', function ($q) use ($request) {
            $q->where('categories.id', $request->category_id);
        });
    }

    return $query->paginate(5);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $recipe = Recipe::create([
            'title' => $request->title,
            'content' => $request->content,
            'status' => $request->status ?? 'borrador',
            'user_id' => 1
        ]);

        return response()->json($recipe, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Recipe $recipe)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Recipe $recipe)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Recipe $recipe)
    {
        //
    }

    /**
     * Upload image for a recipe.
     */
    public function uploadImage(Request $request, $id)
    {
        $request->validate([
            'image' => 'required|image|max:2048'
        ]);

        $recipe = Recipe::findOrFail($id);

        $path = $request->file('image')->store('recipes', 'public');

        $image = $recipe->images()->create([
            'path' => $path,
            'is_main' => $request->is_main ?? false
        ]);

        return response()->json($image, 201);
    }
}
