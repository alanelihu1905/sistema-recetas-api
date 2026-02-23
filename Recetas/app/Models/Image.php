<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Image extends Model
{
    protected $fillable = [
        'recipe_id',
        'path',
        'is_main'
    ];

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }
}
