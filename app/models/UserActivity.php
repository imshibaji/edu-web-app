<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserActivity extends Model
{
    use HasUuids;

    protected $table = 'user_activities';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = true;

    protected $fillable = [
        'user_id',
        'type',
        'description',
        'ip_address',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public const TYPE_LOGIN = 'LOGIN';
    public const TYPE_LOGOUT = 'LOGOUT';
    public const TYPE_REGISTERED = 'REGISTERED';
    public const TYPE_PROFILE_SUBMITTED = 'PROFILE_SUBMITTED';
    public const TYPE_PROFILE_APPROVED = 'PROFILE_APPROVED';
    public const TYPE_PROFILE_REJECTED = 'PROFILE_REJECTED';
    public const TYPE_SLOT_ADDED = 'SLOT_ADDED';
    public const TYPE_SLOT_DELETED = 'SLOT_DELETED';
    public const TYPE_SUBJECT_ADDED = 'SUBJECT_ADDED';
    public const TYPE_SUBJECT_UPDATED = 'SUBJECT_UPDATED';
    public const TYPE_SUBJECT_REMOVED = 'SUBJECT_REMOVED';
    public const TYPE_TRIAL_BOOKED = 'TRIAL_BOOKED';
    public const TYPE_ACCOUNT_UPDATED = 'ACCOUNT_UPDATED';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public static function present(UserActivity $activity): array
    {
        $actor = $activity->user;

        return [
            'id' => $activity->id,
            'type' => $activity->type,
            'description' => $activity->description,
            'ip_address' => $activity->ip_address,
            'created_at' => $activity->created_at,
            'actor' => [
                'name' => $actor?->tutorProfile?->full_name
                    ?? $actor?->studentProfile?->full_name
                    ?? $actor?->email
                    ?? 'Unknown',
                'email' => $actor?->email,
                'role' => $actor?->role ?? User::ROLE_STUDENT,
            ],
        ];
    }

    public static function log(string|int $userId, string $type, string $description): void
    {
        if (!$userId || $description === '') {
            return;
        }

        try {
            static::create([
                'user_id' => $userId,
                'type' => $type,
                'description' => $description,
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            ]);
        } catch (\Throwable $e) {
            // Activity logging must never break the underlying request.
        }
    }
}
