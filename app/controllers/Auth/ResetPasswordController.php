<?php

namespace App\Controllers\Auth;

use App\Controllers\Controller;
use App\Models\PasswordReset;
use App\Models\User;
use App\Services\MailService;
use Exception;
use Leaf\Database;
use Leaf\Helpers\Password;

class ResetPasswordController extends Controller
{
    /**
     * Show the reset password form with token validation (Inertia page).
     */
    public function show(string $token): \Leaf\Response
    {
        // Ensure Eloquent resolver is booted
        if (!\Illuminate\Database\Eloquent\Model::getConnectionResolver()) {
            Database::connect();
        }

        if ($token === '') {
            return response()
                ->withFlash('error', ['general' => 'Invalid or expired reset token.'])
                ->redirect('/auth/forgot-password', 303);
        }

        $passwordReset = PasswordReset::query()
            ->where('token', $token)
            ->where('created_at', '>=', \Carbon\Carbon::now()->subHours(1))
            ->first();

        if (!$passwordReset) {
            return response()
                ->withFlash('error', ['general' => 'Invalid or expired reset token.'])
                ->redirect('/auth/forgot-password', 303);
        }

        response()->inertia('auth/reset-password', [
            'token' => $token,
            'errors' => flash()->display('error') ?? [],
        ]);
    }

    /**
     * Handle the reset password form submission.
     */
    public function store(): \Leaf\Response
    {
        // Ensure Eloquent resolver is booted
        if (!\Illuminate\Database\Eloquent\Model::getConnectionResolver()) {
            Database::connect();
        }

        $token = trim((string) request()->get('token', ''));
        $email = strtolower(trim((string) request()->get('email', '')));
        $password = (string) request()->get('password', '');
        $passwordConfirmation = (string) request()->get('password_confirmation', '');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return response()
                ->withFlash('error', ['general' => 'Please enter a valid email address.'])
                ->redirect('/auth/reset-password/' . $token, 303);
        }

        if (mb_strlen($password) < 8) {
            return response()
                ->withFlash('error', ['password' => 'Password must be at least 8 characters.'])
                ->redirect('/auth/reset-password/' . $token, 303);
        }

        if ($password !== $passwordConfirmation) {
            return response()
                ->withFlash('error', ['password' => 'Passwords do not match.'])
                ->redirect('/auth/reset-password/' . $token, 303);
        }

        // Validate the token matches the email and is not expired.
        $passwordReset = PasswordReset::query()
            ->where('token', $token)
            ->where('email', $email)
            ->where('created_at', '>=', \Carbon\Carbon::now()->subHours(1))
            ->first();

        if (!$passwordReset) {
            return response()
                ->withFlash('error', ['general' => 'Invalid or expired reset token.'])
                ->redirect('/auth/login', 303);
        }

        $user = User::query()->where('email', $email)->first();

        if (!$user) {
            return response()
                ->withFlash('error', ['general' => 'User not found.'])
                ->redirect('/auth/login', 303);
        }

        // Hash using the same helper as auth()->register().
        $user->password_hash = Password::hash($password);
        $user->save();

        // Remove the used token.
        $passwordReset->delete();

        try {
            (new MailService())->sendResetSuccessEmail($email);
        } catch (Exception $e) {
            error_log('Reset success email failed: ' . $e->getMessage());
        }

        return response()
            ->withFlash('success', 'Your password has been reset successfully. You can now log in.')
            ->redirect('/auth/login', 303);
    }
}