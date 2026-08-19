<?php

namespace App\Controllers;

use App\Models\Booking;
use App\Models\Notification;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Payout;
use App\Services\StripeService;
use App\Services\PayUService;

class PaymentController extends Controller
{
    /**
     * Get the appropriate payment service based on billing provider.
     */
    private function getPaymentService()
    {
        // Force PayU for testing since .env has BILLING_PROVIDER=payu
        return new PayUService();
    }

    public function createCheckout(?string $id = null)
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Get booking ID from route parameter or request data
        $bookingId = $id ?? request()->param('id') ?? (request()->params['id'] ?? null);

        if (!$bookingId) {
            return response()->json(['error' => 'Booking ID required'], 400);
        }

        $booking = Booking::query()
            ->with(['student', 'tutor.tutorProfile', 'subject'])
            ->find($bookingId);

        if (!$booking) {
            return response()->json(['error' => 'Booking not found'], 404);
        }

        if ($booking->student_id !== $user->id) {
            return response()->json(['error' => 'Not authorized'], 403);
        }

        if ($booking->status !== Booking::STATUS_PENDING_PAYMENT) {
            return response()->json(['error' => 'Booking is not pending payment'], 400);
        }

        $paymentService = $this->getPaymentService();

        $baseUrl = rtrim(env('APP_URL') ?? 'http://localhost', '/');
        $successUrl = "{$baseUrl}/payment/success";
        $cancelUrl = "{$baseUrl}/payment/cancel";

        try {
            $paymentData = $paymentService->createPaymentData($booking, $successUrl, $cancelUrl);

            // Update booking with session/txn ID
            $sessionId = $paymentData['txnid'] ?? $paymentData['sessionId'] ?? $paymentData['session_id'] ?? null;
            if ($sessionId) {
                $booking->update([
                    'notes' => ($booking->notes ? $booking->notes . "\n" : '') . "Payment session: {$sessionId}",
                ]);
            }

            // Show fee breakdown to student
            $fees = $paymentData['fees'] ?? $paymentService->calculateFees((int) $booking->amount, strtolower($booking->currency));

            return response()->json([
                'sessionId' => $sessionId,
                'url' => $paymentData['url'] ?? ($paymentData['action_url'] ?? ''),
                'method' => $paymentData['method'] ?? 'POST',
                'params' => $paymentData['params'] ?? [],
                'fee_breakdown' => [
                    'gross_amount' => (int) $booking->amount,
                    'currency' => strtoupper($booking->currency),
                    'platform_fee' => $fees['platform_fee'],
                    'processing_fee' => $fees['processing_fee'],
                    'tutor_receives' => $fees['net_amount'],
                    'platform_fee_percent' => $fees['platform_fee_percent'],
                    'processing_fee_percent' => $fees['processing_fee_percent'],
                    'processing_fee_fixed' => $fees['processing_fee_fixed'],
                ],
            ]);
        } catch (\Exception $e) {
            error_log('PaymentService error: ' . $e->getMessage());
            error_log('Trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'Payment service error: ' . $e->getMessage()], 500);
        }
    }

    public function showCheckout(string $id)
    {
        $user = $this->authUser();

        if (!$user) {
            return response()->redirect('/auth/login', 303);
        }

        $booking = Booking::query()
            ->with(['student', 'tutor.tutorProfile', 'subject'])
            ->find($id);

        if (!$booking) {
            return response()->redirect('/', 303);
        }

        if ($booking->student_id !== $user->id) {
            return response()->redirect('/dashboard', 303);
        }

        if ($booking->status !== Booking::STATUS_PENDING_PAYMENT) {
            return response()->redirect('/dashboard', 303);
        }

        $paymentService = $this->getPaymentService();
        $fees = $paymentService->calculateFees((int) $booking->amount, strtolower($booking->currency));

        $provider = 'payu';

        return response()->inertia('payment/checkout', [
            'auth' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'booking' => [
                'id' => $booking->id,
                'tutor' => $booking->tutor->tutorProfile?->full_name,
                'subject' => $booking->subject?->name,
                'scheduled_at' => $booking->scheduled_at,
                'amount' => $booking->amount,
                'currency' => $booking->currency,
                'status' => $booking->status,
            ],
            'provider' => $provider,
            'fees' => [
                'gross_amount' => (int) $booking->amount,
                'currency' => strtoupper($booking->currency),
                'platform_fee' => $fees['platform_fee'],
                'processing_fee' => $fees['processing_fee'],
                'tutor_receives' => $fees['net_amount'],
                'platform_fee_percent' => $fees['platform_fee_percent'],
                'processing_fee_percent' => $fees['processing_fee_percent'],
                'processing_fee_fixed' => $fees['processing_fee_fixed'],
            ],
        ]);
    }

    public function success()
    {
        $sessionId = request()->get('session_id') ?? request()->get('txnid') ?? request()->get('txnid');

        if (!$sessionId) {
            return response()->redirect('/', 303);
        }

        $paymentService = $this->getPaymentService();
        $provider = 'payu';

        try {
            if ($provider === 'payu') {
                // For PayU, the success callback comes with POST data
                $verification = (new PayUService())->verifyPayment(request()->params());
                $paymentService->handlePaymentSuccess($verification);
            } else {
                $stripe = new StripeService();
                $stripe->handlePaymentSuccess($sessionId);
            }

            return response()->inertia('payment/success', [
                'auth' => $this->authUser() ? [
                    'id' => $this->authUser()->id,
                    'email' => $this->authUser()->email,
                    'role' => $this->authUser()->role,
                ] : null,
                'provider' => $provider,
            ]);
        } catch (\Exception $e) {
            return response()
                ->withFlash('error', 'Payment verification failed: ' . $e->getMessage())
                ->redirect('/dashboard', 303);
        }
    }

    public function cancel()
    {
        $provider = 'payu'; // Force PayU since .env has BILLING_PROVIDER=payu
        error_log("Cancel method called, provider: $provider, method: " . $_SERVER['REQUEST_METHOD'] . ", params: " . json_encode(request()->params()));

        if ($provider === 'payu') {
            $payuService = new PayUService();
            $params = request()->params();
            error_log("Cancel callback params: " . json_encode($params));
            $verification = $payuService->verifyPayment($params);
            error_log("Verification result: " . json_encode($verification));
            $payuService->handlePaymentFailed($verification);
        }

        return response()->inertia('payment/cancel', [
            'auth' => $this->authUser() ? [
                'id' => $this->authUser()->id,
                'email' => $this->authUser()->email,
                'role' => $this->authUser()->role,
            ] : null,
            'provider' => $provider,
        ]);
    }

    public function connect()
    {
        $user = $this->authUser();

        if (!$user || !$user->isTutor()) {
            return response()->redirect('/auth/login', 303);
        }

        $stripe = new StripeService();

        $baseUrl = rtrim(\Leaf\Config::get('app.url') ?? 'http://localhost', '/');
        $refreshUrl = "{$baseUrl}/tutor/profile?connect=refresh";
        $returnUrl = "{$baseUrl}/tutor/profile?connect=success";

        try {
            $link = $stripe->createAccountLink($user->id, $refreshUrl, $returnUrl);

            return response()->inertia('payment/connect', [
                'auth' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'redirectUrl' => $link->url,
            ]);
        } catch (\Exception $e) {
            return response()
                ->withFlash('error', 'Failed to connect Stripe: ' . $e->getMessage())
                ->redirect('/tutor/profile', 303);
        }
    }

    public function webhook()
    {
        $provider = 'payu';

        if ($provider === 'payu') {
            return $this->handlePayUWebhook();
        }

        $payload = file_get_contents('php://input');
        $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        $secret = _env('STRIPE_WEBHOOK_SECRET') ?? _env('STRIPE_WEBHOOK_SECRET');

        if (!$secret) {
            return response()->markup('Webhook secret not configured', 500);
        }

        try {
            // Leaf Billing verifies the signature and returns a BillingEvent
            $event = billing()->webhook();
        } catch (\Exception $e) {
            return response()->markup('Webhook error: ' . $e->getMessage(), 400);
        }

        $stripe = new StripeService();

        switch ($event->type()) {
            case 'checkout.session.completed':
                $stripe->handlePaymentSuccess($event->data()['object']['id'] ?? '');
                break;

            case 'checkout.session.expired':
                $stripe->handlePaymentFailed($event->data()['object']['id'] ?? '');
                break;

            case 'transfer.created':
            case 'transfer.paid':
            case 'transfer.failed':
                // Handle transfer status updates for payouts
                $this->handleTransferEvent($event);
                break;

            case 'payout.paid':
            case 'payout.failed':
                // Handle Stripe payout events
                break;

            default:
                break;
        }

        return response()->markup('OK', 200);
    }

    /**
     * Handle PayU webhook (success/failure callbacks).
     */
    private function handlePayUWebhook()
    {
        $postData = request()->params();

        if (empty($postData)) {
            $postData = $_POST;
        }

        $payuService = new PayUService();
        $verification = $payuService->verifyPayment($postData);

        if ($verification['success']) {
            $payuService->handlePaymentSuccess($verification);
        } else {
            $payuService->handlePaymentFailed($verification);
        }

        return response()->markup('OK', 200);
    }

    private function handleTransferEvent(\Leaf\Billing\Event $event): void
    {
        $object = $event->data()['object'] ?? [];
        $transfer = (object) $object;
        $bookingId = $transfer->metadata->booking_id ?? null;

        if (!$bookingId) {
            return;
        }

        $payout = Payout::query()
            ->where('booking_id', $bookingId)
            ->first();

        if (!$payout) {
            return;
        }

        switch ($event->type()) {
            case 'transfer.paid':
                $payout->markAsPaid($transfer->id ?? null);
                // Notify tutor
                Notification::createForUser(
                    $payout->tutor_id,
                    Notification::TYPE_PAYOUT_COMPLETED,
                    'Payout received',
                    "Payout of " . \App\Models\Currency::format($payout->net_amount, $payout->currency) . " has been deposited to your account.",
                    ['payout_id' => $payout->id, 'booking_id' => $bookingId]
                );
                break;

            case 'transfer.failed':
                $payout->markAsFailed($transfer->failure_message ?? 'Transfer failed');
                // Notify tutor
                Notification::createForUser(
                    $payout->tutor_id,
                    Notification::TYPE_PAYOUT_FAILED,
                    'Payout failed',
                    "Your payout could not be processed: " . ($transfer->failure_message ?? 'Unknown error'),
                    ['payout_id' => $payout->id, 'booking_id' => $bookingId]
                );
                break;
        }
    }
}