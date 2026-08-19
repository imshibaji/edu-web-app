<?php

namespace App\Controllers;

use App\Models\Booking;
use App\Models\Notification;
use App\Models\Review;
use App\Models\User;
use App\Models\UserActivity;
use App\Services\JitsiService;
use App\Services\MailService;

/**
 * Handles the lesson lifecycle for students and tutors:
 * listing, joining (Jitsi), completion, and cancellation.
 */
class LessonController extends Controller
{
    private JitsiService $jitsi;

    public function __construct()
    {
        $this->jitsi = new JitsiService();
    }

    /**
     * List lessons for the authenticated user (student or tutor).
     */
    public function index()
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->redirect('/auth/login', 303);
        }

        $query = Booking::query()
            ->with(['tutor.tutorProfile', 'student.studentProfile', 'subject'])
            ->orderByDesc('scheduled_at')
            ->orderByDesc('created_at');

        if ($user->isTutor()) {
            $query->where('tutor_id', $user->id);
        } elseif ($user->isStudent()) {
            $query->where('student_id', $user->id);
        } else {
            $query->where('student_id', '-1');
        }

        $lessons = $query->get()
            ->map(fn (Booking $booking) => $this->present($booking, $user))
            ->values()
            ->all();

        return response()->inertia('lessons/index', [
            'lessons' => $lessons,
        ]);
    }

    /**
     * Show a single lesson with its Jitsi meeting link.
     */
    public function show(string $id)
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->redirect('/auth/login', 303);
        }

        $booking = Booking::query()
            ->with(['tutor.tutorProfile', 'student.studentProfile', 'subject', 'slot'])
            ->find($id);

        if (!$booking || !$this->canAccess($booking, $user)) {
            return response()->redirect('/lessons', 303);
        }

        return response()->inertia('lessons/show', [
            'lesson' => $this->present($booking, $user, includeMeetingUrl: true),
        ]);
    }

    /**
     * Mark a lesson complete. Each side marks their own completion;
     * when both have done so, the lesson is completed and payouts are released.
     */
    public function complete(string $id)
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $booking = Booking::query()
            ->with(['tutor.tutorProfile', 'student.studentProfile', 'subject'])
            ->find($id);

        if (!$booking) {
            return response()->json(['error' => 'Lesson not found'], 404);
        }

        if (!$this->canAccess($booking, $user)) {
            return response()->json(['error' => 'Not authorized'], 403);
        }

        if ($booking->status !== Booking::STATUS_CONFIRMED) {
            return response()->json(['error' => 'Only confirmed lessons can be completed'], 400);
        }

        $actor = $user->role;

        $wasCompletedBefore = $booking->status === Booking::STATUS_COMPLETED;
        $nowCompleted = $booking->markCompletedBy($actor);

        if ($nowCompleted && !$wasCompletedBefore) {
            $this->afterCompleted($booking);
        }

        return response()->json([
            'success' => true,
            'status' => $booking->status,
            'completedByStudent' => (bool) $booking->completed_by_student,
            'completedByTutor' => (bool) $booking->completed_by_tutor,
            'lessonCompleted' => $nowCompleted,
        ]);
    }

    /**
     * Cancel a lesson with a reason (both student and tutor).
     */
    public function cancel(string $id)
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $booking = Booking::query()
            ->with(['tutor.tutorProfile', 'student.studentProfile', 'subject'])
            ->find($id);

        if (!$booking) {
            return response()->json(['error' => 'Lesson not found'], 404);
        }

        if (!$this->canAccess($booking, $user)) {
            return response()->json(['error' => 'Not authorized'], 403);
        }

        $reason = trim((string) request()->get('reason', ''));

        if ($reason === '') {
            return response()->json(['error' => 'A cancellation reason is required'], 422);
        }

        if (mb_strlen($reason) > 500) {
            return response()->json(['error' => 'Cancellation reason is too long'], 422);
        }

        $ok = $booking->cancelWithReason($reason, $user->role);

        if (!$ok) {
            return response()->json(['error' => 'Lesson cannot be cancelled in its current state'], 400);
        }

        $this->afterCancelled($booking, $user);

        return response()->json([
            'success' => true,
            'status' => $booking->status,
        ]);
    }

    /**
     * Present a booking as a lesson payload for the React pages.
     */
    private function present(Booking $booking, User $user, bool $includeMeetingUrl = false): array
    {
        $tutorProfile = $booking->tutor?->tutorProfile;
        $studentProfile = $booking->student?->studentProfile;
        $isTutor = $user->isTutor();

        $data = [
            'id' => $booking->id,
            'student' => [
                'id' => $booking->student_id,
                'name' => $studentProfile?->full_name ?? $booking->student?->email ?? 'Unknown student',
            ],
            'tutor' => [
                'id' => $booking->tutor_id,
                'name' => $tutorProfile?->full_name ?? $booking->tutor?->email ?? 'Unknown tutor',
            ],
            'subject' => $booking->subject?->name,
            'scheduled_at' => $booking->scheduled_at?->format('Y-m-d H:i:s'),
            'duration_minutes' => (int) $booking->duration_minutes,
            'amount' => (int) $booking->amount,
            'currency' => $booking->currency,
            'status' => $booking->status,
            'cancel_reason' => $booking->cancel_reason,
            'cancelled_at' => $booking->cancelled_at?->format('Y-m-d H:i:s'),
            'cancelled_by' => $booking->cancelled_by,
            'completed_at' => $booking->completed_at?->format('Y-m-d H:i:s'),
            'completedByStudent' => (bool) $booking->completed_by_student,
            'completedByTutor' => (bool) $booking->completed_by_tutor,
            'isMine' => $this->canAccess($booking, $user),
            'amTutor' => $isTutor,
            'canJoin' => $booking->status === Booking::STATUS_CONFIRMED,
            'canComplete' => $booking->status === Booking::STATUS_CONFIRMED,
            'canCancel' => in_array($booking->status, [
                Booking::STATUS_PENDING_PAYMENT,
                Booking::STATUS_CONFIRMED,
            ], true),
            'canReview' => $booking->status === Booking::STATUS_COMPLETED && !Review::existsFor($booking->id, $user->id),
        ];

        if ($includeMeetingUrl) {
            $data['meeting_url'] = $this->jitsi->meetingUrl($booking->id, $booking->subject?->name);
        }

        return $data;
    }

    /**
     * Run post-completion side effects: activity log, notifications, emails.
     */
    private function afterCompleted(Booking $booking): void
    {
        $tutorName = $booking->tutor->tutorProfile?->full_name ?? 'Tutor';
        $studentName = $booking->student->studentProfile?->full_name ?? $booking->student->email;

        UserActivity::log($booking->tutor_id, UserActivity::TYPE_LESSON_COMPLETED, "Lesson with {$studentName} completed");
        UserActivity::log($booking->student_id, UserActivity::TYPE_LESSON_COMPLETED, "Lesson with {$tutorName} completed");

        Notification::createForUser(
            $booking->tutor_id,
            Notification::TYPE_BOOKING_COMPLETED,
            'Lesson completed',
            "Your lesson with {$studentName} has been completed.",
            ['booking_id' => $booking->id]
        );
        Notification::createForUser(
            $booking->student_id,
            Notification::TYPE_BOOKING_COMPLETED,
            'Lesson completed',
            "Your lesson with {$tutorName} has been completed.",
            ['booking_id' => $booking->id]
        );

        try {
            $mail = new MailService();
            $mail->sendLessonCompleted($booking->tutor->email, $tutorName, $studentName);
            $mail->sendLessonCompleted($booking->student->email, $tutorName, $studentName);
        } catch (\Throwable $e) {
            error_log('Lesson-completed email failed: ' . $e->getMessage());
        }
    }

    /**
     * Run post-cancellation side effects: activity log, notifications, emails.
     */
    private function afterCancelled(Booking $booking, User $canceller): void
    {
        $tutorName = $booking->tutor->tutorProfile?->full_name ?? 'Tutor';
        $studentName = $booking->student->studentProfile?->full_name ?? $booking->student->email;

        UserActivity::log($booking->tutor_id, UserActivity::TYPE_LESSON_CANCELLED, "Lesson with {$studentName} cancelled");
        UserActivity::log($booking->student_id, UserActivity::TYPE_LESSON_CANCELLED, "Lesson with {$tutorName} cancelled");

        Notification::createForUser(
            $booking->tutor_id,
            Notification::TYPE_BOOKING_CANCELLED,
            'Lesson cancelled',
            "Your lesson with {$studentName} was cancelled. Reason: {$booking->cancel_reason}",
            ['booking_id' => $booking->id]
        );
        Notification::createForUser(
            $booking->student_id,
            Notification::TYPE_BOOKING_CANCELLED,
            'Lesson cancelled',
            "Your lesson with {$tutorName} was cancelled. Reason: {$booking->cancel_reason}",
            ['booking_id' => $booking->id]
        );

        try {
            $mail = new MailService();
            $title = 'Lesson cancelled';
            $message = "The lesson with {$tutorName} and {$studentName} has been cancelled. Reason: {$booking->cancel_reason}";
            $mail->sendLessonCancelled($booking->tutor->email, $title, $message);
            $mail->sendLessonCancelled($booking->student->email, $title, $message);
        } catch (\Throwable $e) {
            error_log('Lesson-cancelled email failed: ' . $e->getMessage());
        }
    }

    /**
     * Whether the given user is a party to the booking.
     */
    private function canAccess(Booking $booking, User $user): bool
    {
        return $booking->student_id === $user->id || $booking->tutor_id === $user->id;
    }
}