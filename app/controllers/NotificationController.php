<?php

namespace App\Controllers;

use App\Models\Notification;

class NotificationController extends Controller
{
    /**
     * List the authenticated user's notifications.
     */
    public function index()
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->redirect('/auth/login', 303);
        }

        $notifications = Notification::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(100)
            ->get()
            ->map(fn (Notification $n) => $this->present($n))
            ->values()
            ->all();

        $unread = Notification::unreadCount($user->id);

        return response()->inertia('notifications/index', [
            'notifications' => $notifications,
            'unread_count' => $unread,
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markRead(string $id)
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $notification = Notification::query()
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$notification) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }

    /**
     * Mark all of the user's notifications as read.
     */
    public function markAllRead()
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        Notification::markAllAsRead($user->id);

        return response()->json(['success' => true]);
    }

    /**
     * Return the unread count (used by the navbar badge).
     */
    public function unreadCount()
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->json(['unread' => 0]);
        }

        return response()->json(['unread' => Notification::unreadCount($user->id)]);
    }

    /**
     * Present a notification for the React pages.
     */
    private function present(Notification $n): array
    {
        return [
            'id' => $n->id,
            'type' => $n->type,
            'title' => $n->title,
            'message' => $n->message,
            'data' => $n->data,
            'is_read' => (bool) $n->is_read,
            'created_at' => $n->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}