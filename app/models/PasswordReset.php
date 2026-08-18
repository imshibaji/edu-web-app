<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PasswordReset extends Model
{
    use HasUuids;

    protected $table = 'password_resets';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'email',
        'token',
    ];

    public $timestamps = true;

    protected $casts = [
        'email' => 'string',
        'token' => 'string',
    ];
}