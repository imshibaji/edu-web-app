<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TutorProfileReview extends Model
{
    use HasUuids;

    protected $table = 'tutor_profile_reviews';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'tutor_id',
        'full_name',
        'headline',
        'bio',
        'hourly_rate',
        'currency',
        'city',
        'format',
        'experience_level',
        'avatar_url',
        'status',
        'reviewed_by',
        'reviewed_at',
    ];

    public $timestamps = true;

    protected $casts = [
        'hourly_rate' => 'integer',
        'reviewed_at' => 'datetime',
    ];

    const STATUS_PENDING = 'PENDING';
    const STATUS_APPROVED = 'APPROVED';
    const STATUS_REJECTED = 'REJECTED';

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
