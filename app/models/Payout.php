<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payout extends Model
{
    use HasUuids;

    protected $table = 'payouts';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'booking_id',
        'tutor_id',
        'stripe_transfer_id',
        'gross_amount',
        'platform_fee',
        'processing_fee',
        'net_amount',
        'currency',
        'status',
        'scheduled_at',
        'paid_at',
        'failure_reason',
    ];

    public $timestamps = true;

    protected $casts = [
        'gross_amount' => 'integer',
        'platform_fee' => 'integer',
        'processing_fee' => 'integer',
        'net_amount' => 'integer',
        'scheduled_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public const STATUS_PENDING = 'pending';
    public const STATUS_SCHEDULED = 'scheduled';
    public const STATUS_PAID = 'paid';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    public function markAsPaid(?string $stripeTransferId = null): void
    {
        $this->update([
            'status' => self::STATUS_PAID,
            'paid_at' => date('Y-m-d H:i:s'),
            'stripe_transfer_id' => $stripeTransferId ?? $this->stripe_transfer_id,
        ]);
    }

    public function markAsFailed(string $reason): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'failure_reason' => $reason,
        ]);
    }

    public function markAsScheduled(string $scheduledAt): void
    {
        $this->update([
            'status' => self::STATUS_SCHEDULED,
            'scheduled_at' => $scheduledAt,
        ]);
    }
}