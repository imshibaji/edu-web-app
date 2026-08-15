<?php

namespace App\Controllers;

use App\Models\AvailabilitySlot;
use App\Models\Booking;
use App\Models\Subject;
use App\Models\TutorProfile;
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
            'scheduled_at' => 'optional|max:20',
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

        $subjectId = $data['subject_id'] ?? null;
        if ($subjectId) {
            $subjectId = Subject::query()->where('id', $subjectId)->value('id');
        } else {
            $subjectId = null;
        }

        $slotId = null;
        $scheduledAt = null;

        if (!empty($data['scheduled_at'])) {
            $slot = AvailabilitySlot::query()
                ->where('tutor_id', $tutorId)
                ->where('is_booked', false)
                ->where('start_time', '>=', $data['scheduled_at'])
                ->orderBy('start_time')
                ->first();

            if ($slot) {
                $slotId = $slot->id;
                $scheduledAt = $slot->start_time;
            }
        }

        $profile = $tutor->tutorProfile;

        $booking = Booking::create([
            'student_id' => $user->id,
            'tutor_id' => $tutorId,
            'subject_id' => $subjectId,
            'slot_id' => $slotId,
            'scheduled_at' => $scheduledAt,
            'duration_minutes' => 60,
            'amount' => (int) $profile->hourly_rate,
            'currency' => $profile->currency,
            'status' => Booking::STATUS_PENDING_PAYMENT,
            'notes' => !empty($data['notes']) ? $data['notes'] : null,
        ]);

        UserActivity::log($user->id, UserActivity::TYPE_TRIAL_BOOKED, "Booked a trial lesson with {$profile->full_name}");

        return response()
            ->withFlash('success', 'Trial lesson request sent to ' . $profile->full_name . '.')
            ->redirect('/', 303);
    }
}
