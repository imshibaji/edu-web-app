<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasUuids;

    protected $table = 'notifications';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'is_read',
        'read_at',
    ];

    public $timestamps = true;

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    public const TYPE_BOOKING_REQUEST = 'booking_request';
    public const TYPE_BOOKING_CONFIRMED = 'booking_confirmed';
    public const TYPE_BOOKING_CANCELLED = 'booking_cancelled';
    public const TYPE_BOOKING_COMPLETED = 'booking_completed';
    public const TYPE_PAYMENT_RECEIVED = 'payment_received';
    public const TYPE_PAYMENT_FAILED = 'payment_failed';
    public const TYPE_PAYOUT_INITIATED = 'payout_initiated';
    public const TYPE_PAYOUT_COMPLETED = 'payout_completed';
    public const TYPE_PAYOUT_FAILED = 'payout_failed';
    public const TYPE_PROFILE_APPROVED = 'profile_approved';
    public const TYPE_PROFILE_REJECTED = 'profile_rejected';
    public const TYPE_REVIEW_RECEIVED = 'review_received';
    public const TYPE_SYSTEM = 'system';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public static function createForUser(
        string $userId,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): self {
        return self::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'is_read' => false,
        ]);
    }

    public function markAsRead(): void
    {
        $this->update([
            'is_read' => true,
            'read_at' => date('Y-m-d H:i:s'),
        ]);
    }

    public static function markAllAsRead(string $userId): void
    {
        self::query()
            ->where('user_id', $userId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => date('Y-m-d H:i:s'),
            ]);
    }

    public static function unreadCount(string $userId): int
    {
        return (int) self::query()
            ->where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }
}