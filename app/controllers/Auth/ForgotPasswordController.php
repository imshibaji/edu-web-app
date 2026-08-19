<?php

namespace App\Controllers\Auth;

use App\Controllers\Controller;
use App\Models\PasswordReset;
use App\Models\User;
use App\Services\MailService;
use Exception;

class ForgotPasswordController extends Controller
{
    private MailService $mailService;

    public function __construct()
    {
        $this->mailService = new MailService();
    }

    /**
     * Show the forgot password form.
     */
    public function show(): \Leaf\View|string
    {
        return view('auth.forgot-password');
    }

    /**
     * Handle the forgot password form submission.
     */
    public function store(): \Leaf\Response
    {
        $data = request()->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::query()->where('email', $data['email'])->first();

        if (!$user) {
            return response()
                ->withFlash('error', ['email' => 'No account found with that email address.'])
                ->redirect('/auth/forgot-password', 303);
        }

        // Generate a random token
        $token = Str::random(60);

        // Store the password reset record (upsert - create or update)
        PasswordReset::query()
            ->where('email', $data['email'])
            ->updateOrCreate(
                ['email' => $data['email']],
                ['token' => $token, 'created_at' => now()]
            );

        // Send reset email
        try {
            $this->mailService->sendForgotPasswordEmail($data['email']);
        } catch (Exception $e) {
            // Log the error but don't fail the request
            \Leaf\Log::error('Forgot password email failed: ' . $e->getMessage());
        }

        // Respond with a success message that prevents email enumeration
        return response()
            ->withFlash('success', 'If an account with that email exists, a password reset link has been sent.')
            ->redirect('/auth/forgot-password', 303);
    }
}