<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TutorSubject extends Model
{
    protected $table = 'tutor_subjects';

    protected $primaryKey = 'tutor_id';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'tutor_id',
        'subject_id',
        'rate_cents',
    ];

    protected $casts = [
        'rate_cents' => 'integer',
    ];

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }
}
