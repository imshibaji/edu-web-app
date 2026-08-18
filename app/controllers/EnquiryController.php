<?php

namespace App\Controllers;

use App\Models\AvailabilitySlot;
use App\Models\Booking;
use App\Models\Notification;
use App\Models\Subject;
use App\Models\TutorProfile;
use App\Models\TutorSubject;
use App\Models\User;
use App\Models\UserActivity;

class EnquiryController extends Controller
{
    public function store()
    {
        $user = auth()->user();

        if (!$user) {
            return response()
                ->withFlash('error', ['auth' => 'Please log in to book a trial lesson.'])
                ->redirect('/auth/login', 303);
        }

        $data = request()->validate([
            'tutor_id' => 'max:36',
            'subject_id' => 'optional|max:36',
            'slot_id' => 'optional|max:36',
            'notes' => 'optional|max:1000',
        ]);

        $tutorId = $data['tutor_id'] ?? null;

        if (!$tutorId || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $tutorId)) {
            return response()
                ->withFlash('error', ['tutor_id' => 'Invalid tutor selected.'])
                ->redirect('/', 303);
        }

        $tutor = User::query()
            ->where('id', $tutorId)
            ->where('role', User::ROLE_TUTOR)
            ->with('tutorProfile')
            ->first();

        if (!$tutor || !$tutor->tutorProfile) {
            return response()
                ->withFlash('error', ['tutor_id' => 'Tutor not found.'])
                ->redirect('/', 303);
        }

        $profile = $tutor->tutorProfile;

        // Validate subject belongs to this tutor
        $subjectId = $data['subject_id'] ?? null;
        $subjectRate = null;

        if ($subjectId) {
            $tutorSubject = TutorSubject::query()
                ->where('tutor_id', $tutorId)
                ->where('subject_id', $subjectId)
                ->first();

            if (!$tutorSubject) {
                return response()
                    ->withFlash('error', ['subject_id' => 'This tutor does not teach the selected subject.'])
                    ->redirect('/', 303);
            }

            $subjectId = $tutorSubject->subject_id;
            $subjectRate = (int) $tutorSubject->rate_cents;
        } else {
            $subjectId = null;
        }

        // Validate and lock the selected slot
        $slotId = $data['slot_id'] ?? null;
        $scheduledAt = null;

        if (!$slotId) {
            return response()
                ->withFlash('error', ['slot_id' => 'Please select an available time slot.'])
                ->redirect('/', 303);
        }

        $slot = AvailabilitySlot::query()
            ->where('id', $slotId)
            ->where('tutor_id', $tutorId)
            ->where('is_booked', false)
            ->where('start_time', '>', date('Y-m-d H:i:s'))
            ->first();

        if (!$slot) {
            return response()
                ->withFlash('error', ['slot_id' => 'The selected time slot is no longer available. Please choose another.'])
                ->redirect('/', 303);
        }

        $slotId = $slot->id;
        $scheduledAt = $slot->start_time;

        // Use per-subject rate when available, otherwise the tutor's profile rate
        $amount = $subjectRate !== null ? $subjectRate : (int) $profile->hourly_rate;

        $booking = Booking::create([
            'student_id' => $user->id,
            'tutor_id' => $tutorId,
            'subject_id' => $subjectId,
            'slot_id' => $slotId,
            'scheduled_at' => $scheduledAt,
            'duration_minutes' => 60,
            'amount' => $amount,
            'currency' => $profile->currency,
            'status' => Booking::STATUS_PENDING_PAYMENT,
            'notes' => !empty($data['notes']) ? $data['notes'] : null,
        ]);

        UserActivity::log($user->id, UserActivity::TYPE_TRIAL_BOOKED, "Booked a trial lesson with {$profile->full_name}");

        $studentName = $user->studentProfile?->full_name ?? $user->email;
        $this->notify(
            $tutorId,
            Notification::TYPE_BOOKING_REQUEST,
            'New lesson request',
            "{$studentName} requested a trial lesson with you.",
            ['booking_id' => $booking->id, 'student_id' => $user->id]
        );

        return response()
            ->withFlash('success', 'Trial lesson request sent to ' . $profile->full_name . '.')
            ->redirect('/payment/checkout/' . $booking->id, 303);
    }
}
