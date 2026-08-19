<?php

namespace App\Controllers;

use App\Models\AvailabilitySlot;
use App\Models\Booking;
use App\Models\Currency;
use App\Models\Subject;
use App\Models\TutorProfileReview;
use App\Models\TutorSubject;
use App\Models\User;
use App\Models\UserActivity;

class TutorController extends Controller
{
    public function index()
    {
        $user = $this->resolveTutor();

        if ($user instanceof \Leaf\Http\Response) {
            return $user;
        }

        $profile = $user->tutorProfile;

        $subjects = $user->tutorSubjects()
            ->orderBy('name')
            ->get()
            ->map(fn ($subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
                'rate_cents' => (int) $subject->pivot->rate_cents,
            ])
            ->values()
            ->all();

        $slots = AvailabilitySlot::query()
            ->where('tutor_id', $user->id)
            ->orderBy('start_time')
            ->get()
            ->map(fn ($slot) => [
                'id' => $slot->id,
                'start' => $slot->start_time,
                'end' => $slot->end_time,
                'booked' => (bool) $slot->is_booked,
            ])
            ->values()
            ->all();

        $enquiries = Booking::query()
            ->where('tutor_id', $user->id)
            ->with(['student', 'subject'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($booking) => $this->enquiryCard($booking))
            ->values()
            ->all();

        $openUpcoming = collect($slots)
            ->filter(fn ($slot) => !$slot['booked'] && strtotime($slot['start']) > time())
            ->count();

        $pending = collect($enquiries)
            ->where('status', Booking::STATUS_PENDING_PAYMENT)
            ->count();

        response()->inertia('tutor/index', [
            'profile' => $this->profileProps($profile),
            'subjects' => $subjects,
            'pendingReview' => TutorProfileReview::query()
                ->where('tutor_id', $user->id)
                ->where('status', TutorProfileReview::STATUS_PENDING)
                ->exists(),
            'stats' => [
                'slots' => count($slots),
                'open' => $openUpcoming,
                'enquiries' => count($enquiries),
                'pending' => $pending,
            ],
            'recentEnquiries' => array_slice($enquiries, 0, 5),
        ]);
    }

    public function availability()
    {
        $user = $this->resolveTutor();

        if ($user instanceof \Leaf\Http\Response) {
            return $user;
        }

        $slots = AvailabilitySlot::query()
            ->where('tutor_id', $user->id)
            ->orderBy('start_time')
            ->get()
            ->map(fn ($slot) => [
                'id' => $slot->id,
                'start' => $slot->start_time,
                'end' => $slot->end_time,
                'booked' => (bool) $slot->is_booked,
            ])
            ->values()
            ->all();

        response()->inertia('tutor/availability', [
            'profile' => $this->profileProps($user->tutorProfile),
            'slots' => $slots,
        ]);
    }

    public function enquiries()
    {
        $user = $this->resolveTutor();

        if ($user instanceof \Leaf\Http\Response) {
            return $user;
        }

        $enquiries = Booking::query()
            ->where('tutor_id', $user->id)
            ->with(['student', 'subject'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($booking) => $this->enquiryCard($booking))
            ->values()
            ->all();

        response()->inertia('tutor/enquiries', [
            'profile' => $this->profileProps($user->tutorProfile),
            'enquiries' => $enquiries,
        ]);
    }

    public function editProfile()
    {
        $user = $this->resolveTutor();

        if ($user instanceof \Leaf\Http\Response) {
            return $user;
        }

        $pending = TutorProfileReview::query()
            ->where('tutor_id', $user->id)
            ->where('status', TutorProfileReview::STATUS_PENDING)
            ->orderByDesc('created_at')
            ->first();

        response()->inertia('tutor/profile', [
            'profile' => $this->profileSnapshot($user->tutorProfile),
            'pending' => $pending ? $this->reviewProps($pending) : null,
            'errors' => flash()->display('errors') ?? [],
        ]);
    }

    public function updateProfile()
    {
        $user = $this->authUser();

        if (!$user || !$user->isTutor()) {
            return response()->redirect('/auth/login', 303);
        }

        $user = User::query()->with('tutorProfile')->find($user->id);

        if (!$user || !$user->tutorProfile) {
            return response()->redirect('/tutor', 303);
        }

        $data = request()->validate([
            'fullName' => 'min:2|max:255',
            'headline' => 'optional|max:255',
            'bio' => 'optional',
            'city' => 'optional|max:100',
            'format' => 'in<[ONLINE,IN_PERSON,BOTH]>',
            'experience' => 'in<[ENTRY,MID,SENIOR]>',
            'rate' => 'numeric',
            'currency' => 'in<[INR,USD,EUR,GBP,AED,SGD]>',
            'stripeAccountId' => 'optional|max:255',
            'payoutMethod' => 'optional|max:50',
            'payoutDetails' => 'optional',
        ]);

        if (!$data) {
            return response()
                ->withFlash('errors', request()->errors())
                ->redirect('/tutor/profile', 303);
        }

        $rateDollars = (float) ($data['rate'] ?? 0);

        if ($rateDollars < 0 || $rateDollars > 100000) {
            return response()
                ->withFlash('errors', ['rate' => 'Rate must be between 0 and 100000.'])
                ->redirect('/tutor/profile', 303);
        }

        // Profile fields that require admin review
        $proposed = [
            'full_name' => $data['fullName'],
            'headline' => $this->normalize($data['headline'] ?? null),
            'bio' => $this->normalize($data['bio'] ?? null),
            'city' => $this->normalize($data['city'] ?? null),
            'format' => $data['format'],
            'experience_level' => $data['experience'],
            'hourly_rate' => (int) round($rateDollars * 100),
            'currency' => $data['currency'],
        ];

        // Payment fields that can be updated directly (no admin review needed)
        $paymentFields = [];
        if (!empty($data['stripeAccountId'])) {
            $paymentFields['stripe_account_id'] = $data['stripeAccountId'];
        }
        if (!empty($data['payoutMethod'])) {
            $paymentFields['payout_method'] = $data['payoutMethod'];
        }
        if (isset($data['payoutDetails'])) {
            $paymentFields['payout_details'] = is_array($data['payoutDetails']) ? $data['payoutDetails'] : [];
        }

        $avatarPath = $this->handleAvatarUpload();

        if ($avatarPath === false) {
            return response()
                ->withFlash('error', 'Avatar upload failed. Use a JPG, PNG, WebP or GIF under 5MB.')
                ->redirect('/tutor/profile', 303);
        }

        $profile = $user->tutorProfile;

        $hasDiff = false;
        foreach ($proposed as $field => $value) {
            if ((string) $profile->{$field} !== (string) ($value ?? '')) {
                $hasDiff = true;
                break;
            }
        }

        if (!$hasDiff && !$avatarPath && empty($paymentFields)) {
            return response()
                ->withFlash('success', 'No changes to save.')
                ->redirect('/tutor/profile', 303);
        }

        $snapshot = $proposed;

        if ($avatarPath) {
            $snapshot['avatar_url'] = $avatarPath;
        }

        // Update payment fields immediately
        if (!empty($paymentFields)) {
            $profile->update($paymentFields);
            UserActivity::log($user->id, UserActivity::TYPE_PROFILE_SUBMITTED, 'Updated payment information');
        }

        $pending = TutorProfileReview::query()
            ->where('tutor_id', $user->id)
            ->where('status', TutorProfileReview::STATUS_PENDING)
            ->first();

        if ($pending) {
            if ($avatarPath && $pending->avatar_url && $pending->avatar_url !== $avatarPath) {
                $this->deleteAvatarFile($pending->avatar_url);
            }

            $pending->update($snapshot);
        } else {
            TutorProfileReview::create(array_merge($snapshot, [
                'tutor_id' => $user->id,
                'status' => TutorProfileReview::STATUS_PENDING,
            ]));
        }

        UserActivity::log($user->id, UserActivity::TYPE_PROFILE_SUBMITTED, 'Submitted profile changes for admin review');

        return response()
            ->withFlash('success', 'Profile changes submitted for admin review.')
            ->redirect('/tutor/profile', 303);
    }

    public function addSlot()
    {
        $user = $this->authUser();

        if (!$user || !$user->isTutor()) {
            return response()->redirect('/auth/login', 303);
        }

        $data = request()->validate([
            'start' => 'string',
            'end' => 'string',
        ]);

        $start = strtotime($data['start'] ?? '');
        $end = strtotime($data['end'] ?? '');

        if ($start === false || $end === false || $end <= $start) {
            return response()
                ->withFlash('error', ['slot' => 'Please provide valid start and end times.'])
                ->redirect('/tutor/availability', 303);
        }

        AvailabilitySlot::create([
            'tutor_id' => $user->id,
            'start_time' => gmdate('Y-m-d H:i:s', $start),
            'end_time' => gmdate('Y-m-d H:i:s', $end),
            'is_booked' => false,
        ]);

        UserActivity::log($user->id, UserActivity::TYPE_SLOT_ADDED, 'Added an availability slot');

        return response()
            ->withFlash('success', 'Availability slot added.')
            ->redirect('/tutor/availability', 303);
    }

    public function deleteSlot()
    {
        $user = $this->authUser();

        if (!$user || !$user->isTutor()) {
            return response()->redirect('/auth/login', 303);
        }

        $slot = AvailabilitySlot::query()
            ->where('id', request()->get('slot'))
            ->where('tutor_id', $user->id)
            ->first();

        if ($slot && !$slot->is_booked) {
            $slot->delete();
            UserActivity::log($user->id, UserActivity::TYPE_SLOT_DELETED, 'Removed an availability slot');
        }

        return response()
            ->withFlash('success', 'Availability slot removed.')
            ->redirect('/tutor/availability', 303);
    }

    public function subjects()
    {
        $user = $this->resolveTutor();

        if ($user instanceof \Leaf\Http\Response) {
            return $user;
        }

        $linkedIds = $user->tutorSubjects()->pluck('subjects.id');

        $subjects = $user->tutorSubjects()
            ->orderBy('name')
            ->get()
            ->map(fn ($subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
                'description' => $subject->description,
                'slug' => $subject->slug,
                'status' => $subject->status,
                'rate_cents' => (int) $subject->pivot->rate_cents,
            ])
            ->values()
            ->all();

        $catalog = Subject::query()
            ->active()
            ->whereNotIn('id', $linkedIds)
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

        response()->inertia('tutor/subjects', [
            'profile' => $this->profileProps($user->tutorProfile),
            'subjects' => $subjects,
            'catalog' => $catalog,
            'errors' => flash()->display('errors') ?? [],
        ]);
    }

    public function addSubject()
    {
        $user = $this->authUser();

        if (!$user || !$user->isTutor()) {
            return response()->redirect('/auth/login', 303);
        }

        $data = request()->validate([
            'subjectId' => 'string',
            'rate' => 'numeric',
        ]);

        $subject = Subject::query()->find($data['subjectId'] ?? '');
        $rateDollars = (float) ($data['rate'] ?? 0);

        if (!$subject) {
            return response()
                ->withFlash('errors', ['subjectId' => 'Please choose a subject from the list.'])
                ->redirect('/tutor/subjects', 303);
        }

        if ($rateDollars < 0 || $rateDollars > 100000) {
            return response()
                ->withFlash('errors', ['rate' => 'Rate must be between 0 and 100000.'])
                ->redirect('/tutor/subjects', 303);
        }

        $exists = TutorSubject::query()
            ->where('tutor_id', $user->id)
            ->where('subject_id', $subject->id)
            ->exists();

        if ($exists) {
            return response()
                ->withFlash('error', 'That subject is already in your list.')
                ->redirect('/tutor/subjects', 303);
        }

        $rateCents = (int) round($rateDollars * 100);
        $currency = $user->tutorProfile?->currency ?? Currency::DEFAULT;

        TutorSubject::create([
            'tutor_id' => $user->id,
            'subject_id' => $subject->id,
            'rate_cents' => $rateCents,
        ]);

        UserActivity::log(
            $user->id,
            UserActivity::TYPE_SUBJECT_ADDED,
            "Added {$subject->name} at " . Currency::format($rateCents, $currency) . '/hr',
        );

        return response()
            ->withFlash('success', 'Subject added with its charge.')
            ->redirect('/tutor/subjects', 303);
    }

    /**
     * Let a tutor propose a brand-new subject that isn't in the catalog.
     * The subject is created with PENDING status and linked to the tutor;
     * it stays hidden from public listings until an admin approves it.
     */
    public function proposeSubject()
    {
        $user = $this->authUser();

        if (!$user || !$user->isTutor()) {
            return response()->redirect('/auth/login', 303);
        }

        $data = request()->validate([
            'name' => 'string',
            'description' => 'string',
            'rate' => 'numeric',
        ]);

        $name = trim((string) ($data['name'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        $rateDollars = (float) ($data['rate'] ?? 0);

        if ($name === '') {
            return response()
                ->withFlash('errors', ['name' => 'Subject name is required.'])
                ->redirect('/tutor/subjects', 303);
        }

        if (mb_strlen($name) > 150) {
            return response()
                ->withFlash('errors', ['name' => 'Subject name must be under 150 characters.'])
                ->redirect('/tutor/subjects', 303);
        }

        if ($rateDollars < 0 || $rateDollars > 100000) {
            return response()
                ->withFlash('errors', ['rate' => 'Rate must be between 0 and 100000.'])
                ->redirect('/tutor/subjects', 303);
        }

        $duplicate = Subject::query()
            ->whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->first();

        if ($duplicate) {
            return response()
                ->withFlash('errors', ['name' => 'A subject with that name already exists.'])
                ->redirect('/tutor/subjects', 303);
        }

        $subject = Subject::create([
            'name' => $name,
            'description' => $description !== '' ? $description : null,
            'slug' => Subject::makeSlug($name),
            'status' => Subject::STATUS_PENDING,
            'proposed_by' => $user->id,
        ]);

        $rateCents = (int) round($rateDollars * 100);

        TutorSubject::create([
            'tutor_id' => $user->id,
            'subject_id' => $subject->id,
            'rate_cents' => $rateCents,
        ]);

        UserActivity::log(
            $user->id,
            UserActivity::TYPE_SUBJECT_ADDED,
            "Proposed new subject {$subject->name} for admin review",
        );

        return response()
            ->withFlash('success', "Subject \"{$subject->name}\" submitted for admin review.")
            ->redirect('/tutor/subjects', 303);
    }

    public function updateSubject()
    {
        $user = $this->authUser();

        if (!$user || !$user->isTutor()) {
            return response()->redirect('/auth/login', 303);
        }

        $data = request()->validate([
            'subjectId' => 'string',
            'rate' => 'numeric',
        ]);

        $rateDollars = (float) ($data['rate'] ?? 0);

        if ($rateDollars < 0 || $rateDollars > 100000) {
            return response()
                ->withFlash('errors', ['rate' => 'Rate must be between 0 and 100000.'])
                ->redirect('/tutor/subjects', 303);
        }

        $updated = TutorSubject::query()
            ->where('tutor_id', $user->id)
            ->where('subject_id', $data['subjectId'] ?? '')
            ->update(['rate_cents' => (int) round($rateDollars * 100)]);

        if (!$updated) {
            return response()
                ->withFlash('error', 'Subject not found in your list.')
                ->redirect('/tutor/subjects', 303);
        }

        $rateCents = (int) round($rateDollars * 100);
        $currency = $user->tutorProfile?->currency ?? Currency::DEFAULT;
        $subjectName = Subject::query()->where('id', $data['subjectId'])->value('name');

        UserActivity::log(
            $user->id,
            UserActivity::TYPE_SUBJECT_UPDATED,
            "Updated the charge for {$subjectName} to " . Currency::format($rateCents, $currency) . '/hr',
        );

        return response()
            ->withFlash('success', 'Subject charge updated.')
            ->redirect('/tutor/subjects', 303);
    }

    public function removeSubject()
    {
        $user = $this->authUser();

        if (!$user || !$user->isTutor()) {
            return response()->redirect('/auth/login', 303);
        }

        $deleted = TutorSubject::query()
            ->where('tutor_id', $user->id)
            ->where('subject_id', request()->get('subjectId'))
            ->delete();

        if (!$deleted) {
            return response()
                ->withFlash('error', 'Subject not found in your list.')
                ->redirect('/tutor/subjects', 303);
        }

        $subjectName = Subject::query()->where('id', request()->get('subjectId'))->value('name');

        UserActivity::log($user->id, UserActivity::TYPE_SUBJECT_REMOVED, "Removed {$subjectName}");

        return response()
            ->withFlash('success', 'Subject removed from your list.')
            ->redirect('/tutor/subjects', 303);
    }

    protected function resolveTutor()
    {
        $user = auth()->user();

        if (!$user) {
            return response()->redirect('/auth/login', 303);
        }

        $user = User::query()->with('tutorProfile')->find($user->id);

        if (!$user || !$user->isTutor()) {
            return response()->redirect('/dashboard', 303);
        }

        if (!$user->tutorProfile) {
            return response()->redirect('/dashboard', 303);
        }

        return $user;
    }

    protected function profileProps($profile)
    {
        $user = $profile->user()->first();

        return [
            'name' => $profile->full_name,
            'headline' => $profile->headline,
            'bio' => $profile->bio,
            'city' => $profile->city,
            'format' => $profile->format,
            'level' => $profile->experience_level,
            'rating' => (float) $profile->rating,
            'verified' => (bool) $profile->is_verified,
            'rate' => (int) $profile->hourly_rate,
            'currency' => $profile->currency,
            'avatar' => $profile->avatar_url,
            'username' => $user?->username,
        ];
    }

    protected function reviewProps($review)
    {
        return [
            'full_name' => $review->full_name,
            'headline' => $review->headline,
            'bio' => $review->bio,
            'city' => $review->city,
            'format' => $review->format,
            'experience_level' => $review->experience_level,
            'hourly_rate' => $review->hourly_rate,
            'currency' => $review->currency,
            'avatar_url' => $review->avatar_url,
            'created_at' => $review->created_at,
        ];
    }

    protected function profileSnapshot($profile)
    {
        return [
            'full_name' => $profile->full_name,
            'headline' => $profile->headline,
            'bio' => $profile->bio,
            'city' => $profile->city,
            'format' => $profile->format,
            'experience_level' => $profile->experience_level,
            'hourly_rate' => (int) $profile->hourly_rate,
            'currency' => $profile->currency,
            'avatar_url' => $profile->avatar_url,
            'created_at' => null,
        ];
    }

    protected function normalize($value)
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    protected function handleAvatarUpload()
    {
        $file = request()->files('avatar');

        if (!$file || (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            return null;
        }

        if ((int) ($file['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
            return false;
        }

        $ext = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));

        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true)) {
            return false;
        }

        if ((int) ($file['size'] ?? 0) > 5 * 1024 * 1024) {
            return false;
        }

        $name = (string) \Illuminate\Support\Str::orderedUuid() . '.' . $ext;

        $info = request()->upload('avatar', $this->avatarDir(), ['name' => $name]);

        if (!$info) {
            return false;
        }

        if (!@getimagesize($info['path'])) {
            $this->deleteAvatarFile('uploads/avatars/' . $info['name']);

            return false;
        }

        return 'uploads/avatars/' . $info['name'];
    }

    protected function avatarDir()
    {
        return ($_SERVER['DOCUMENT_ROOT'] ?? (getcwd() . '/public')) . '/uploads/avatars';
    }

    protected function deleteAvatarFile($path)
    {
        if (!is_string($path) || !str_starts_with($path, 'uploads/avatars/')) {
            return;
        }

        $full = $this->avatarDir() . '/' . basename($path);

        if (is_file($full)) {
            @unlink($full);
        }
    }

    protected function enquiryCard($booking)
    {
        return [
            'id' => $booking->id,
            'student' => $booking->student?->studentProfile?->full_name ?? $booking->student?->email ?? 'Unknown',
            'subject' => $booking->subject?->name,
            'scheduled_at' => $booking->scheduled_at,
            'amount' => $booking->amount,
            'currency' => $booking->currency,
            'status' => $booking->status,
            'notes' => $booking->notes,
            'created_at' => $booking->created_at,
        ];
    }
}
