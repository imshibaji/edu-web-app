<?php

namespace App\Controllers\Auth;

use App\Controllers\Controller;
use App\Models\User;
use App\Models\PasswordReset;
use Exception;

class ResetPasswordController extends Controller
{
    /**
     * Show the reset password form with token validation.
     */
    public function show(string $token): \Leaf\View|string
    {
        // Validate the token exists and is not expired
        $passwordReset = PasswordReset::query()
            ->where('token', $token)
            ->where('created_at', '>=', now()->subHours(1))
            ->first();

        if (!$passwordReset) {
            return view('auth.reset-password', ['token' => $token, 'error' => 'Invalid or expired reset token.']);
        }

        return view('auth.reset-password', ['token' => $token]);
    }

    /**
     * Handle the reset password form submission.
     */
    public function store(): \Leaf\Response
    {
        $data = request()->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        // Validate the token matches the email and is not expired
        $passwordReset = PasswordReset::query()
            ->where('token', $data['token'])
            ->where('email', $data['email'])
            ->where('created_at', '>=', now()->subHours(1))
            ->first();

        if (!$passwordReset) {
            return response()
                ->withFlash('error', ['general' => 'Invalid or expired reset token.'])
                ->redirect('/auth/login', 303);
        }

        // Update the user's password
        $user = User::query()->where('email', $data['email'])->first();

        if (!$user) {
            return response()
                ->withFlash('error', ['general' => 'User not found.'])
                ->redirect('/auth/login', 303);
        }

        // Hash the password using Leaf's password helper
        $user->password_hash = \Leaf\Hash::make($data['password']);
        $user->save();

        // Remove the used token
        $passwordReset->delete();

        // Send reset success email
        try {
            (new \App\Services\MailService())->sendResetSuccessEmail($data['email']);
        } catch (Exception $e) {
            \Leaf\Log::error('Reset success email failed: ' . $e->getMessage());
        }

        return response()
            ->withFlash('success', 'Your password has been reset successfully. You can now log in.')
            ->redirect('/auth/login', 303);
    }
}