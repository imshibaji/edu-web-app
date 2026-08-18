<?php

namespace App\Services;

use App\Models\AvailabilitySlot;
use App\Models\Booking;
use App\Models\Currency;
use App\Models\TutorProfile;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Notification;
use App\Models\Payout;
use Exception;
use Illuminate\Support\Str;
use Stripe\Stripe;
use Stripe\Exception\ApiErrorException;
use Stripe\Checkout\Session as StripeSession;
use Stripe\PaymentIntent;
use Stripe\Account as StripeAccount;
use Stripe\AccountLink;
use Stripe\Transfer;
use Stripe\Payout as StripePayout;

class StripeService
{
    private const DEFAULT_PLATFORM_FEE_PERCENT = 15;
    private const DEFAULT_PROCESSING_FEE_PERCENT = 2.9;
    private const DEFAULT_PROCESSING_FEE_FIXED = 30; // cents

    private bool $isDevelopmentMode = false;

    public function __construct()
    {
        $secret = \Leaf\Config::get('stripe.secret_key') ?? \env('STRIPE_SECRET_KEY');
        
        // Check if we're in development mode with dummy credentials
        $this->isDevelopmentMode = $secret === 'sk_test_dummy_key_for_testing' || 
                                   \env('STRIPE_SECRET_KEY') === 'sk_test_dummy_key_for_testing';
        
        if (!$this->isDevelopmentMode) {
            Stripe::setApiKey($secret);
        }
    }
    
    /**
     * Check if running in development mode with dummy credentials.
     */
    public function isDevelopmentMode(): bool
    {
        return $this->isDevelopmentMode;
    }

    /**
     * Get current platform fee percentage from config.
     */
    public function getPlatformFeePercent(): int
    {
        return (int) (\Leaf\Config::get('stripe.platform_fee_percent') ?? self::DEFAULT_PLATFORM_FEE_PERCENT);
    }

    /**
     * Get processing fee percentage.
     */
    public function getProcessingFeePercent(): float
    {
        return (float) (\Leaf\Config::get('stripe.processing_fee_percent') ?? self::DEFAULT_PROCESSING_FEE_PERCENT);
    }

    /**
     * Get processing fee fixed amount (in cents).
     */
    public function getProcessingFeeFixed(): int
    {
        return (int) (\Leaf\Config::get('stripe.processing_fee_fixed') ?? self::DEFAULT_PROCESSING_FEE_FIXED);
    }

    /**
     * Calculate all fees for an amount.
     * Returns array with: platform_fee, processing_fee, total_fees, net_amount
     */
    public function calculateFees(int $amount, string $currency = 'usd'): array
    {
        $platformFeePercent = $this->getPlatformFeePercent();
        $processingFeePercent = $this->getProcessingFeePercent();
        $processingFeeFixed = $this->getProcessingFeeFixed();

        $platformFee = (int) round($amount * $platformFeePercent / 100);
        $processingFee = (int) round($amount * $processingFeePercent / 100) + $processingFeeFixed;
        $totalFees = $platformFee + $processingFee;
        $netAmount = $amount - $totalFees;

        return [
            'platform_fee' => $platformFee,
            'processing_fee' => $processingFee,
            'total_fees' => $totalFees,
            'net_amount' => max(0, $netAmount),
            'platform_fee_percent' => $platformFeePercent,
            'processing_fee_percent' => $processingFeePercent,
            'processing_fee_fixed' => $processingFeeFixed,
        ];
    }

    /**
     * Create a Stripe Checkout Session for lesson payment.
     * Payment goes to platform account (no transfer_data).
     */
    public function createCheckoutSession(
        Booking $booking,
        string $successUrl,
        string $cancelUrl
    ): object {
        $tutor = $booking->tutor;
        $student = $booking->student;
        $tutorProfile = $tutor->tutorProfile;

        // Tutor doesn't need Stripe account at booking time
        // Admin will handle payouts later

        $amount = (int) $booking->amount;
        $currency = strtolower($booking->currency);
        $fees = $this->calculateFees($amount, $currency);

        if ($this->isDevelopmentMode) {
            return $this->createMockCheckoutSession($booking, $successUrl, $cancelUrl, $fees);
        }

        return StripeSession::create([
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price_data' => [
                    'currency' => $currency,
                    'product_data' => [
                        'name' => "Trial lesson with {$tutorProfile->full_name}",
                        'description' => $booking->subject?->name ?? 'General tutoring',
                        'metadata' => [
                            'booking_id' => $booking->id,
                        ],
                    ],
                    'unit_amount' => $amount,
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'success_url' => $successUrl . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => $cancelUrl,
            'payment_intent_data' => [
                'metadata' => [
                    'booking_id' => $booking->id,
                    'student_id' => $student->id,
                    'tutor_id' => $tutor->id,
                    'platform_fee' => $fees['platform_fee'],
                    'processing_fee' => $fees['processing_fee'],
                    'net_amount' => $fees['net_amount'],
                ],
            ],
            'metadata' => [
                'booking_id' => $booking->id,
                'student_id' => $student->id,
                'tutor_id' => $tutor->id,
            ],
        ]);
    }

    /**
     * Create a mock checkout session for development mode.
     */
    private function createMockCheckoutSession(
        Booking $booking,
        string $successUrl,
        string $cancelUrl,
        array $fees
    ): object {
        $mockSessionId = 'cs_test_' . Str::random(24);

        $mockPaymentIntentId = 'pi_test_' . Str::random(24);
        // Store the mock session data in the booking for later use
        $booking->update([
            'notes' => ($booking->notes ? $booking->notes . "\n" : '') . 
                "Mock Stripe session: {$mockSessionId} | Payment Intent: {$mockPaymentIntentId} | Amount: {$booking->amount} {$booking->currency} | Platform Fee: {$fees['platform_fee']} | Processing Fee: {$fees['processing_fee']} | Net: {$fees['net_amount']}",
        ]);

        // Create a mock session object that mimics Stripe's Session
        return (object) [
            'id' => $mockSessionId,
            'url' => $successUrl . '?session_id=' . $mockSessionId . '&mock=true',
            'payment_intent' => (object) [
                'id' => $mockPaymentIntentId,
                'amount' => $fees['net_amount'],
                'currency' => strtolower($booking->currency),
                'metadata' => [
                    'booking_id' => $booking->id,
                    'student_id' => $booking->student_id,
                    'tutor_id' => $booking->tutor_id,
                    'platform_fee' => $fees['platform_fee'],
                    'processing_fee' => $fees['processing_fee'],
                    'net_amount' => $fees['net_amount'],
                ],
            ],
            'amount_total' => (int) $booking->amount,
            'currency' => strtolower($booking->currency),
            'metadata' => [
                'booking_id' => $booking->id,
                'student_id' => $booking->student_id,
                'tutor_id' => $booking->tutor_id,
            ],
            'payment_status' => 'paid',
            'status' => 'complete',
        ];
    }

    /**
     * Create a Stripe Connect account link for tutor onboarding.
     * Tutors need Connect accounts for receiving payouts.
     */
    public function createAccountLink(
        string $tutorId,
        string $refreshUrl,
        string $returnUrl
    ): object {
        $tutor = User::query()->find($tutorId);
        $tutorProfile = $tutor?->tutorProfile;

        if (!$tutorProfile) {
            throw new Exception('Tutor profile not found.');
        }

        if ($this->isDevelopmentMode) {
            return $this->createMockAccountLink($tutorId, $refreshUrl, $returnUrl);
        }

        if (!$tutorProfile->stripe_account_id) {
            $account = StripeAccount::create([
                'type' => 'express',
                'country' => 'US',
                'email' => $tutor->email,
                'capabilities' => [
                    'transfers' => ['requested' => true],
                ],
                'business_type' => 'individual',
                'metadata' => [
                    'tutor_id' => $tutorId,
                ],
            ]);

            $tutorProfile->update(['stripe_account_id' => $account->id]);
        }

        return AccountLink::create([
            'account' => $tutorProfile->stripe_account_id,
            'refresh_url' => $refreshUrl,
            'return_url' => $returnUrl,
            'type' => 'account_onboarding',
        ]);
    }

    /**
     * Create a mock account link for development mode.
     */
    private function createMockAccountLink(
        string $tutorId,
        string $refreshUrl,
        string $returnUrl
    ): object {
$mockAccountId = 'acct_test_' . Str::random(16);

        $mockLinkId = 'acclink_test_' . Str::random(24);
        // Update tutor profile with mock account ID
        $tutor = User::query()->find($tutorId);
        $tutorProfile = $tutor?->tutorProfile;
        
        if ($tutorProfile && !$tutorProfile->stripe_account_id) {
            $tutorProfile->update(['stripe_account_id' => $mockAccountId]);
        }

        // Create a mock account link object
        return (object) [
            'id' => $mockLinkId,
            'url' => $returnUrl . '?mock_account_id=' . $mockAccountId . '&mock=true',
            'account' => $mockAccountId,
            'refresh_url' => $refreshUrl,
            'return_url' => $returnUrl,
            'type' => 'account_onboarding',
        ];
    }

    /**
     * Get Stripe Connect account status.
     */
    public function getAccountStatus(string $stripeAccountId): array
    {
        if ($this->isDevelopmentMode) {
            return $this->getMockAccountStatus($stripeAccountId);
        }

        $account = StripeAccount::retrieve($stripeAccountId);
        return [
            'charges_enabled' => $account->charges_enabled ?? false,
            'payouts_enabled' => $account->payouts_enabled ?? false,
            'details_submitted' => $account->details_submitted ?? false,
            'requirements' => $account->requirements ?? [],
        ];
    }

    /**
     * Get mock account status for development mode.
     */
    private function getMockAccountStatus(string $stripeAccountId): array
    {
        // For mock accounts, simulate a fully onboarded account
        if (str_starts_with($stripeAccountId, 'acct_test_')) {
            return [
                'charges_enabled' => true,
                'payouts_enabled' => true,
                'details_submitted' => true,
                'requirements' => [],
            ];
        }

        // For real accounts in dev mode, return default
        return [
            'charges_enabled' => false,
            'payouts_enabled' => false,
            'details_submitted' => false,
            'requirements' => ['details'],
        ];
    }

    /**
     * Release payout to tutor for a specific booking.
     * Creates a Transfer from platform to tutor's Connect account.
     */
    public function releaseBookingPayout(Booking $booking, ?int $customFee = null): object
    {
        $tutorProfile = $booking->tutor->tutorProfile;

        if (!$tutorProfile || !$tutorProfile->stripe_account_id) {
            throw new Exception('Tutor Stripe account not connected.');
        }

        $amount = (int) $booking->amount;
        $currency = strtolower($booking->currency);
        $fees = $this->calculateFees($amount, $currency);

        // Use custom fee if provided (for admin adjustments), otherwise use calculated
        $platformFee = $customFee ?? $fees['platform_fee'];
        $tutorAmount = $amount - $platformFee - $fees['processing_fee'];

        if ($tutorAmount <= 0) {
            throw new Exception('Calculated tutor amount is zero or negative after fees.');
        }

        if ($this->isDevelopmentMode) {
            return $this->createMockTransfer($booking, $tutorAmount, $currency, $fees, $platformFee);
        }

        $transfer = Transfer::create([
            'amount' => $tutorAmount,
            'currency' => $currency,
            'destination' => $tutorProfile->stripe_account_id,
            'metadata' => [
                'booking_id' => $booking->id,
                'type' => 'booking_payout',
                'gross_amount' => $amount,
                'platform_fee' => $platformFee,
                'processing_fee' => $fees['processing_fee'],
                'net_amount' => $tutorAmount,
            ],
        ]);

        // Record payout in our database
        Payout::create([
            'booking_id' => $booking->id,
            'tutor_id' => $booking->tutor_id,
            'stripe_transfer_id' => $transfer->id,
            'gross_amount' => $amount,
            'platform_fee' => $platformFee,
            'processing_fee' => $fees['processing_fee'],
            'net_amount' => $tutorAmount,
            'currency' => strtoupper($currency),
            'status' => 'pending', // will be updated to 'paid' when transfer settles
        ]);

        return $transfer;
    }

    /**
     * Create a mock transfer for development mode.
     */
    private function createMockTransfer(
        Booking $booking,
        int $tutorAmount,
        string $currency,
        array $fees,
        int $platformFee
    ): object {
        $mockTransferId = 'tr_test_' . Str::random(24);
        
        // Record payout in our database
        $payout = Payout::create([
            'booking_id' => $booking->id,
            'tutor_id' => $booking->tutor_id,
            'stripe_transfer_id' => $mockTransferId,
            'gross_amount' => (int) $booking->amount,
            'platform_fee' => $platformFee,
            'processing_fee' => $fees['processing_fee'],
            'net_amount' => $tutorAmount,
            'currency' => strtoupper($currency),
            'status' => 'paid', // immediately paid in mock mode
            'paid_at' => now(),
        ]);

        // Create a mock transfer object
        return (object) [
            'id' => $mockTransferId,
            'amount' => $tutorAmount,
            'currency' => $currency,
            'destination' => $booking->tutor->tutorProfile->stripe_account_id,
            'metadata' => [
                'booking_id' => $booking->id,
                'type' => 'booking_payout',
                'gross_amount' => (int) $booking->amount,
                'platform_fee' => $platformFee,
                'processing_fee' => $fees['processing_fee'],
                'net_amount' => $tutorAmount,
            ],
            'status' => 'paid',
        ];
    }

    /**
     * Bulk release payouts for multiple bookings (weekly/monthly).
     */
    public function releaseBulkPayouts(array $bookingIds): array
    {
        $results = [];
        $errors = [];

        foreach ($bookingIds as $bookingId) {
            try {
                $booking = Booking::query()->find($bookingId);
                if (!$booking) {
                    $errors[] = "Booking {$bookingId} not found";
                    continue;
                }

                if ($booking->status !== Booking::STATUS_COMPLETED) {
                    $errors[] = "Booking {$bookingId} is not completed (status: {$booking->status})";
                    continue;
                }

                // Check if already paid out
                $existingPayout = Payout::query()
                    ->where('booking_id', $bookingId)
                    ->where('status', 'paid')
                    ->first();

                if ($existingPayout) {
                    $errors[] = "Booking {$bookingId} already paid out";
                    continue;
                }

                $transfer = $this->releaseBookingPayout($booking);
                $results[] = [
                    'booking_id' => $bookingId,
                    'transfer_id' => $transfer->id,
                    'amount' => $transfer->amount,
                    'currency' => $transfer->currency,
                ];
            } catch (Exception $e) {
                $errors[] = "Booking {$bookingId}: " . $e->getMessage();
            }
        }

        return [
            'success' => $results,
            'errors' => $errors,
            'total_released' => array_sum(array_column($results, 'amount')),
            'count' => count($results),
        ];
    }

    /**
     * Get pending payouts for admin dashboard.
     */
    public function getPendingPayouts(): array
    {
        $pendingBookings = Booking::query()
            ->where('status', Booking::STATUS_COMPLETED)
            ->whereDoesntHave('payouts', function ($q) {
                $q->where('status', 'paid');
            })
            ->with(['tutor.tutorProfile', 'student.studentProfile', 'subject'])
            ->orderBy('scheduled_at')
            ->get();

        $payouts = [];
        foreach ($pendingBookings as $booking) {
            $tutorProfile = $booking->tutor->tutorProfile;
            $fees = $this->calculateFees((int) $booking->amount, strtolower($booking->currency));
            $netAmount = (int) $booking->amount - $fees['platform_fee'] - $fees['processing_fee'];

            $payouts[] = [
                'booking_id' => $booking->id,
                'student' => $booking->student->studentProfile?->full_name ?? $booking->student->email,
                'tutor' => $tutorProfile->full_name,
                'tutor_email' => $booking->tutor->email,
                'subject' => $booking->subject?->name,
                'scheduled_at' => $booking->scheduled_at,
                'completed_at' => $booking->updated_at,
                'gross_amount' => (int) $booking->amount,
                'platform_fee' => $fees['platform_fee'],
                'processing_fee' => $fees['processing_fee'],
                'net_amount' => max(0, $netAmount),
                'currency' => strtoupper($booking->currency),
                'stripe_account_id' => $tutorProfile->stripe_account_id,
                'payout_ready' => $tutorProfile->stripe_account_id && $tutorProfile->payouts_enabled ?? false,
            ];
        }

        return $payouts;
    }

    /**
     * Handle successful payment webhook.
     */
    public function handlePaymentSuccess(string $sessionId): void
    {
        if ($this->isDevelopmentMode) {
            $this->handleMockPaymentSuccess($sessionId);
            return;
        }

        $session = StripeSession::retrieve($sessionId, [
            'expand' => ['payment_intent'],
        ]);

        $bookingId = $session->metadata->booking_id ?? null;
        if (!$bookingId) {
            return;
        }

        $booking = Booking::query()->find($bookingId);
        if (!$booking) {
            return;
        }

        $paymentIntent = $session->payment_intent;
        $amount = (int) ($session->amount_total ?? 0);
        $currency = strtoupper($session->currency ?? 'usd');

        $fees = $this->calculateFees($amount, $currency);

        // Create transaction record
        Transaction::create([
            'booking_id' => $bookingId,
            'type' => Transaction::TYPE_LESSON_PAYMENT,
            'amount' => $amount,
            'currency' => $currency,
            'status' => Transaction::STATUS_SUCCESS,
            'platform_fee' => $fees['platform_fee'],
            'processing_fee' => $fees['processing_fee'],
            'net_amount' => $fees['net_amount'],
            'stripe_payment_intent_id' => $paymentIntent->id ?? null,
        ]);

        // Update booking status to confirmed (awaiting lesson)
        $booking->update([
            'status' => Booking::STATUS_CONFIRMED,
        ]);

        // Mark slot as booked
        if ($booking->slot_id) {
            AvailabilitySlot::query()
                ->where('id', $booking->slot_id)
                ->update(['is_booked' => true]);
        }

        // Notify tutor
        $studentName = $booking->student->studentProfile?->full_name ?? $booking->student->email;
        $this->notify(
            $booking->tutor_id,
            Notification::TYPE_BOOKING_CONFIRMED,
            'Lesson confirmed',
            "Your lesson with {$studentName} has been confirmed and payment received by platform.",
            ['booking_id' => $booking->id]
        );

        // Notify student
        $this->notify(
            $booking->student_id,
            Notification::TYPE_BOOKING_CONFIRMED,
            'Lesson confirmed',
            "Your trial lesson with {$booking->tutor->tutorProfile?->full_name} has been confirmed.",
            ['booking_id' => $booking->id]
        );
    }

    /**
     * Handle successful payment in development mode (mock).
     */
    private function handleMockPaymentSuccess(string $sessionId): void
    {
        // Extract booking ID from mock session ID (format: cs_test_...)
        // In mock mode, the sessionId will be the mock session ID we created
        // We need to find the booking from the notes or metadata
        
        // For mock, we'll find the booking by searching for the session ID in notes
        $booking = Booking::query()
            ->where('notes', 'LIKE', "%{$sessionId}%")
            ->where('status', Booking::STATUS_PENDING_PAYMENT)
            ->first();
        
        if (!$booking) {
            // Try to find by payment intent ID if session ID format is different
            $booking = Booking::query()
                ->where('notes', 'LIKE', "%{$sessionId}%")
                ->where('status', Booking::STATUS_PENDING_PAYMENT)
                ->first();
        }

        if (!$booking) {
            return;
        }

        $amount = (int) $booking->amount;
        $currency = strtoupper($booking->currency);
        $fees = $this->calculateFees($amount, $currency);

        // Create transaction record
        Transaction::create([
            'booking_id' => $booking->id,
            'type' => Transaction::TYPE_LESSON_PAYMENT,
            'amount' => $amount,
            'currency' => $currency,
            'status' => Transaction::STATUS_SUCCESS,
            'platform_fee' => $fees['platform_fee'],
            'processing_fee' => $fees['processing_fee'],
            'net_amount' => $fees['net_amount'],
            'stripe_payment_intent_id' => 'pi_test_mock_' . Str::random(24),
        ]);

        // Update booking status to confirmed (awaiting lesson)
        $booking->update([
            'status' => Booking::STATUS_CONFIRMED,
        ]);

        // Mark slot as booked
        if ($booking->slot_id) {
            AvailabilitySlot::query()
                ->where('id', $booking->slot_id)
                ->update(['is_booked' => true]);
        }

        // Notify tutor
        $studentName = $booking->student->studentProfile?->full_name ?? $booking->student->email;
        $this->notify(
            $booking->tutor_id,
            Notification::TYPE_BOOKING_CONFIRMED,
            'Lesson confirmed',
            "Your lesson with {$studentName} has been confirmed and payment received by platform.",
            ['booking_id' => $booking->id]
        );

        // Notify student
        $this->notify(
            $booking->student_id,
            Notification::TYPE_BOOKING_CONFIRMED,
            'Lesson confirmed',
            "Your trial lesson with {$booking->tutor->tutorProfile?->full_name} has been confirmed.",
            ['booking_id' => $booking->id]
        );
    }

    /**
     * Handle failed payment webhook.
     */
    public function handlePaymentFailed(string $sessionId): void
    {
        if ($this->isDevelopmentMode) {
            $this->handleMockPaymentFailed($sessionId);
            return;
        }

        $session = StripeSession::retrieve($sessionId);

        $amount = (int) ($session->amount_total ?? 0);
        $currency = strtoupper($session->currency ?? 'usd');

        // Create failed transaction record
        Transaction::create([
            'booking_id' => $bookingId,
            'type' => Transaction::TYPE_LESSON_PAYMENT,
            'amount' => $amount,
            'currency' => $currency,
            'status' => Transaction::STATUS_FAILED,
            'platform_fee' => 0,
            'processing_fee' => 0,
            'net_amount' => 0,
        ]);

        // Update booking status
        $booking->update([
            'status' => Booking::STATUS_CANCELLED,
        ]);

        // Notify student
        $this->notify(
            $booking->student_id,
            Notification::TYPE_PAYMENT_FAILED,
            'Payment failed',
            'Your payment for the trial lesson could not be processed. Please try again.',
            ['booking_id' => $booking->id]
        );

        // Notify tutor
        $studentName = $booking->student->studentProfile?->full_name ?? $booking->student->email;
        $this->notify(
            $booking->tutor_id,
            Notification::TYPE_BOOKING_CANCELLED,
            'Lesson cancelled',
            "The trial lesson with {$studentName} was cancelled due to payment failure.",
            ['booking_id' => $booking->id]
        );
    }

    /**
     * Handle failed payment in development mode (mock).
     */
    private function handleMockPaymentFailed(string $sessionId): void
    {
        // Find the booking by searching for the session ID in notes
        $booking = Booking::query()
            ->where('notes', 'LIKE', "%{$sessionId}%")
            ->where('status', Booking::STATUS_PENDING_PAYMENT)
            ->first();
        
        if (!$booking) {
            return;
        }

        $amount = (int) $booking->amount;
        $currency = strtoupper($booking->currency);

        // Create failed transaction record
        Transaction::create([
            'booking_id' => $booking->id,
            'type' => Transaction::TYPE_LESSON_PAYMENT,
            'amount' => $amount,
            'currency' => $currency,
            'status' => Transaction::STATUS_FAILED,
            'platform_fee' => 0,
            'processing_fee' => 0,
            'net_amount' => 0,
        ]);

        // Update booking status
        $booking->update([
            'status' => Booking::STATUS_CANCELLED,
        ]);

        // Notify student
        $this->notify(
            $booking->student_id,
            Notification::TYPE_PAYMENT_FAILED,
            'Payment failed',
            'Your payment for the trial lesson could not be processed. Please try again.',
            ['booking_id' => $booking->id]
        );

        // Notify tutor
        $studentName = $booking->student->studentProfile?->full_name ?? $booking->student->email;
        $this->notify(
            $booking->tutor_id,
            Notification::TYPE_BOOKING_CANCELLED,
            'Lesson cancelled',
            "The trial lesson with {$studentName} was cancelled due to payment failure.",
            ['booking_id' => $booking->id]
        );
    }

    /**
     * Send notification via base controller method.
     */
    private function notify(
        string $userId,
        string $type,
        string $title,
        string $message,
        ?array $data = null
    ): void {
        Notification::createForUser($userId, $type, $title, $message, $data);
    }
}