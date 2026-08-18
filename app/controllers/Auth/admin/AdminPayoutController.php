<?php

namespace App\Controllers\Auth\admin;

use App\Controllers\Auth\Controller;
use App\Models\Booking;
use App\Models\Payout;
use App\Models\User;
use App\Models\UserActivity;
use App\Services\StripeService;

class AdminPayoutController extends Controller
{
    public function index()
    {
        if (!($user = $this->requireAdmin())) return;

        $status = (string) (request()->get('status') ?? 'pending');
        $period = (string) (request()->get('period') ?? 'all');
        $tutorId = (string) (request()->get('tutor_id') ?? '');

        $stripe = new StripeService();
        $pendingPayouts = $stripe->getPendingPayouts();

        // Filter by status
        if ($status !== 'all') {
            $pendingPayouts = array_filter($pendingPayouts, function($p) use ($status) {
                if ($status === 'pending') return !$p['payout_ready'];
                if ($status === 'ready') return $p['payout_ready'];
                return true;
            });
        }

        // Filter by period
        if ($period !== 'all') {
            $cutoff = match ($period) {
                'week' => date('Y-m-d', strtotime('-7 days')),
                'month' => date('Y-m-d', strtotime('-30 days')),
                'quarter' => date('Y-m-d', strtotime('-90 days')),
                default => null,
            };
            if ($cutoff) {
                $pendingPayouts = array_filter($pendingPayouts, function($p) use ($cutoff) {
                    return strtotime($p['completed_at'] ?? $p['scheduled_at']) >= strtotime($cutoff);
                });
            }
        }

        // Filter by tutor
        if ($tutorId) {
            $pendingPayouts = array_filter($pendingPayouts, fn($p) => $p['tutor_email'] === $tutorId);
        }

        // Get all tutors for filter dropdown
        $tutors = User::query()
            ->where('role', User::ROLE_TUTOR)
            ->with('tutorProfile')
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'email' => $t->email,
                'name' => $t->tutorProfile->full_name ?? $t->email,
            ])
            ->values()
            ->all();

        // Calculate summary
        $totalGross = array_sum(array_column($pendingPayouts, 'gross_amount'));
        $totalPlatformFees = array_sum(array_column($pendingPayouts, 'platform_fee'));
        $totalProcessingFees = array_sum(array_column($pendingPayouts, 'processing_fee'));
        $totalNet = array_sum(array_column($pendingPayouts, 'net_amount'));

        response()->inertia('admin/payouts', [
            'payouts' => array_values($pendingPayouts),
            'status' => $status,
            'period' => $period,
            'tutor_id' => $tutorId,
            'tutors' => $tutors,
            'summary' => [
                'total_gross' => $totalGross,
                'total_platform_fees' => $totalPlatformFees,
                'total_processing_fees' => $totalProcessingFees,
                'total_net' => $totalNet,
                'count' => count($pendingPayouts),
            ],
        ]);
    }

    public function release()
    {
        if (!($user = $this->requireAdmin())) return;

        $bookingIds = request()->get('booking_ids');
        $bookingIds = is_array($bookingIds) ? $bookingIds : [];

        if (empty($bookingIds)) {
            return response()
                ->withFlash('error', 'No bookings selected for payout.')
                ->redirect('/admin/payouts', 303);
        }

        $stripe = new StripeService();
        $result = $stripe->releaseBulkPayouts($bookingIds);

        $successCount = count($result['success']);
        $errorCount = count($result['errors']);

        if ($successCount > 0) {
            UserActivity::log($user->id, UserActivity::TYPE_ACCOUNT_UPDATED, "Released {$successCount} tutor payouts totaling " . \App\Models\Currency::format($result['total_released']));

            return response()
                ->withFlash('success', "Successfully released {$successCount} payouts." . ($errorCount > 0 ? " {$errorCount} failed." : ''))
                ->redirect('/admin/payouts', 303);
        }

        return response()
            ->withFlash('error', 'Failed to release payouts: ' . implode(', ', $result['errors']))
            ->redirect('/admin/payouts', 303);
    }

    public function schedule()
    {
        if (!($user = $this->requireAdmin())) return;

        $data = request()->validate([
            'booking_ids' => 'required|array',
            'booking_ids.*' => 'string',
            'scheduled_at' => 'required|string',
        ]);

        if (!$data) {
            return response()
                ->withFlash('errors', request()->errors())
                ->redirect('/admin/payouts', 303);
        }

        $bookingIds = $data['booking_ids'];
        $scheduledAt = $data['scheduled_at'];

        foreach ($bookingIds as $bookingId) {
            $payout = Payout::query()
                ->where('booking_id', $bookingId)
                ->first();

            if ($payout && in_array($payout->status, [Payout::STATUS_PENDING, Payout::STATUS_SCHEDULED])) {
                $payout->markAsScheduled($scheduledAt);
            }
        }

        UserActivity::log($user->id, UserActivity::TYPE_ACCOUNT_UPDATED, "Scheduled " . count($bookingIds) . " payouts for {$scheduledAt}");

        return response()
            ->withFlash('success', "Scheduled " . count($bookingIds) . " payouts for {$scheduledAt}.")
            ->redirect('/admin/payouts', 303);
    }

    public function payoutHistory()
    {
        if (!($user = $this->requireAdmin())) return;

        $status = (string) (request()->get('status') ?? 'all');
        $period = (string) (request()->get('period') ?? 'month');
        $page = (int) (request()->get('page') ?? 1);
        $perPage = (int) (request()->get('per_page') ?? 20);

        $query = Payout::query()
            ->with(['booking.student.studentProfile', 'booking.tutor.tutorProfile', 'booking.subject'])
            ->orderByDesc('created_at');

        if ($status !== 'all' && in_array($status, [Payout::STATUS_PAID, Payout::STATUS_FAILED, Payout::STATUS_CANCELLED])) {
            $query->where('status', $status);
        }

        // Period filter
        if ($period !== 'all') {
            $cutoff = match ($period) {
                'week' => date('Y-m-d', strtotime('-7 days')),
                'month' => date('Y-m-d', strtotime('-30 days')),
                'quarter' => date('Y-m-d', strtotime('-90 days')),
                'year' => date('Y-m-d', strtotime('-365 days')),
                default => null,
            };
            if ($cutoff) {
                $query->where('created_at', '>=', $cutoff);
            }
        }

        $result = $this->paginate($query, $perPage, $page);

        $payouts = collect($result['items'])
            ->map(fn($p) => [
                'id' => $p->id,
                'booking_id' => $p->booking_id,
                'student' => $p->booking?->student?->studentProfile?->full_name ?? $p->booking?->student?->email ?? '—',
                'tutor' => $p->booking?->tutor?->tutorProfile?->full_name ?? '—',
                'subject' => $p->booking?->subject?->name,
                'gross_amount' => (int) $p->gross_amount,
                'platform_fee' => (int) $p->platform_fee,
                'processing_fee' => (int) $p->processing_fee,
                'net_amount' => (int) $p->net_amount,
                'currency' => $p->currency,
                'status' => $p->status,
                'scheduled_at' => $p->scheduled_at,
                'paid_at' => $p->paid_at,
                'created_at' => $p->created_at,
            ])
            ->values()
            ->all();

        response()->inertia('admin/payout-history', [
            'payouts' => $payouts,
            'status' => $status,
            'period' => $period,
            'pagination' => $result['pagination'],
        ]);
    }
}