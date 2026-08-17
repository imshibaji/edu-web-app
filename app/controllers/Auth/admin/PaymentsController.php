<?php

namespace App\Controllers\Auth\admin;

use App\Controllers\Auth\Controller;
use App\Models\Currency;
use App\Models\Transaction;

class PaymentsController extends Controller
{
    public function index()
    {
        if (!($user = $this->requireAdmin())) return;

        $status = (string) (request()->get('status') ?? 'all');
        $type = (string) (request()->get('type') ?? 'all');

        $query = Transaction::query()
            ->with(['booking.student.studentProfile', 'booking.tutor.tutorProfile', 'booking.subject'])
            ->orderByDesc('created_at');

        if (in_array($status, [Transaction::STATUS_PENDING, Transaction::STATUS_SUCCESS, Transaction::STATUS_FAILED], true)) {
            $query->where('status', $status);
        }

        if (in_array($type, [
            Transaction::TYPE_LESSON_PAYMENT,
            Transaction::TYPE_ESCROW_RELEASE,
            Transaction::TYPE_REFUND,
            Transaction::TYPE_PLATFORM_FEE,
        ], true)) {
            $query->where('type', $type);
        }

        $result = $this->paginate($query, 5);

        $transactions = collect($result['items'])
            ->map(fn ($t) => [
                'id' => $t->id,
                'type' => $t->type,
                'status' => $t->status,
                'amount' => (int) $t->amount,
                'currency' => $t->currency,
                'platform_fee' => (int) ($t->platform_fee ?? 0),
                'student' => $t->booking?->student?->studentProfile?->full_name ?? $t->booking?->student?->email ?? '—',
                'tutor' => $t->booking?->tutor?->tutorProfile?->full_name ?? '—',
                'subject' => $t->booking?->subject?->name,
                'created_at' => $t->created_at,
            ])
            ->values()
            ->all();

        $successBase = Transaction::query()->where('status', Transaction::STATUS_SUCCESS);
        $baseCurrency = strtoupper((string) ($user->base_currency ?? Currency::DEFAULT));

        $totalAmount = 0;
        $platformFees = 0;

        foreach ($successBase->get() as $tx) {
            $totalAmount += Currency::convert((int) $tx->amount, $tx->currency, $baseCurrency);
            $platformFees += Currency::convert((int) ($tx->platform_fee ?? 0), $tx->currency, $baseCurrency);
        }

        response()->inertia('admin/payments', [
            'transactions' => $transactions,
            'status' => $status,
            'type' => $type,
            'pagination' => $result['pagination'],
            'summary' => [
                'total_amount' => $totalAmount,
                'platform_fees' => $platformFees,
                'base_currency' => $baseCurrency,
                'success_count' => (int) Transaction::query()->where('status', Transaction::STATUS_SUCCESS)->count(),
                'pending_count' => (int) Transaction::query()->where('status', Transaction::STATUS_PENDING)->count(),
            ],
        ]);
    }
}
