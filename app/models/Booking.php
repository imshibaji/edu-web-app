<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    use HasUuids;

    protected $table = 'bookings';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'student_id',
        'tutor_id',
        'subject_id',
        'slot_id',
        'scheduled_at',
        'duration_minutes',
        'amount',
        'currency',
        'status',
        'notes',
    ];

    public $timestamps = true;

    protected $casts = [
        'duration_minutes' => 'integer',
        'amount' => 'integer',
        'scheduled_at' => 'datetime',
    ];

    public const STATUS_PENDING_PAYMENT = 'PENDING_PAYMENT';
    public const STATUS_CONFIRMED = 'CONFIRMED';
    public const STATUS_COMPLETED = 'COMPLETED';
    public const STATUS_CANCELLED = 'CANCELLED';
    public const STATUS_DISPUTED = 'DISPUTED';

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(AvailabilitySlot::class, 'slot_id');
    }

    public function amountDisplay(): string
    {
        return '$' . number_format($this->amount / 100, 2);
    }
}
