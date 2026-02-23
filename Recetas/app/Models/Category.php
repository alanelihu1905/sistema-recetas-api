<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    public function recipes()
    {
        return $this->belongsToMany(Recipe::class);
    }
}
