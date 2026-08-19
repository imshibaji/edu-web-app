<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasUuids;

    protected $table = 'conversations';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'student_id',
        'tutor_id',
        'booking_id',
        'last_message_at',
        'last_message_preview',
    ];

    public $timestamps = true;

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'conversation_id')
            ->orderByDesc('created_at');
    }

    /**
     * Find (or create) the one-on-one conversation between a student and a tutor.
     */
    public static function between(string $studentId, string $tutorId, ?string $bookingId = null): self
    {
        $conversation = static::query()
            ->where('student_id', $studentId)
            ->where('tutor_id', $tutorId)
            ->first();

        if (!$conversation) {
            $conversation = static::create([
                'student_id' => $studentId,
                'tutor_id' => $tutorId,
                'booking_id' => $bookingId,
            ]);
        }

        return $conversation;
    }

    /**
     * Whether the given user is a participant in this conversation.
     */
    public function involves(string $userId): bool
    {
        return $this->student_id === $userId || $this->tutor_id === $userId;
    }

    /**
     * The counterpart user to the given participant.
     */
    public function counterpartFor(string $userId): ?User
    {
        return $this->student_id === $userId ? $this->tutor : $this->student;
    }
}