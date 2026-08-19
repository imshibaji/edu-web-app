        if (!($user = $this->requireAdmin())) return;

        $data = request()->validate([
            'platform_fee_percent' => 'numeric',
            'processing_fee_percent' => 'numeric',
            'processing_fee_fixed' => 'numeric',
            'billing_provider' => 'sometimes|string',
        ]);

        if (!$data) {
            return response()
                ->withFlash('errors', request()->errors())
                ->redirect('/admin/payment-settings', 303);
        }

        $platformFeePercent = (int) ($data['platform_fee_percent'] ?? 15);
        $processingFeePercent = (float) ($data['processing_fee_percent'] ?? 2.9);
        $processingFeeFixed = (int) ($data['processing_fee_fixed'] ?? 30);
        $provider = $data['billing_provider'] ?? _env('BILLING_PROVIDER', 'stripe');

        // Validate fees based on provider
        switch ($provider) {
            case 'razorpay':
            case 'payu':
            case 'cashfree':
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
                break;
            case 'stripe':
            default:
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
                break;
        }

        \Leaf\Config::set([
            "{$provider}.platform_fee_percent" => $platformFeePercent,
            "{$provider}.processing_fee_percent" => $processingFeePercent,
            "{$provider}.processing_fee_fixed" => $processingFeeFixed,
        ]);

        _env("{$provider}_API_KEY", $data["{$provider}_api_key"] ?? "");
        _env("{$provider}_KEY_SECRET", $data["{$provider}_key_secret"] ?? "");

        UserActivity::log($user->id, UserActivity::TYPE_ACCOUNT_UPDATED, "Updated payment settings: provider={$provider}");

        return response()
            ->withFlash('success', 'Payment settings updated.')
            ->redirect('/admin/payment-settings', 303);
