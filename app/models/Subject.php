<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Subject extends Model
{
    use HasUuids;

    protected $table = 'subjects';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'name',
    ];

    public $timestamps = true;

    public function tutors(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tutor_subjects', 'subject_id', 'tutor_id');
    }
}
