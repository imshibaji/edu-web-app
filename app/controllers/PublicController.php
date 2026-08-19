<?php

namespace App\Controllers;

use App\Models\AvailabilitySlot;
use App\Models\Booking;
use App\Models\Currency;
use App\Models\Review;
use App\Models\Subject;
use App\Models\TutorProfile;
use App\Models\User;

class PublicController extends Controller
{
    public function index()
    {
        response()->inertia('public/home', $this->tutorListingData(request()));
    }
    public function tutors()
    {
        response()->inertia('public/tutors', $this->tutorListingData(request()));
    }

    public function tutorProfile($id)
    {
        $profile = TutorProfile::query()
            ->with(['subjects' => fn ($q) => $q->active()])
            ->where('user_id', $id)
            ->first();

        if (!$profile) {
            return response()->redirect('/tutors', 303);
        }

        $available = AvailabilitySlot::query()
            ->where('tutor_id', $id)
            ->where('is_booked', false)
            ->where('start_time', '>', date('Y-m-d H:i:s'))
            ->orderBy('start_time')
            ->get()
            ->map(fn ($slot) => [
                'id' => $slot->id,
                'start' => $slot->start_time,
                'end' => $slot->end_time,
            ])
            ->values()
            ->all();

        $reviews = Review::query()
            ->with(['reviewer.studentProfile', 'reviewer.tutorProfile'])
            ->where('reviewee_id', $id)
            ->where('status', Review::STATUS_APPROVED)
            ->orderByDesc('created_at')
            ->get();

        $reviewsMapped = $reviews
            ->map(fn (Review $review) => [
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
            ])
            ->values()
            ->all();

        $ratingFromReviews = $reviews->avg('rating');
        $reviewCount = $reviews->count();

        $lessonCount = Booking::query()
            ->where('tutor_id', $id)
            ->whereIn('status', [
                Booking::STATUS_CONFIRMED,
                Booking::STATUS_COMPLETED,
            ])
            ->count();

        $activeStudents = Booking::query()
            ->where('tutor_id', $id)
            ->whereIn('status', [
                Booking::STATUS_CONFIRMED,
                Booking::STATUS_COMPLETED,
            ])
            ->distinct('student_id')
            ->count('student_id');

        $recentBookings = Booking::query()
            ->where('tutor_id', $id)
            ->where('created_at', '>', date('Y-m-d H:i:s', strtotime('-7 days')))
            ->count();

        $subjectIds = $profile->subjects->pluck('id')->all();

        $relatedQuery = TutorProfile::query()
            ->with(['subjects'])
            ->where('user_id', '!=', $id)
            ->orderByDesc('rating');

        if (!empty($subjectIds)) {
            $relatedQuery->whereHas('subjects', fn ($q) => $q->whereIn('subjects.id', $subjectIds));
        }

        $related = $relatedQuery->limit(3)->get();

        $relatedMapped = $related->map(fn ($t) => [
            'id' => $t->user_id,
            'name' => $t->full_name,
            'headline' => $t->headline,
            'avatar' => $t->avatar_url,
            'rate' => (int) $t->hourly_rate,
            'currency' => $t->currency,
            'rating' => (float) $t->rating,
            'verified' => (bool) $t->is_verified,
            'city' => $t->city,
            'username' => $t->user?->username,
        ])->values()->all();

        response()->inertia('public/tutor-profile', [
            'tutor' => [
                'id' => $profile->user_id,
                'name' => $profile->full_name,
                'avatar' => $profile->avatar_url,
                'headline' => $profile->headline,
                'bio' => $profile->bio,
                'city' => $profile->city,
                'format' => $profile->format,
                'level' => $profile->experience_level,
                'rating' => $ratingFromReviews ? round($ratingFromReviews, 1) : (float) $profile->rating,
                'verified' => (bool) $profile->is_verified,
                'rate' => (int) $profile->hourly_rate,
                'currency' => $profile->currency,
                'subjects' => $profile->subjects
                    ->map(fn ($subject) => [
                        'id' => $subject->id,
                        'name' => $subject->name,
                        'slug' => $subject->slug,
                        'description' => $subject->description,
                        'rate_cents' => (int) $subject->pivot->rate_cents,
                    ])
                    ->values()
                    ->all(),
                'slotsAvailable' => count($available),
            ],
            'slots' => $available,
            'reviews' => $reviewsMapped,
            'reviewCount' => $reviewCount,
            'lessonCount' => $lessonCount,
            'activeStudents' => $activeStudents,
            'recentBookings' => $recentBookings,
            'related' => $relatedMapped,
        ]);
    }

    public function tutorProfileByUsername($username)
    {
        $user = \App\Models\User::query()
            ->where('username', $username)
            ->whereNotNull('username')
            ->first();

        if (!$user) {
            return response()->redirect('/tutors', 303);
        }

        return $this->tutorProfile($user->id);
    }

    public function usernameAvailable()
    {
        $username = request()->query('username', '');

        if (empty($username)) {
            return response()->json(['available' => false]);
        }

        $exists = \App\Models\User::query()
            ->where('username', $username)
            ->whereNotNull('username')
            ->first();

        return response()->json(['available' => !$exists]);
    }

    public function subjects()
    {
        $specialtyBreakdown = Subject::query()
            ->active()
            ->withCount('tutors')
            ->orderByDesc('tutors_count')
            ->get()
            ->map(fn ($subject) => [
                'name' => $subject->name,
                'count' => (int) $subject->tutors_count,
            ])
            ->values()
            ->all();

        $subjects = Subject::query()
            ->active()
            ->orderBy('name')
            ->get()
            ->map(fn ($subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
                'description' => $subject->description,
                'slug' => $subject->slug,
            ])
            ->values()
            ->all();

        response()->inertia('public/subjects', [
            'specialties' => $specialtyBreakdown,
            'subjects' => $subjects,
            'totalTutors' => (int) TutorProfile::query()->count(),
            'citiesCount' => (int) TutorProfile::query()->whereNotNull('city')->distinct('city')->count(),
        ]);
    }

    /**
     * Public SEO landing page for a single subject (e.g. /subject/mathematics).
     */
    public function subject($slug)
    {
        $subject = Subject::query()
            ->active()
            ->where('slug', $slug)
            ->first();

        if (!$subject) {
            return response()->redirect('/subjects', 303);
        }

        $tutors = TutorProfile::query()
            ->with(['subjects', 'user'])
            ->whereHas('subjects', fn ($q) => $q->where('subjects.id', $subject->id))
            ->orderByDesc('rating')
            ->limit(12)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->user_id,
                'name' => $t->full_name,
                'avatar' => $t->avatar_url,
                'headline' => $t->headline,
                'city' => $t->city,
                'rating' => (float) $t->rating,
                'verified' => (bool) $t->is_verified,
                'rate' => (int) $t->hourly_rate,
                'currency' => $t->currency,
                'username' => $t->user?->username,
                'slotsAvailable' => 0,
            ])
            ->values()
            ->all();

        response()->inertia('public/subject', [
            'subject' => [
                'id' => $subject->id,
                'name' => $subject->name,
                'description' => $subject->description,
                'slug' => $subject->slug,
            ],
            'tutors' => $tutors,
            'totalTutors' => (int) TutorProfile::query()
                ->whereHas('subjects', fn ($q) => $q->where('subjects.id', $subject->id))
                ->count(),
        ]);
    }

    public function interviewPrep()
    {
        response()->inertia('public/interview-prep');
    }

    public function about()
    {
        response()->inertia('public/about');
    }

    public function careers()
    {
        response()->inertia('public/careers');
    }

    public function contact()
    {
        response()->inertia('public/contact');
    }

    public function contactSubmit()
    {
        $request = request();

        $name = trim((string) $request->get('name', ''));
        $email = trim((string) $request->get('email', ''));
        $message = trim((string) $request->get('message', ''));

        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $message === '') {
            return response()
                ->withFlash('error', 'Please fill in your name, a valid email and a message.')
                ->redirect('/contact', 303);
        }

        return response()
            ->withFlash('success', 'Thanks for reaching out! We will get back to you shortly.')
            ->redirect('/contact', 303);
    }

    public function privacy()
    {
        response()->inertia('public/privacy');
    }

    public function help()
    {
        response()->inertia('public/help');
    }

    public function terms()
    {
        response()->inertia('public/terms');
    }

    public function trustSafety()
    {
        response()->inertia('public/trust-safety');
    }

    /**
     * JSON API endpoint returning current exchange rates for the frontend.
     */
    public function currencyRates()
    {
        $settings = Currency::allSettings();
        $baseCurrency = Currency::getBaseCurrency();

        header('Content-Type: application/json');
        header('Cache-Control: public, max-age=300');
        echo json_encode([
            'base' => $baseCurrency,
            'rates' => $settings,
        ]);
        exit;
    }

    /**
     * JSON API endpoint returning available (unbooked, future) slots for a tutor.
     */
    public function availableSlots($id)
    {
        $tutor = User::query()
            ->where('id', $id)
            ->where('role', User::ROLE_TUTOR)
            ->first();

        if (!$tutor) {
            header('Content-Type: application/json');
            http_response_code(404);
            echo json_encode(['error' => 'Tutor not found.']);
            exit;
        }

        $slots = AvailabilitySlot::query()
            ->where('tutor_id', $id)
            ->where('is_booked', false)
            ->where('start_time', '>', date('Y-m-d H:i:s'))
            ->orderBy('start_time')
            ->get()
            ->map(fn ($slot) => [
                'id' => $slot->id,
                'start' => $slot->start_time,
                'end' => $slot->end_time,
            ])
            ->values()
            ->all();

        header('Content-Type: application/json');
        echo json_encode(['slots' => $slots]);
        exit;
    }
}
