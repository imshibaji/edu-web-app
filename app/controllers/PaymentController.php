<?php

namespace App\Controllers;

use App\Models\Booking;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Payout;
use App\Services\StripeService;

class PaymentController extends Controller
{
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

        $stripe = new StripeService();

        $baseUrl = rtrim(config('app.url') ?? 'http://localhost', '/');
        $successUrl = "{$baseUrl}/payment/success";
        $cancelUrl = "{$baseUrl}/payment/cancel";

        try {
            $session = $stripe->createCheckoutSession($booking, $successUrl, $cancelUrl);

            // Update booking with session ID
            $booking->update([
                'notes' => ($booking->notes ? $booking->notes . "\n" : '') . "Stripe session: {$session->id}",
            ]);

            // Show fee breakdown to student
            $fees = $stripe->calculateFees((int) $booking->amount, strtolower($booking->currency));

            return response()->json([
                'sessionId' => $session->id,
                'url' => $session->url,
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
            error_log('StripeService error: ' . $e->getMessage());
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

        $stripe = new StripeService();
        $fees = $stripe->calculateFees((int) $booking->amount, strtolower($booking->currency));

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
        $sessionId = request()->get('session_id');

        if (!$sessionId) {
            return response()->redirect('/', 303);
        }

        $stripe = new StripeService();

        try {
            $stripe->handlePaymentSuccess($sessionId);

            return response()->inertia('payment/success', [
                'auth' => $this->authUser() ? [
                    'id' => $this->authUser()->id,
                    'email' => $this->authUser()->email,
                    'role' => $this->authUser()->role,
                ] : null,
            ]);
        } catch (\Exception $e) {
            return response()
                ->withFlash('error', 'Payment verification failed: ' . $e->getMessage())
                ->redirect('/dashboard', 303);
        }
    }

    public function cancel()
    {
        return response()->inertia('payment/cancel', [
            'auth' => $this->authUser() ? [
                'id' => $this->authUser()->id,
                'email' => $this->authUser()->email,
                'role' => $this->authUser()->role,
            ] : null,
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
        $payload = file_get_contents('php://input');
        $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        $secret = config('stripe.webhook_secret') ?? env('STRIPE_WEBHOOK_SECRET');

        if (!$secret) {
            return response()->markup('Webhook secret not configured', 500);
        }

        try {
            $event = \Stripe\Webhook::constructEvent($payload, $sigHeader, $secret);
        } catch (\Exception $e) {
            return response()->markup('Webhook error: ' . $e->getMessage(), 400);
        }

        $stripe = new StripeService();

        switch ($event->type) {
            case 'checkout.session.completed':
                $stripe->handlePaymentSuccess($event->data->object->id);
                break;

            case 'checkout.session.expired':
                $stripe->handlePaymentFailed($event->data->object->id);
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

    private function handleTransferEvent(\Stripe\Event $event): void
    {
        $transfer = $event->data->object;
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

        switch ($event->type) {
            case 'transfer.paid':
                $payout->markAsPaid($transfer->id);
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