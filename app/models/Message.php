<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasUuids;

    protected $table = 'messages';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'body',
        'is_read',
        'read_at',
    ];

    public $timestamps = true;

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Create a message and bump the parent conversation preview.
     */
    public static function send(string $conversationId, string $senderId, string $body): self
    {
        $message = static::create([
            'conversation_id' => $conversationId,
            'sender_id' => $senderId,
            'body' => $body,
            'is_read' => false,
        ]);

        Conversation::query()->where('id', $conversationId)->update([
            'last_message_at' => date('Y-m-d H:i:s'),
            'last_message_preview' => mb_substr($body, 0, 255),
        ]);

        return $message;
    }

    /**
     * Mark all messages in a conversation as read for the given participant.
     */
    public static function markConversationRead(string $conversationId, string $readerId): void
    {
        static::query()
            ->where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $readerId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => date('Y-m-d H:i:s'),
            ]);
    }
}