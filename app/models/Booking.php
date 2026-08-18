<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Payout;

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
        'cancelled_at',
        'cancel_reason',
        'cancelled_by',
        'completed_at',
        'completed_by_student',
        'completed_by_tutor',
    ];

    public $timestamps = true;

    protected $casts = [
        'duration_minutes' => 'integer',
        'amount' => 'integer',
        'scheduled_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'completed_at' => 'datetime',
        'completed_by_student' => 'boolean',
        'completed_by_tutor' => 'boolean',
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

    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class, 'booking_id');
    }

    /**
     * Mark this booking as completed by the given actor (STUDENT or TUTOR).
     * Once both sides have marked it complete, the booking is COMPLETED.
     */
    public function markCompletedBy(string $actor): bool
    {
        if ($this->status !== self::STATUS_CONFIRMED) {
            return false;
        }

        if ($actor === User::ROLE_STUDENT) {
            $this->completed_by_student = true;
        } elseif ($actor === User::ROLE_TUTOR) {
            $this->completed_by_tutor = true;
        } else {
            return false;
        }

        if ($this->completed_by_student && $this->completed_by_tutor) {
            $this->status = self::STATUS_COMPLETED;
            $this->completed_at = date('Y-m-d H:i:s');
        }

        $this->save();

        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Cancel the booking with a reason, recorded by the given actor.
     */
    public function cancelWithReason(string $reason, string $actor): bool
    {
        if (!in_array($this->status, [self::STATUS_PENDING_PAYMENT, self::STATUS_CONFIRMED], true)) {
            return false;
        }

        $this->status = self::STATUS_CANCELLED;
        $this->cancelled_at = date('Y-m-d H:i:s');
        $this->cancel_reason = $reason;
        $this->cancelled_by = $actor;

        $this->save();

        return true;
    }
}
