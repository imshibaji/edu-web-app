<?php

namespace App\Controllers\Auth;

use App\Models\StudentProfile;
use App\Models\TutorProfile;
use App\Models\User;
use App\Models\UserActivity;

class RegisterController extends Controller
{
    public function show()
    {
        $form = flash()->display('form') ?? [];

        response()->inertia('auth/register', array_merge($form, [
            'errors' => flash()->display('error') ?? [],
        ]));
    }

    public function store()
    {
        $credentials = request()->validate([
            'fullName' => 'min:2|max:255',
            'email' => 'email',
            'phoneNumber*' => 'optional|phone',
            'role' => 'in<[STUDENT,TUTOR]>',
            'password' => 'min:8',
            'confirmPassword*' => 'matchesValueOf:password',
        ]);

        if (!$credentials) {
            return response()
                ->withFlash('form', request()->body())
                ->withFlash('error', request()->errors())
                ->redirect('/auth/register', 303);
        }

        $role = in_array($credentials['role'] ?? null, [User::ROLE_TUTOR], true)
            ? User::ROLE_TUTOR
            : User::ROLE_STUDENT;

        $userData = [
            'id' => (string) \Illuminate\Support\Str::orderedUuid(),
            'email' => $credentials['email'],
            'password_hash' => $credentials['password'],
            'role' => $role,
        ];

        $success = auth()->register($userData);

        if (!$success) {
            return response()
                ->withFlash('form', request()->body())
                ->withFlash('error', auth()->errors())
                ->redirect('/auth/register', 303);
        }

        $user = User::query()->where('email', $userData['email'])->first();

        if ($user) {
            if ($role === User::ROLE_TUTOR) {
                TutorProfile::create([
                    'user_id' => $user->id,
                    'full_name' => $credentials['fullName'],
                    'hourly_rate' => 0,
                    'currency' => 'USD',
                    'is_verified' => false,
                    'format' => 'ONLINE',
                    'experience_level' => 'ENTRY',
                    'rating' => 0,
                ]);
            } else {
                StudentProfile::create([
                    'user_id' => $user->id,
                    'full_name' => $credentials['fullName'],
                    'phone_number' => $credentials['phoneNumber'] ?? null,
                ]);
            }

            UserActivity::log($user->id, UserActivity::TYPE_REGISTERED, "Created a {$role} account");
        }

        return response()->redirect('/dashboard', 303);
    }
}
