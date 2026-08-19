<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasUuids;

    protected $table = 'reviews';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'booking_id',
        'reviewer_id',
        'reviewee_id',
        'rating',
        'comment',
        'status',
    ];

    public $timestamps = true;

    protected $casts = [
        'rating' => 'integer',
    ];

    public const STATUS_PENDING = 'PENDING';
    public const STATUS_APPROVED = 'APPROVED';
    public const STATUS_REJECTED = 'REJECTED';

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function reviewee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewee_id');
    }

    /**
     * Whether the given user already reviewed this booking.
     */
    public static function existsFor(string $bookingId, string $reviewerId): bool
    {
        return static::query()
            ->where('booking_id', $bookingId)
            ->where('reviewer_id', $reviewerId)
            ->exists();
    }
}