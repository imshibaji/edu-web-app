<?php

namespace App\Services;

use App\Models\PasswordReset;
use App\Models\User;
use Illuminate\Support\Str;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mailer\Transport;
use Symfony\Component\Mailer\Transport\TransportInterface;
use Symfony\Component\Mime\Email;

class MailService
{
    private Mailer $mailer;

    public function __construct()
    {
        $this->mailer = new Mailer($this->buildTransport());
    }

    /**
     * Build a Symfony Mailer v8 transport from the configured SMTP settings.
     */
    private function buildTransport(): TransportInterface
    {
        $host = (string) env('MAIL_HOST', 'smtp.mailtrap.io');
        $port = (int) env('MAIL_PORT', 2525);
        $username = (string) env('MAIL_USERNAME', '');
        $password = (string) env('MAIL_PASSWORD', '');
        $encryption = strtolower((string) env('MAIL_ENCRYPTION', 'tls'));

        $auth = $username !== ''
            ? rawurlencode($username) . ':' . rawurlencode($password) . '@'
            : '';

        $dsn = "smtp://{$auth}{$host}:{$port}";

        if ($encryption === 'tls' || $encryption === 'starttls') {
            $dsn .= '?encryption=tls';
        }

        return Transport::fromDsn($dsn);
    }

    /**
     * Send a password reset email.
     */
    public function sendPasswordResetEmail(string $email, string $token): void
    {
        $appUrl = rtrim((string) env('APP_URL', 'http://localhost'), '/');
        $resetUrl = "{$appUrl}/auth/reset-password/{$token}";

        $email = (new Email())
            ->from(env('MAIL_FROM_ADDRESS', 'no-reply@example.com'), env('MAIL_FROM_NAME', 'Larnr'))
            ->to($email)
            ->subject('Reset your password')
            ->text("Password reset request\n\nClick here to reset your password: {$resetUrl}")
            ->html("<p>Password reset request</p><p>Click <a href=\"{$resetUrl}\">here</a> to reset your password.</p>");

        $this->mailer->send($email);
    }

    /**
     * Send a forgot password email (request received).
     */
    public function sendForgotPasswordEmail(string $email): void
    {
        $email = (new Email())
            ->from(env('MAIL_FROM_ADDRESS', 'no-reply@example.com'), env('MAIL_FROM_NAME', 'Larnr'))
            ->to($email)
            ->subject('Password reset requested')
            ->text("Someone requested a password reset for your Larnr account.\n\nIf you did not request this, you can ignore this email.")
            ->html("<p>Someone requested a password reset for your Larnr account.</p><p>If you did not request this, you can ignore this email.</p>");

        $this->mailer->send($email);
    }

    /**
     * Send a password reset success email.
     */
    public function sendResetSuccessEmail(string $email): void
    {
        $email = (new Email())
            ->from(env('MAIL_FROM_ADDRESS', 'no-reply@example.com'), env('MAIL_FROM_NAME', 'Larnr'))
            ->to($email)
            ->subject('Your password has been reset')
            ->text("Your password has been successfully reset.\n\nYou can now log in to your Larnr account using your new password.")
            ->html("<p>Your password has been successfully reset.</p><p>You can now <a href=\"/auth/login\">log in</a> to your Larnr account using your new password.</p>");

        $this->mailer->send($email);
    }

    /**
     * Send a booking request notification to tutor.
     */
    public function sendBookingRequest(string $tutorEmail, string $studentName, string $bookingId): void
    {
        $email = (new Email())
            ->from(env('MAIL_FROM_ADDRESS', 'no-reply@example.com'), env('MAIL_FROM_NAME', 'Larnr'))
            ->to($tutorEmail)
            ->subject('New lesson request')
            ->text("{$studentName} requested a trial lesson with you.\n\nLogin to your dashboard to view the details and confirm the booking.")
            ->html("<p>{$studentName} requested a trial lesson with you.</p><p>Login to your dashboard to view the details and <a href=\"/dashboard\">confirm the booking.</a></p>");

        $this->mailer->send($email);
    }

    /**
     * Send booking confirmed email to student.
     */
    public function sendBookingConfirmed(string $studentEmail, string $tutorName): void
    {
        $email = (new Email())
            ->from(env('MAIL_FROM_ADDRESS', 'no-reply@example.com'), env('MAIL_FROM_NAME', 'Larnr'))
            ->to($studentEmail)
            ->subject('Lesson confirmed')
            ->text("Your lesson with {$tutorName} has been confirmed and payment has been received by the platform.")
            ->html("<p>Your lesson with <strong>{$tutorName}</strong> has been confirmed and payment has been received by the platform.</p>");

        $this->mailer->send($email);
    }

    /**
     * Send lesson reminder email.
     */
    public function sendLessonReminder(string $email, string $title, string $message): void
    {
        $email = (new Email())
            ->from(env('MAIL_FROM_ADDRESS', 'no-reply@example.com'), env('MAIL_FROM_NAME', 'Larnr'))
            ->to($email)
            ->subject($title)
            ->text($message)
            ->html("<p>{$message}</p>");

        $this->mailer->send($email);
    }

    /**
     * Send lesson completed email.
     */
    public function sendLessonCompleted(string $email, string $tutorName, string $studentName): void
    {
        $email = (new Email())
            ->from(env('MAIL_FROM_ADDRESS', 'no-reply@example.com'), env('MAIL_FROM_NAME', 'Larnr'))
            ->to($email)
            ->subject('Lesson completed')
            ->text("Your lesson with {$tutorName} with {$studentName} has been marked as completed.")
            ->html("<p>Your lesson with <strong>{$tutorName}</strong> with <strong>{$studentName}</strong> has been marked as <strong>completed</strong>.</p>");

        $this->mailer->send($email);
    }

    /**
     * Send lesson cancelled email.
     */
    public function sendLessonCancelled(string $email, string $title, string $message): void
    {
        $email = (new Email())
            ->from(env('MAIL_FROM_ADDRESS', 'no-reply@example.com'), env('MAIL_FROM_NAME', 'Larnr'))
            ->to($email)
            ->subject($title)
            ->text($message)
            ->html("<p>{$message}</p>");

        $this->mailer->send($email);
    }

    /**
     * Send payment received email to tutor.
     */
    public function sendPaymentReceived(string $tutorEmail, string $amount, string $currency): void
    {
        $email = (new Email())
            ->from(env('MAIL_FROM_ADDRESS', 'no-reply@example.com'), env('MAIL_FROM_NAME', 'Larnr'))
            ->to($tutorEmail)
            ->subject('Payment received')
            ->text("Payment of {$amount} {$currency} has been received for your lesson.")
            ->html("<p>Payment of <strong>{$amount}</strong> {$currency} has been received for your lesson.</p>");

        $this->mailer->send($email);
    }

    /**
     * Send review received email.
     */
    public function sendReviewReceived(string $email, string $title, string $message): void
    {
        $email = (new Email())
            ->from(env('MAIL_FROM_ADDRESS', 'no-reply@example.com'), env('MAIL_FROM_NAME', 'Larnr'))
            ->to($email)
            ->subject($title)
            ->text($message)
            ->html("<p>{$message}</p>");

        $this->mailer->send($email);
    }
}