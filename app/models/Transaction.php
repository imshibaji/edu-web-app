<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasUuids;

    protected $table = 'transactions';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'booking_id',
        'type',
        'amount',
        'currency',
        'status',
        'platform_fee',
        'stripe_payment_intent_id',
    ];

    public $timestamps = true;

    protected $casts = [
        'amount' => 'integer',
        'platform_fee' => 'integer',
    ];

    public const TYPE_LESSON_PAYMENT = 'LESSON_PAYMENT';
    public const TYPE_ESCROW_RELEASE = 'ESCROW_RELEASE';
    public const TYPE_REFUND = 'REFUND';
    public const TYPE_PLATFORM_FEE = 'PLATFORM_FEE';

    public const STATUS_PENDING = 'PENDING';
    public const STATUS_SUCCESS = 'SUCCESS';
    public const STATUS_FAILED = 'FAILED';

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }
}
