<?php

namespace App\Controllers\Auth\admin;

use App\Controllers\Auth\Controller;
use App\Models\Currency;
use App\Models\UserActivity;

class CurrenciesController extends Controller
{
    public function index()
    {
        if (!($user = $this->requireAdmin())) return;

        $settings = Currency::allSettings();
        $baseCurrency = Currency::getBaseCurrency();

        response()->inertia('admin/currencies', [
            'currencies' => $settings,
            'baseCurrency' => $baseCurrency,
            'errors' => flash()->display('errors') ?? [],
        ]);
    }

    public function update()
    {
        if (!($user = $this->requireAdmin())) return;

        $rates = request()->get('rates');
        $rates = is_array($rates) ? $rates : [];

        if (empty($rates)) {
            return response()
                ->withFlash('error', 'No currency rates were provided.')
                ->redirect('/admin/currencies', 303);
        }

        $updates = [];
        foreach ($rates as $item) {
            if (!is_array($item)) {
                continue;
            }

            $code = strtoupper(trim((string) ($item['code'] ?? '')));
            $rate = (float) ($item['rate'] ?? 0);

            if ($code === '' || $rate <= 0) {
                continue;
            }

            $updates[$code] = [
                'rate' => $rate,
                'is_active' => (bool) ($item['is_active'] ?? true),
            ];
        }

        if (empty($updates)) {
            return response()
                ->withFlash('error', 'No valid currency rates were provided.')
                ->redirect('/admin/currencies', 303);
        }

        Currency::updateRates($updates);

        UserActivity::log($user->id, UserActivity::TYPE_ACCOUNT_UPDATED, 'Updated currency exchange rates');

        return response()
            ->withFlash('success', 'Currency rates updated.')
            ->redirect('/admin/currencies', 303);
    }

    public function add()
    {
        if (!($user = $this->requireAdmin())) return;

        $code = strtoupper(trim((string) request()->params('code', '')));
        $rate = (float) request()->params('rate', 0);
        $symbol = trim((string) request()->params('symbol', ''));

        if ($code === '' || $rate <= 0) {
            return response()
                ->withFlash('error', 'A currency code and a rate greater than 0 are required.')
                ->redirect('/admin/currencies', 303);
        }

        Currency::addCurrency($code, $rate, $symbol !== '' ? $symbol : ($code . ' '), true);

        UserActivity::log($user->id, UserActivity::TYPE_ACCOUNT_UPDATED, "Added currency {$code}");

        return response()
            ->withFlash('success', "Currency {$code} added.")
            ->redirect('/admin/currencies', 303);
    }

    public function remove()
    {
        if (!($user = $this->requireAdmin())) return;

        $code = strtoupper(trim((string) request()->params('code', '')));

        if ($code === '') {
            return response()
                ->withFlash('error', 'A currency code is required.')
                ->redirect('/admin/currencies', 303);
        }

        $result = Currency::removeCurrency($code);

        UserActivity::log($user->id, UserActivity::TYPE_ACCOUNT_UPDATED, "Removed currency {$code}");

        if ($result['success']) {
            return response()
                ->withFlash('success', $result['message'])
                ->redirect('/admin/currencies', 303);
        }

        return response()
            ->withFlash('error', $result['message'])
            ->redirect('/admin/currencies', 303);
    }

    public function setBase()
    {
        if (!($user = $this->requireAdmin())) return;

        $code = strtoupper(trim((string) request()->params('code', '')));

        if ($code === '') {
            return response()
                ->withFlash('error', 'A currency code is required.')
                ->redirect('/admin/currencies', 303);
        }

        Currency::setBaseCurrency($code);

        UserActivity::log($user->id, UserActivity::TYPE_ACCOUNT_UPDATED, "Set base currency to {$code}");

        return response()
            ->withFlash('success', "Base currency set to {$code}.")
            ->redirect('/admin/currencies', 303);
    }
}
