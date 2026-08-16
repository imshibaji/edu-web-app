<?php

namespace App\Controllers\Auth;

use App\Models\AvailabilitySlot;
use App\Models\Currency;
use App\Models\Subject;
use App\Models\Transaction;
use App\Models\TutorProfile;
use App\Models\TutorProfileReview;
use App\Models\User;
use App\Models\UserActivity;

class AdminController extends Controller
{
    public function reviews()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $reviews = TutorProfileReview::query()
            ->with('tutor.tutorProfile')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($review) => [
                'id' => $review->id,
                'tutorName' => $review->tutor?->tutorProfile?->full_name ?? $review->tutor?->email ?? 'Unknown tutor',
                'status' => $review->status,
                'created_at' => $review->created_at,
                'reviewed_at' => $review->reviewed_at,
                'reviewer' => $review->reviewer?->email,
                'live' => $this->liveProps($review->tutor?->tutorProfile),
                'proposed' => $this->reviewProps($review),
            ])
            ->values()
            ->all();

        response()->inertia('admin/reviews', [
            'reviews' => $reviews,
            'errors' => flash()->display('errors') ?? [],
        ]);
    }

    public function approve()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $review = TutorProfileReview::query()->find(request()->get('review'));

        if (!$review || $review->status !== TutorProfileReview::STATUS_PENDING) {
            return response()
                ->withFlash('errors', ['review' => 'Review not found or already handled.'])
                ->redirect('/admin/reviews', 303);
        }

        $profile = TutorProfile::query()->find($review->tutor_id);

        if (!$profile) {
            return response()
                ->withFlash('errors', ['review' => 'Tutor profile not found.'])
                ->redirect('/admin/reviews', 303);
        }

        $oldAvatar = $profile->avatar_url;

        $profile->update([
            'full_name' => $review->full_name,
            'headline' => $review->headline,
            'bio' => $review->bio,
            'city' => $review->city,
            'format' => $review->format,
            'experience_level' => $review->experience_level,
            'hourly_rate' => $review->hourly_rate,
            'currency' => $review->currency,
            'avatar_url' => $review->avatar_url ?? $oldAvatar,
        ]);

        if ($review->avatar_url && $oldAvatar && $oldAvatar !== $review->avatar_url) {
            $this->deleteAvatarFile($oldAvatar);
        }

        $review->update([
            'status' => TutorProfileReview::STATUS_APPROVED,
            'reviewed_by' => $user->id,
            'reviewed_at' => date('Y-m-d H:i:s'),
        ]);

        UserActivity::log($user->id, UserActivity::TYPE_PROFILE_APPROVED, "Approved profile changes for {$profile->full_name}");

        return response()
            ->withFlash('success', "Changes for {$profile->full_name} published.")
            ->redirect('/admin/reviews', 303);
    }

    public function reject()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $review = TutorProfileReview::query()->find(request()->get('review'));

        if (!$review || $review->status !== TutorProfileReview::STATUS_PENDING) {
            return response()
                ->withFlash('errors', ['review' => 'Review not found or already handled.'])
                ->redirect('/admin/reviews', 303);
        }

        $review->update([
            'status' => TutorProfileReview::STATUS_REJECTED,
            'reviewed_by' => $user->id,
            'reviewed_at' => date('Y-m-d H:i:s'),
        ]);

        $tutorName = $review->tutor?->tutorProfile?->full_name ?? 'a tutor';

        UserActivity::log($user->id, UserActivity::TYPE_PROFILE_REJECTED, "Rejected profile changes for {$tutorName}");

        return response()
            ->withFlash('success', 'Review rejected. The public profile is unchanged.')
            ->redirect('/admin/reviews', 303);
    }

    public function activities()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $role = (string) (request()->get('role') ?? 'all');
        $search = trim((string) (request()->get('search') ?? ''));

        $query = UserActivity::query()
            ->with(['user.tutorProfile', 'user.studentProfile'])
            ->orderByDesc('created_at');

        if (in_array($role, ['tutor', 'student', 'admin'], true)) {
            $query->whereHas('user', fn ($q) => $q->where('role', strtoupper($role)));
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($u) use ($search) {
                        $u->where('email', 'like', "%{$search}%")
                            ->orWhereHas('tutorProfile', fn ($p) => $p->where('full_name', 'like', "%{$search}%"))
                            ->orWhereHas('studentProfile', fn ($p) => $p->where('full_name', 'like', "%{$search}%"));
                    });
            });
        }

        $result = $this->paginate($query, 5);

        $activities = collect($result['items'])
            ->map(fn ($activity) => UserActivity::present($activity))
            ->values()
            ->all();

        response()->inertia('admin/activities', [
            'activities' => $activities,
            'role' => $role,
            'search' => $search,
            'pagination' => $result['pagination'],
            'counts' => [
                'all' => UserActivity::query()->count(),
                'tutor' => $this->activityCount(User::ROLE_TUTOR),
                'student' => $this->activityCount(User::ROLE_STUDENT),
                'admin' => $this->activityCount(User::ROLE_ADMIN),
            ],
        ]);
    }

    public function users()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $role = (string) (request()->get('role') ?? 'all');
        $search = trim((string) (request()->get('search') ?? ''));

        $query = User::query()
            ->with(['tutorProfile', 'studentProfile'])
            ->orderByDesc('created_at');

        if (in_array(strtoupper($role), [User::ROLE_STUDENT, User::ROLE_TUTOR, User::ROLE_ADMIN], true)) {
            $query->where('role', strtoupper($role));
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhereHas('tutorProfile', fn ($p) => $p->where('full_name', 'like', "%{$search}%"))
                    ->orWhereHas('studentProfile', fn ($p) => $p->where('full_name', 'like', "%{$search}%"));
            });
        }

        $result = $this->paginate($query, 5);

        $users = collect($result['items'])
            ->map(fn ($u) => [
                'id' => $u->id,
                'email' => $u->email,
                'role' => $u->role,
                'name' => $u->tutorProfile?->full_name ?? $u->studentProfile?->full_name,
                'is_active' => (bool) $u->is_active,
                'created_at' => $u->created_at,
            ])
            ->values()
            ->all();

        response()->inertia('admin/users', [
            'users' => $users,
            'role' => $role,
            'search' => $search,
            'pagination' => $result['pagination'],
            'counts' => [
                'all' => User::query()->count(),
                'STUDENT' => User::query()->where('role', User::ROLE_STUDENT)->count(),
                'TUTOR' => User::query()->where('role', User::ROLE_TUTOR)->count(),
                'ADMIN' => User::query()->where('role', User::ROLE_ADMIN)->count(),
            ],
        ]);
    }

    public function toggleUser()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $target = User::query()->find(request()->get('user'));

        if (!$target) {
            return response()
                ->withFlash('error', 'User not found.')
                ->redirect('/admin/users', 303);
        }

        if ($target->id === $user->id) {
            return response()
                ->withFlash('error', 'You cannot deactivate your own account.')
                ->redirect('/admin/users', 303);
        }

        $target->update(['is_active' => !(bool) $target->is_active]);

        UserActivity::log($user->id, UserActivity::TYPE_ACCOUNT_UPDATED, sprintf(
            '%s %s account for %s',
            $target->is_active ? 'Activated' : 'Deactivated',
            strtolower($target->role),
            $target->email
        ));

        return response()
            ->withFlash('success', sprintf('%s is now %s.', $target->email, $target->is_active ? 'active' : 'deactivated'))
            ->redirect('/admin/users', 303);
    }

    public function subjects()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $subjects = Subject::query()
            ->withCount('tutors')
            ->orderBy('name')
            ->get()
            ->map(fn ($subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
                'tutor_count' => (int) $subject->tutors_count,
            ])
            ->values()
            ->all();

        response()->inertia('admin/subjects', [
            'subjects' => $subjects,
            'errors' => flash()->display('errors') ?? [],
        ]);
    }

    public function createSubject()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $name = trim((string) request()->get('name', ''));

        if ($name === '') {
            return response()
                ->withFlash('errors', ['name' => 'Subject name is required.'])
                ->redirect('/admin/subjects', 303);
        }

        if (Subject::query()->whereRaw('LOWER(name) = ?', [strtolower($name)])->exists()) {
            return response()
                ->withFlash('errors', ['name' => 'A subject with that name already exists.'])
                ->redirect('/admin/subjects', 303);
        }

        $subject = Subject::create(['name' => $name]);

        UserActivity::log($user->id, UserActivity::TYPE_SUBJECT_ADDED, "Created subject {$subject->name}");

        return response()
            ->withFlash('success', "Subject \"{$subject->name}\" created.")
            ->redirect('/admin/subjects', 303);
    }

    public function updateSubject()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $subject = Subject::query()->find(request()->get('subject'));
        $name = trim((string) request()->get('name', ''));

        if (!$subject) {
            return response()
                ->withFlash('error', 'Subject not found.')
                ->redirect('/admin/subjects', 303);
        }

        if ($name === '') {
            return response()
                ->withFlash('errors', ['name' => 'Subject name is required.'])
                ->redirect('/admin/subjects', 303);
        }

        if (Subject::query()
            ->where('id', '!=', $subject->id)
            ->whereRaw('LOWER(name) = ?', [strtolower($name)])
            ->exists()) {
            return response()
                ->withFlash('errors', ['name' => 'A subject with that name already exists.'])
                ->redirect('/admin/subjects', 303);
        }

        $subject->update(['name' => $name]);

        UserActivity::log($user->id, UserActivity::TYPE_SUBJECT_UPDATED, "Renamed subject to {$subject->name}");

        return response()
            ->withFlash('success', "Subject renamed to \"{$subject->name}\".")
            ->redirect('/admin/subjects', 303);
    }

    public function deleteSubject()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $subject = Subject::query()->find(request()->get('subject'));

        if (!$subject) {
            return response()
                ->withFlash('error', 'Subject not found.')
                ->redirect('/admin/subjects', 303);
        }

        $name = $subject->name;
        $subject->delete();

        UserActivity::log($user->id, UserActivity::TYPE_SUBJECT_REMOVED, "Deleted subject {$name}");

        return response()
            ->withFlash('success', "Subject \"{$name}\" deleted.")
            ->redirect('/admin/subjects', 303);
    }

    public function tutors()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $search = trim((string) (request()->get('search') ?? ''));
        $verified = (string) (request()->get('verified') ?? 'all');

        $query = TutorProfile::query()
            ->with(['subjects', 'user'])
            ->orderByDesc('created_at');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('headline', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$search}%"));
            });
        }

        if (in_array($verified, ['true', 'false'], true)) {
            $query->where('is_verified', $verified === 'true');
        }

        $slotCounts = AvailabilitySlot::query()
            ->where('is_booked', false)
            ->where('start_time', '>', date('Y-m-d H:i:s'))
            ->get()
            ->groupBy('tutor_id')
            ->map->count();

        $result = $this->paginate($query, 5);

        $tutors = collect($result['items'])
            ->map(fn ($t) => [
                'id' => $t->user_id,
                'name' => $t->full_name,
                'email' => $t->user?->email,
                'headline' => $t->headline,
                'city' => $t->city,
                'rate' => (int) $t->hourly_rate,
                'currency' => $t->currency,
                'rating' => (float) $t->rating,
                'verified' => (bool) $t->is_verified,
                'active' => (bool) $t->user?->is_active,
                'subjects' => $t->subjects->map(fn ($s) => $s->name)->values()->all(),
                'slots' => $slotCounts[$t->user_id] ?? 0,
                'created_at' => $t->created_at,
            ])
            ->values()
            ->all();

        response()->inertia('admin/tutors', [
            'tutors' => $tutors,
            'search' => $search,
            'verified' => $verified,
            'pagination' => $result['pagination'],
            'counts' => [
                'all' => TutorProfile::query()->count(),
                'true' => TutorProfile::query()->where('is_verified', true)->count(),
                'false' => TutorProfile::query()->where('is_verified', false)->count(),
            ],
        ]);
    }

    public function toggleVerify()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $profile = TutorProfile::query()->find(request()->get('tutor'));

        if (!$profile) {
            return response()
                ->withFlash('error', 'Tutor not found.')
                ->redirect('/admin/tutors', 303);
        }

        $profile->update(['is_verified' => !(bool) $profile->is_verified]);

        UserActivity::log($user->id, UserActivity::TYPE_PROFILE_APPROVED, sprintf(
            '%s tutor %s',
            $profile->is_verified ? 'Verified' : 'Unverified',
            $profile->full_name
        ));

        return response()
            ->withFlash('success', sprintf('%s is now %s.', $profile->full_name, $profile->is_verified ? 'verified' : 'unverified'))
            ->redirect('/admin/tutors', 303);
    }

    public function students()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $search = trim((string) (request()->get('search') ?? ''));

        $query = User::query()
            ->where('role', User::ROLE_STUDENT)
            ->with(['studentProfile'])
            ->withCount('bookingsAsStudent');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhereHas('studentProfile', fn ($p) => $p->where('full_name', 'like', "%{$search}%")->orWhere('phone_number', 'like', "%{$search}%"));
            });
        }

        $result = $this->paginate($query->orderByDesc('created_at'), 5);

        $students = collect($result['items'])
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->studentProfile?->full_name,
                'email' => $u->email,
                'phone' => $u->studentProfile?->phone_number,
                'bookings' => (int) $u->bookings_as_student_count,
                'active' => (bool) $u->is_active,
                'created_at' => $u->created_at,
            ])
            ->values()
            ->all();

        response()->inertia('admin/students', [
            'students' => $students,
            'search' => $search,
            'pagination' => $result['pagination'],
            'counts' => [
                'total' => User::query()->where('role', User::ROLE_STUDENT)->count(),
                'active' => User::query()->where('role', User::ROLE_STUDENT)->where('is_active', true)->count(),
            ],
        ]);
    }

    public function payments()
    {
        $user = $this->authUser();

        if (!$user || !$user->isAdmin()) {
            return response()->redirect('/dashboard', 303);
        }

        $status = (string) (request()->get('status') ?? 'all');
        $type = (string) (request()->get('type') ?? 'all');

        $query = Transaction::query()
            ->with(['booking.student.studentProfile', 'booking.tutor.tutorProfile', 'booking.subject'])
            ->orderByDesc('created_at');

        if (in_array($status, [Transaction::STATUS_PENDING, Transaction::STATUS_SUCCESS, Transaction::STATUS_FAILED], true)) {
            $query->where('status', $status);
        }

        if (in_array($type, [
            Transaction::TYPE_LESSON_PAYMENT,
            Transaction::TYPE_ESCROW_RELEASE,
            Transaction::TYPE_REFUND,
            Transaction::TYPE_PLATFORM_FEE,
        ], true)) {
            $query->where('type', $type);
        }

        $result = $this->paginate($query, 5);

        $transactions = collect($result['items'])
            ->map(fn ($t) => [
                'id' => $t->id,
                'type' => $t->type,
                'status' => $t->status,
                'amount' => (int) $t->amount,
                'currency' => $t->currency,
                'platform_fee' => (int) ($t->platform_fee ?? 0),
                'student' => $t->booking?->student?->studentProfile?->full_name ?? $t->booking?->student?->email ?? '—',
                'tutor' => $t->booking?->tutor?->tutorProfile?->full_name ?? '—',
                'subject' => $t->booking?->subject?->name,
                'created_at' => $t->created_at,
            ])
            ->values()
            ->all();

        $successBase = Transaction::query()->where('status', Transaction::STATUS_SUCCESS);
        $baseCurrency = strtoupper((string) ($user->base_currency ?? Currency::DEFAULT));

        $totalAmount = 0;
        $platformFees = 0;

        foreach ($successBase->get() as $tx) {
            $totalAmount += Currency::convert((int) $tx->amount, $tx->currency, $baseCurrency);
            $platformFees += Currency::convert((int) ($tx->platform_fee ?? 0), $tx->currency, $baseCurrency);
        }

        response()->inertia('admin/payments', [
            'transactions' => $transactions,
            'status' => $status,
            'type' => $type,
            'pagination' => $result['pagination'],
            'summary' => [
                'total_amount' => $totalAmount,
                'platform_fees' => $platformFees,
                'base_currency' => $baseCurrency,
                'success_count' => (int) Transaction::query()->where('status', Transaction::STATUS_SUCCESS)->count(),
                'pending_count' => (int) Transaction::query()->where('status', Transaction::STATUS_PENDING)->count(),
            ],
        ]);
    }
}
