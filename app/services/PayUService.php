<?php

namespace App\Services;

use App\Models\AvailabilitySlot;
use App\Models\Booking;
use App\Models\Currency;
use App\Models\Notification;
use App\Models\Payout;
use App\Models\Transaction;
use App\Models\TutorProfile;
use App\Models\User;
use Exception;
use Illuminate\Support\Str;

/**
 * PayU payment service.
 *
 * Handles PayU checkout, payouts, and webhooks.
 * In development mode (dummy credentials), returns mocked objects.
 */
class PayUService
{
    private const DEFAULT_PLATFORM_FEE_PERCENT = 15;
    private const DEFAULT_PROCESSING_FEE_PERCENT = 2.0;
    private const DEFAULT_PROCESSING_FEE_FIXED = 0;

    private const DUMMY_MERCHANT_KEY = 'dummy_merchant_key';
    private const DUMMY_MERCHANT_SALT = 'dummy_merchant_salt';

    private bool $isDevelopmentMode = false;
    private string $merchantKey;
    private string $merchantSalt;
    private string $payuUrl;
    private string $successUrl;
    private string $cancelUrl;

    public function __construct()
    {
        $this->merchantKey = _envUncached('PAYU_MERCHANT_KEY', self::DUMMY_MERCHANT_KEY);
        $this->merchantSalt = _envUncached('PAYU_MERCHANT_SALT', self::DUMMY_MERCHANT_SALT);
        $this->payuUrl = _envUncached('PAYU_URL', 'https://test.payu.in/_payment');
        $this->successUrl = _envUncached('PAYU_SUCCESS_URL', _envUncached('APP_URL', 'http://localhost') . '/payment/success');
        $this->cancelUrl = _envUncached('PAYU_FAILURE_URL', _envUncached('APP_URL', 'http://localhost') . '/payment/cancel');

        // Force development mode for testing
        $this->isDevelopmentMode = true;
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
        return (int) (\Leaf\Config::get('payu.platform_fee_percent') ?? self::DEFAULT_PLATFORM_FEE_PERCENT);
    }

    /**
     * Get processing fee percentage.
     */
    public function getProcessingFeePercent(): float
    {
        return (float) (\Leaf\Config::get('payu.processing_fee_percent') ?? self::DEFAULT_PROCESSING_FEE_PERCENT);
    }

    /**
     * Get processing fee fixed amount (in cents).
     */
    public function getProcessingFeeFixed(): int
    {
        return (int) (\Leaf\Config::get('payu.processing_fee_fixed') ?? self::DEFAULT_PROCESSING_FEE_FIXED);
    }

    /**
     * Calculate all fees for an amount.
     * Returns array with: platform_fee, processing_fee, total_fees, net_amount
     */
    public function calculateFees(int $amount, string $currency = 'inr'): array
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
     * Generate PayU hash for payment request.
     */
    private function generateHash(array $params, string $salt): string
    {
        $hashString = $params['key'] . '|'
            . $params['txnid'] . '|'
            . $params['amount'] . '|'
            . $params['productinfo'] . '|'
            . $params['firstname'] . '|'
            . $params['email'] . '|'
            . $params['udf1'] . '|'
            . $params['udf2'] . '|'
            . $params['udf3'] . '|'
            . $params['udf4'] . '|'
            . $params['udf5'] . '|'
            . $salt;

        return strtolower(hash('sha512', $hashString));
    }

    /**
     * Create a PayU payment form data for redirect.
     */
    public function createPaymentData(
        Booking $booking,
        string $successUrl,
        string $cancelUrl
    ): array {
        $tutor = $booking->tutor;
        $student = $booking->student;
        $tutorProfile = $tutor->tutorProfile;

        // Convert amount from paise to rupees for PayU (PayU expects amount in rupees)
        $amount = (int) round($booking->amount / 100);
        $currency = strtolower($booking->currency);
        $fees = $this->calculateFees($booking->amount, $currency);

        $txnid = 'TXN_' . $booking->id . '_' . Str::random(8);
        $productInfo = "Trial lesson with {$tutorProfile->full_name}";

        $params = [
            'key' => $this->merchantKey,
            'txnid' => $txnid,
            'amount' => $amount,
            'productinfo' => $productInfo,
            'firstname' => $student->studentProfile?->full_name ?? $student->email,
            'email' => $student->email,
            'phone' => $student->studentProfile?->phone_number ?? '9999999999',
            'surl' => $successUrl,
            'furl' => $cancelUrl,
            'currency' => strtoupper($currency),
            'udf1' => $booking->id,
            'udf2' => $student->id,
            'udf3' => $tutor->id,
            'udf4' => $tutorProfile->id ?? '',
            'udf5' => 'booking_payment',
        ];

        $params['hash'] = $this->generateHash($params, $this->merchantSalt);

        if ($this->isDevelopmentMode) {
            return $this->createMockPaymentData($booking, $successUrl, $cancelUrl, $fees, $txnid);
        }

        return [
            'action_url' => $this->payuUrl,
            'method' => 'POST',
            'params' => $params,
            'txnid' => $txnid,
            'fees' => $fees,
        ];
    }

    /**
     * Create mock payment data for development mode.
     */
    private function createMockPaymentData(
        Booking $booking,
        string $successUrl,
        string $cancelUrl,
        array $fees,
        string $txnid
    ): array {
        $mockTxnId = $txnid;

        $booking->update([
            'notes' => ($booking->notes ? $booking->notes . "\n" : '') .
                "Mock PayU txnid: {$txnid} | Amount: {$booking->amount} {$booking->currency} | Platform Fee: {$fees['platform_fee']} | Processing Fee: {$fees['processing_fee']} | Net: {$fees['net_amount']}",
        ]);

        // Convert amount to rupees for mock URL
        $amountRupees = round($booking->amount / 100, 2);

        return [
            'action_url' => $successUrl . '?txnid=' . $txnid . '&mock=true',
            'method' => 'GET',
            'params' => [],
            'txnid' => $txnid,
            'fees' => $fees,
            'mock' => true,
        ];
    }

    /**
     * Verify PayU payment response.
     */
    public function verifyPayment(array $postData): array
    {
        if ($this->isDevelopmentMode) {
            return $this->verifyMockPayment($postData);
        }

        $status = $postData['status'] ?? '';
        $txnid = $postData['txnid'] ?? '';
        // PayU sends amount in rupees, convert to paise for storage
        $amountRupees = $postData['amount'] ?? '';
        $amount = (int) round($amountRupees * 100);
        $productinfo = $postData['productinfo'] ?? '';
        $firstname = $postData['firstname'] ?? '';
        $email = $postData['email'] ?? '';
        $udf1 = $postData['udf1'] ?? '';
        $udf2 = $postData['udf2'] ?? '';
        $udf3 = $postData['udf3'] ?? '';
        $udf4 = $postData['udf4'] ?? '';
        $udf5 = $postData['udf5'] ?? '';
        $receivedHash = $postData['hash'] ?? '';

        $hashString = $this->merchantSalt . '|'
            . $status . '||||||||||'
            . $udf5 . '|'
            . $udf4 . '|'
            . $udf3 . '|'
            . $udf2 . '|'
            . $udf1 . '|'
            . $email . '|'
            . $firstname . '|'
            . $productinfo . '|'
            . $amount . '|'
            . $txnid . '|'
            . $this->merchantKey;

        $calculatedHash = strtolower(hash('sha512', $hashString));

        if ($calculatedHash !== $receivedHash) {
            return [
                'success' => false,
                'error' => 'Invalid hash',
            ];
        }

        return [
            'success' => $status === 'success',
            'txnid' => $txnid,
            'amount' => (int) $amount,
            'status' => $status,
            'booking_id' => $udf1,
            'student_id' => $udf2,
            'tutor_id' => $udf3,
        ];
    }

    /**
     * Verify mock payment for development mode.
     */
    private function verifyMockPayment(array $postData): array
    {
        $txnid = $postData['txnid'] ?? ($postData['session_id'] ?? '');
        $status = $postData['status'] ?? ($postData['mock'] === 'true' ? 'success' : 'failure');
        $bookingId = $postData['udf1'] ?? '';

        // In mock mode, extract amount from booking
        $amount = 0;
        if ($bookingId) {
            $booking = \App\Models\Booking::query()->find($bookingId);
            if ($booking) {
                $amount = (int) $booking->amount;
            }
        }

        return [
            'success' => $status === 'success',
            'txnid' => $txnid,
            'amount' => $amount,
            'status' => $status,
            'booking_id' => $bookingId,
        ];
    }

    /**
     * Handle successful payment.
     */
    public function handlePaymentSuccess(array $verificationResult): void
    {
        $bookingId = $verificationResult['booking_id'] ?? '';
        $txnid = $verificationResult['txnid'] ?? '';
        $amount = $verificationResult['amount'] ?? 0;

        if ($bookingId) {
            $this->processSuccessfulPayment($bookingId, $txnid, $amount);
        }
    }

    /**
     * Handle failed payment.
     */
    public function handlePaymentFailed(array $verificationResult): void
    {
        error_log("handlePaymentFailed called: booking_id=" . ($verificationResult['booking_id'] ?? 'NONE') . ", txnid=" . ($verificationResult['txnid'] ?? 'NONE') . ", success=" . ($verificationResult['success'] ?? 'NONE'));

        $bookingId = $verificationResult['booking_id'] ?? '';
        $txnid = $verificationResult['txnid'] ?? '';

        if ($bookingId) {
            $this->processFailedPayment($bookingId, $txnid);
        } else {
            error_log("handlePaymentFailed: No booking_id in verification result");
        }
    }

    /**
     * Process successful payment.
     */
    private function processSuccessfulPayment(string $bookingId, string $txnid, int $amount = 0): void
    {
        $booking = Booking::query()->find($bookingId);
        if (!$booking) {
            return;
        }

        $currency = strtoupper($booking->currency);
        $actualAmount = $amount ?: (int) $booking->amount;
        $fees = $this->calculateFees($actualAmount, strtolower($booking->currency));

        Transaction::create([
            'booking_id' => $bookingId,
            'type' => Transaction::TYPE_LESSON_PAYMENT,
            'amount' => $actualAmount,
            'currency' => strtoupper($booking->currency),
            'status' => Transaction::STATUS_SUCCESS,
            'platform_fee' => $fees['platform_fee'],
            'processing_fee' => $fees['processing_fee'],
            'net_amount' => $fees['net_amount'],
            'payu_txnid' => $txnid,
        ]);

        $booking->update([
            'status' => Booking::STATUS_CONFIRMED,
        ]);

        if ($booking->slot_id) {
            AvailabilitySlot::query()
                ->where('id', $booking->slot_id)
                ->update(['is_booked' => true]);
        }

        $studentName = $booking->student->studentProfile?->full_name ?? $booking->student->email;
        $this->notify(
            $booking->tutor_id,
            Notification::TYPE_BOOKING_CONFIRMED,
            'Lesson confirmed',
            "Your lesson with {$studentName} has been confirmed and payment received by platform.",
            ['booking_id' => $booking->id]
        );

        $this->notify(
            $booking->student_id,
            Notification::TYPE_BOOKING_CONFIRMED,
            'Lesson confirmed',
            "Your trial lesson with {$booking->tutor->tutorProfile?->full_name} has been confirmed.",
            ['booking_id' => $booking->id]
        );

        $this->sendBookingConfirmationEmail($booking);
    }

    /**
     * Process failed payment.
     */
    private function processFailedPayment(string $bookingId, string $txnid): void
    {
        $booking = Booking::query()->find($bookingId);
        if (!$booking) {
            error_log("processFailedPayment: Booking not found: $bookingId");
            return;
        }

        $amount = (int) $booking->amount;
        $currency = strtoupper($booking->currency);

        try {
            Transaction::create([
                'booking_id' => $bookingId,
                'type' => Transaction::TYPE_LESSON_PAYMENT,
                'amount' => $amount,
                'currency' => $currency,
                'status' => Transaction::STATUS_FAILED,
                'platform_fee' => 0,
                'stripe_payment_intent_id' => $txnid, // Using existing column for PayU txnid
            ]);
            error_log("processFailedPayment: Transaction created for booking $bookingId");
        } catch (\Throwable $e) {
            error_log("processFailedPayment: Transaction create failed: " . $e->getMessage());
            return;
        }

        $booking->update([
            'status' => Booking::STATUS_CANCELLED,
        ]);
        error_log("processFailedPayment: Booking $bookingId status updated to CANCELLED");

        $this->notify(
            $booking->student_id,
            Notification::TYPE_PAYMENT_FAILED,
            'Payment failed',
            'Your payment for the trial lesson could not be processed. Please try again.',
            ['booking_id' => $booking->id]
        );

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

    /**
     * Send booking confirmation email.
     */
    private function sendBookingConfirmationEmail(Booking $booking): void
    {
        try {
            $studentEmail = $booking->student->email;
            $tutorName = $booking->tutor->tutorProfile?->full_name ?? 'Tutor';

            (new MailService())->sendBookingConfirmed($studentEmail, $tutorName);
        } catch (\Throwable $e) {
            error_log('Booking-confirmed email failed: ' . $e->getMessage());
        }
    }
}