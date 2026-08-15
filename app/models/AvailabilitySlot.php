<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AvailabilitySlot extends Model
{
    use HasUuids;

    protected $table = 'availability_slots';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'tutor_id',
        'start_time',
        'end_time',
        'is_booked',
    ];

    public $timestamps = true;

    protected $casts = [
        'is_booked' => 'boolean',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }
}
