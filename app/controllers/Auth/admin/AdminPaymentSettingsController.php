<?php

namespace App\Controllers\Auth\admin;

use App\Controllers\Auth\Controller;
use App\Models\UserActivity;

class AdminPaymentSettingsController extends Controller
{
    public function index()
    {
        if (!($user = $this->requireAdmin())) return;

        $platformFeePercent = (int) (\Leaf\Config::get('stripe.platform_fee_percent') ?? 15);
        $processingFeePercent = (float) (\Leaf\Config::get('stripe.processing_fee_percent') ?? 2.9);
        $processingFeeFixed = (int) (\Leaf\Config::get('stripe.processing_fee_fixed') ?? 30);

        response()->inertia('admin/payment-settings', [
            'platformFeePercent' => $platformFeePercent,
            'processingFeePercent' => $processingFeePercent,
            'processingFeeFixed' => $processingFeeFixed,
            'errors' => flash()->display('errors') ?? [],
        ]);
    }

    public function update()
    {
        if (!($user = $this->requireAdmin())) return;

        $data = request()->validate([
            'platform_fee_percent' => 'numeric',
            'processing_fee_percent' => 'numeric',
            'processing_fee_fixed' => 'numeric',
        ]);

        if (!$data) {
            return response()
                ->withFlash('errors', request()->errors())
                ->redirect('/admin/payment-settings', 303);
        }

        $platformFeePercent = (int) ($data['platform_fee_percent'] ?? 15);
        $processingFeePercent = (float) ($data['processing_fee_percent'] ?? 2.9);
        $processingFeeFixed = (int) ($data['processing_fee_fixed'] ?? 30);

        if ($platformFeePercent < 0 || $platformFeePercent > 50) {
            return response()
                ->withFlash('errors', ['platform_fee_percent' => 'Platform fee must be between 0 and 50%.'])
                ->redirect('/admin/payment-settings', 303);
        }

        if ($processingFeePercent < 0 || $processingFeePercent > 10) {
            return response()
                ->withFlash('errors', ['processing_fee_percent' => 'Processing fee percent must be between 0 and 10%.'])
                ->redirect('/admin/payment-settings', 303);
        }

        if ($processingFeeFixed < 0 || $processingFeeFixed > 500) {
            return response()
                ->withFlash('errors', ['processing_fee_fixed' => 'Processing fee fixed must be between 0 and 500 cents.'])
                ->redirect('/admin/payment-settings', 303);
        }

        \Leaf\Config::set([
            'stripe.platform_fee_percent' => $platformFeePercent,
            'stripe.processing_fee_percent' => $processingFeePercent,
            'stripe.processing_fee_fixed' => $processingFeeFixed,
        ]);

        UserActivity::log($user->id, UserActivity::TYPE_ACCOUNT_UPDATED, "Updated payment settings: platform fee {$platformFeePercent}%, processing {$processingFeePercent}% + {$processingFeeFixed}¢");

        return response()
            ->withFlash('success', "Payment settings updated.")
            ->redirect('/admin/payment-settings', 303);
    }
}