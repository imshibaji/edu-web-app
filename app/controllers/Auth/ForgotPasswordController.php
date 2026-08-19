<?php

namespace App\Controllers\Auth;

use App\Controllers\Controller;
use App\Models\PasswordReset;
use App\Models\User;
use App\Services\MailService;
use Exception;
use Illuminate\Support\Str;

class ForgotPasswordController extends Controller
{
    private MailService $mailService;

    public function __construct()
    {
        $this->mailService = new MailService();
    }

    /**
     * Show the forgot password form (Inertia page).
     */
    public function show(): \Leaf\Response
    {
        $form = flash()->display('form') ?? [];

        response()->inertia('auth/forgot-password', array_merge($form, [
            'errors' => flash()->display('error') ?? [],
            'success' => flash()->display('success') ?? null,
        ]));
    }

    /**
     * Handle the forgot password form submission.
     */
    public function store(): \Leaf\Response
    {
        $email = strtolower(trim((string) request()->get('email', '')));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()
                ->withFlash('form', ['email' => $email])
                ->withFlash('error', ['email' => 'Please enter a valid email address.'])
                ->redirect('/auth/forgot-password', 303);
        }

        $user = User::query()->where('email', $email)->first();

        // Always show the same generic message to prevent email enumeration.
        if ($user) {
            $token = Str::random(64);

            PasswordReset::query()->updateOrCreate(
                ['email' => $email],
                ['token' => $token, 'created_at' => \Carbon\Carbon::now()],
            );

            try {
                $this->mailService->sendPasswordResetEmail($email, $token);
            } catch (Exception $e) {
                error_log('Forgot password email failed: ' . $e->getMessage());
            }
        }

        return response()
            ->withFlash('success', 'If an account with that email exists, a password reset link has been sent.')
            ->redirect('/auth/forgot-password', 303);
    }
}