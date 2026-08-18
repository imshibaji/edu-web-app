<?php

namespace App\Controllers;

use App\Models\AvailabilitySlot;
use App\Models\Currency;
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

    public function subjects()
    {
        $specialtyBreakdown = Subject::query()
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
            ->orderBy('name')
            ->get()
            ->map(fn ($subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
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
