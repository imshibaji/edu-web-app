<?php

namespace App\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Notification;
use App\Models\User;
use App\Models\UserActivity;

class MessageController extends Controller
{
    /**
     * List the authenticated user's conversations.
     */
    public function index()
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->redirect('/auth/login', 303);
        }

        $conversations = Conversation::query()
            ->with(['student', 'tutor'])
            ->where('student_id', $user->id)
            ->orWhere('tutor_id', $user->id)
            ->orderByDesc('last_message_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Conversation $c) => $this->presentConversation($c, $user))
            ->values()
            ->all();

        return response()->inertia('messages/index', [
            'conversations' => $conversations,
        ]);
    }

    /**
     * Show a single conversation thread.
     */
    public function show(string $id)
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->redirect('/auth/login', 303);
        }

        $conversation = Conversation::query()
            ->with(['student', 'tutor', 'booking'])
            ->find($id);

        if (!$conversation || !$conversation->involves($user->id)) {
            return response()->redirect('/messages', 303);
        }

        Message::markConversationRead($conversation->id, $user->id);

        $messages = $conversation->messages()
            ->with('sender')
            ->get()
            ->sortBy('created_at')
            ->values()
            ->map(function (Message $message) {
                return [
                    'id' => $message->id,
                    'sender_id' => $message->sender_id,
                    'body' => $message->body,
                    'is_read' => (bool) $message->is_read,
                    'created_at' => $message->created_at?->format('Y-m-d H:i:s'),
                ];
            })
            ->all();

        return response()->inertia('messages/show', [
            'auth' => $this->inertiaAuth($user),
            'conversation' => $this->presentConversation($conversation, $user, includeMessages: false),
            'messages' => $messages,
        ]);
    }

    /**
     * Send a message in a conversation.
     */
    public function store(string $id)
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $conversation = Conversation::query()->find($id);

        if (!$conversation || !$conversation->involves($user->id)) {
            return response()->json(['error' => 'Conversation not found'], 404);
        }

        $body = trim((string) request()->get('body', ''));

        if ($body === '') {
            return response()->json(['error' => 'Message cannot be empty'], 422);
        }

        if (mb_strlen($body) > 2000) {
            return response()->json(['error' => 'Message is too long'], 422);
        }

        $message = Message::send($conversation->id, $user->id, $body);

        $counterpart = $conversation->counterpartFor($user->id);

        if ($counterpart) {
            $reviewerName = $user->studentProfile?->full_name ?? $user->email;
            Notification::createForUser(
                $counterpart->id,
                Notification::TYPE_MESSAGE,
                'New message',
                "{$reviewerName} sent you a message.",
                ['conversation_id' => $conversation->id]
            );
        }

        UserActivity::log($user->id, UserActivity::TYPE_MESSAGE_SENT, 'Sent a message');

        return response()->json([
            'success' => true,
            'message' => [
                'id' => $message->id,
                'sender_id' => $message->sender_id,
                'body' => $message->body,
                'is_read' => false,
                'created_at' => $message->created_at?->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * Start a conversation with a tutor (used from tutor profile pages).
     */
    public function start()
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if ($user->isTutor()) {
            return response()->json(['error' => 'Tutors cannot start new conversations from the public site'], 403);
        }

        $tutorId = trim((string) request()->get('tutor_id', ''));

        if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $tutorId)) {
            return response()->json(['error' => 'Invalid tutor'], 422);
        }

        $tutor = User::query()->where('id', $tutorId)->where('role', User::ROLE_TUTOR)->first();

        if (!$tutor) {
            return response()->json(['error' => 'Tutor not found'], 404);
        }

        $conversation = Conversation::between($user->id, $tutor->id);

        return response()->json([
            'success' => true,
            'conversation_id' => $conversation->id,
        ]);
    }

    /**
     * Present a conversation for the React pages.
     */
    private function presentConversation(Conversation $conversation, User $user, bool $includeMessages = true): array
    {
        $counterpart = $conversation->counterpartFor($user->id);

        $name = $counterpart?->tutorProfile?->full_name
            ?? $counterpart?->studentProfile?->full_name
            ?? $counterpart?->email
            ?? 'Unknown';

        $unread = Message::query()
            ->where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->count();

        return [
            'id' => $conversation->id,
            'student' => [
                'id' => $conversation->student_id,
                'name' => $conversation->student?->studentProfile?->full_name ?? $conversation->student?->email ?? 'Unknown',
            ],
            'tutor' => [
                'id' => $conversation->tutor_id,
                'name' => $conversation->tutor?->tutorProfile?->full_name ?? $conversation->tutor?->email ?? 'Unknown',
            ],
            'booking_id' => $conversation->booking_id,
            'subject' => $conversation->booking?->subject?->name,
            'counterpart' => [
                'id' => $counterpart?->id,
                'name' => $name,
            ],
            'last_message_at' => $conversation->last_message_at?->format('Y-m-d H:i:s'),
            'last_message_preview' => $conversation->last_message_preview,
            'unread_count' => (int) $unread,
            'isMine' => $conversation->involves($user->id),
        ];
    }
}