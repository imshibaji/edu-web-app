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

        $data = request()->validate([
            'rates' => 'array',
            'rates.*.code' => 'string|min:2|max:10',
            'rates.*.rate' => 'numeric|min:0.000001',
            'rates.*.is_active' => 'boolean',
        ]);

        if (!$data) {
            return response()
                ->withFlash('errors', request()->errors())
                ->redirect('/admin/currencies', 303);
        }

        $updates = [];
        foreach ($data['rates'] as $item) {
            $code = strtoupper($item['code']);
            $updates[$code] = [
                'rate' => (float) $item['rate'],
                'is_active' => (bool) ($item['is_active'] ?? true),
            ];
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

        $data = request()->validate([
            'code' => 'string|min:2|max:10',
            'rate' => 'numeric|min:0.000001',
            'symbol' => 'optional|string',
        ]);

        if (!$data) {
            return response()
                ->withFlash('errors', request()->errors())
                ->redirect('/admin/currencies', 303);
        }

        $code = strtoupper(trim($data['code']));
        $symbol = $data['symbol'] ?? ($code . ' ');

        Currency::addCurrency($code, (float) $data['rate'], $symbol, true);

        UserActivity::log($user->id, UserActivity::TYPE_ACCOUNT_UPDATED, "Added currency {$code}");

        return response()
            ->withFlash('success', "Currency {$code} added.")
            ->redirect('/admin/currencies', 303);
    }

    public function remove()
    {
        if (!($user = $this->requireAdmin())) return;

        $data = request()->validate([
            'code' => 'string|min:2|max:10',
        ]);

        if (!$data) {
            return response()
                ->withFlash('errors', request()->errors())
                ->redirect('/admin/currencies', 303);
        }

        $result = Currency::removeCurrency(strtoupper(trim($data['code'])));

        UserActivity::log($user->id, UserActivity::TYPE_ACCOUNT_UPDATED, "Removed currency {$data['code']}");

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

        $data = request()->validate([
            'code' => 'string|min:2|max:10',
        ]);

        if (!$data) {
            return response()
                ->withFlash('errors', request()->errors())
                ->redirect('/admin/currencies', 303);
        }

        $code = strtoupper(trim($data['code']));
        Currency::setBaseCurrency($code);

        UserActivity::log($user->id, UserActivity::TYPE_ACCOUNT_UPDATED, "Set base currency to {$code}");

        return response()
            ->withFlash('success', "Base currency set to {$code}.")
            ->redirect('/admin/currencies', 303);
    }
}
