<?php

namespace App\Controllers;

use App\Models\Booking;
use App\Models\Notification;
use App\Models\Review;
use App\Models\User;
use App\Models\UserActivity;
use App\Services\MailService;

class ReviewController extends Controller
{
    /**
     * Submit a review for a completed lesson (student reviews tutor or vice versa).
     */
    public function store(string $bookingId)
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $booking = Booking::query()
            ->with(['tutor.tutorProfile', 'student.studentProfile', 'subject'])
            ->find($bookingId);

        if (!$booking) {
            return response()->json(['error' => 'Lesson not found'], 404);
        }

        if ($booking->student_id !== $user->id && $booking->tutor_id !== $user->id) {
            return response()->json(['error' => 'Not authorized'], 403);
        }

        if ($booking->status !== Booking::STATUS_COMPLETED) {
            return response()->json(['error' => 'Only completed lessons can be reviewed'], 400);
        }

        if (Review::existsFor($booking->id, $user->id)) {
            return response()->json(['error' => 'You already reviewed this lesson'], 409);
        }

        $data = request()->validate([
            'rating' => 'required|integer',
            'comment' => 'optional|max:1000',
        ]);

        $rating = (int) ($data['rating'] ?? 0);

        if ($rating < 1 || $rating > 5) {
            return response()->json(['error' => 'Rating must be between 1 and 5'], 422);
        }

        $revieweeId = $user->id === $booking->student_id ? $booking->tutor_id : $booking->student_id;
        $reviewee = $revieweeId === $booking->tutor_id ? $booking->tutor : $booking->student;

        $review = Review::create([
            'booking_id' => $booking->id,
            'reviewer_id' => $user->id,
            'reviewee_id' => $revieweeId,
            'rating' => $rating,
            'comment' => $data['comment'] ?? null,
            'status' => Review::STATUS_APPROVED,
        ]);

        $reviewerName = $user->studentProfile?->full_name ?? $user->email;
        $revieweeName = $reviewee?->tutorProfile?->full_name ?? $reviewee?->studentProfile?->full_name ?? $reviewee?->email ?? 'Tutor';

        UserActivity::log($user->id, UserActivity::TYPE_REVIEW_SUBMITTED, "Reviewed {$revieweeName} after a lesson");

        Notification::createForUser(
            $revieweeId,
            Notification::TYPE_REVIEW_RECEIVED,
            'New review',
            "{$reviewerName} left you a {$rating}-star review.",
            ['booking_id' => $booking->id, 'review_id' => $review->id]
        );

        try {
            $mail = new MailService();
            $mail->sendReviewReceived(
                $reviewee?->email ?? '',
                'New review',
                "{$reviewerName} left you a {$rating}-star review after your lesson."
            );
        } catch (\Throwable $e) {
            error_log('Review email failed: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'review' => [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
            ],
        ]);
    }

    /**
     * List published reviews for a tutor (public-facing).
     */
    public function forTutor(string $tutorId)
    {
        $reviews = Review::query()
            ->with(['reviewer.studentProfile', 'reviewer.tutorProfile'])
            ->where('reviewee_id', $tutorId)
            ->where('status', Review::STATUS_APPROVED)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Review $review) {
                return [
                    'id' => $review->id,
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'reviewer' => [
                        'id' => $review->reviewer_id,
                        'name' => $review->reviewer?->studentProfile?->full_name
                            ?? $review->reviewer?->tutorProfile?->full_name
                            ?? $review->reviewer?->email,
                    ],
                    'created_at' => $review->created_at?->format('Y-m-d H:i:s'),
                ];
            })
            ->all();

        return response()->json(['reviews' => $reviews]);
    }

    /**
     * Whether the current user has already reviewed a given booking.
     */
    public function check(string $bookingId)
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->json(['reviewed' => false, 'error' => 'Unauthorized'], 401);
        }

        return response()->json([
            'reviewed' => Review::existsFor($bookingId, $user->id),
        ]);
    }
}