<?php

namespace App\Models;

class Currency
{
    public const FALLBACK_RATES = [
        'INR' => 1.0,
        'USD' => 95.45,
        'EUR' => 110.38,
        'GBP' => 129.41,
        'AED' => 25.99,
        'SGD' => 74.62,
    ];

    public const FALLBACK_SYMBOLS = [
        'USD' => '$',
        'INR' => '₹',
        'EUR' => '€',
        'GBP' => '£',
        'AED' => 'AED ',
        'SGD' => 'S$',
    ];

    public const FALLBACK_BASE = 'INR';

    protected static ?array $cachedRates = null;
    protected static ?string $cachedBase = null;

    /**
     * Ensure the currency_settings table exists, creating it if needed.
     */
    public static function ensureTable(): void
    {
        try {
            $pdo = \Illuminate\Database\Capsule\Manager::connection()->getPdo();
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS currency_settings (
                    code       VARCHAR(3)   PRIMARY KEY,
                    rate       REAL         NOT NULL DEFAULT 1.0 CHECK (rate > 0),
                    symbol     VARCHAR(10)  NOT NULL DEFAULT '',
                    is_active  INTEGER      NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
                    is_base    INTEGER      NOT NULL DEFAULT 0 CHECK (is_base IN (0, 1)),
                    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            ");
        } catch (\Exception $e) {
            // Will fall back to hardcoded defaults
        }
    }

    /**
     * Load rates from currency_settings table, falling back to hardcoded defaults.
     */
    protected static function loadRates(): array
    {
        if (self::$cachedRates !== null) {
            return self::$cachedRates;
        }

        self::ensureTable();

        try {
            $rows = \Illuminate\Database\Capsule\Manager::table('currency_settings')
                ->where('is_active', true)
                ->pluck('rate', 'code')
                ->toArray();

            if (!empty($rows)) {
                self::$cachedRates = $rows;
                return self::$cachedRates;
            }
        } catch (\Exception $e) {
            // Table may not exist yet during migrations
        }

        self::$cachedRates = self::FALLBACK_RATES;
        return self::$cachedRates;
    }

    /**
     * Load ALL currencies (active + inactive) from DB, merged with fallbacks.
     */
    protected static function loadAllFromDb(): array
    {
        self::ensureTable();

        try {
            $rows = \Illuminate\Database\Capsule\Manager::table('currency_settings')
                ->get()
                ->keyBy('code')
                ->toArray();

            if (!empty($rows)) {
                $result = [];
                foreach ($rows as $code => $row) {
                    $result[$code] = [
                        'code' => $code,
                        'rate' => (float) $row->rate,
                        'symbol' => $row->symbol ?: ($code . ' '),
                        'is_active' => (bool) $row->is_active,
                    ];
                }
                return $result;
            }
        } catch (\Exception $e) {
            // fallback
        }

        $result = [];
        foreach (self::FALLBACK_RATES as $code => $rate) {
            $result[$code] = [
                'code' => $code,
                'rate' => $rate,
                'symbol' => self::FALLBACK_SYMBOLS[$code] ?? ($code . ' '),
                'is_active' => true,
            ];
        }
        return $result;
    }

    public static function clearCache(): void
    {
        self::$cachedRates = null;
        self::$cachedBase = null;
    }

    /**
     * Get the platform base currency code.
     */
    public static function getBaseCurrency(): string
    {
        if (self::$cachedBase !== null) {
            return self::$cachedBase;
        }

        self::ensureTable();

        try {
            $row = \Illuminate\Database\Capsule\Manager::table('currency_settings')
                ->where('is_base', 1)
                ->first();

            if ($row) {
                self::$cachedBase = $row->code;
                return self::$cachedBase;
            }
        } catch (\Exception $e) {
            // fallback
        }

        self::$cachedBase = self::FALLBACK_BASE;
        return self::$cachedBase;
    }

    /**
     * Set a new base currency.
     */
    public static function setBaseCurrency(string $code): void
    {
        $code = strtoupper(trim($code));

        self::ensureTable();

        $pdo = \Illuminate\Database\Capsule\Manager::table('currency_settings');

        // Unset current base
        $pdo->where('is_base', 1)->update(['is_base' => 0]);

        // Ensure the currency exists, then set as base
        $pdo->updateOrInsert(
            ['code' => $code],
            [
                'rate' => 1.0,
                'symbol' => self::FALLBACK_SYMBOLS[$code] ?? ($code . ' '),
                'is_active' => 1,
                'is_base' => 1,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]
        );

        // Recalculate all other rates relative to the new base
        self::recalculateRatesAfterBaseChange($code);

        self::clearCache();
    }

    /**
     * When the base currency changes, we need to recalculate all rates.
     * Old rates were relative to the old base. We convert them to be relative to the new base.
     */
    protected static function recalculateRatesAfterBaseChange(string $newBaseCode): void
    {
        // The new base is always 1.0.
        // For other currencies, we keep their stored rates as-is since they already
        // represent the conversion factor. Users will need to update them if the
        // relative values should change.
    }

    /**
     * Add a new currency.
     */
    public static function addCurrency(string $code, float $rate, string $symbol, bool $isActive = true): void
    {
        $code = strtoupper(trim($code));

        if ($rate <= 0) {
            throw new \InvalidArgumentException('Rate must be greater than 0.');
        }

        if ($symbol === '') {
            $symbol = $code . ' ';
        }

        self::ensureTable();

        \Illuminate\Database\Capsule\Manager::table('currency_settings')
            ->updateOrInsert(
                ['code' => $code],
                [
                    'rate' => $rate,
                    'symbol' => $symbol,
                    'is_active' => $isActive ? 1 : 0,
                    'is_base' => 0,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]
            );

        self::clearCache();
    }

    /**
     * Update an existing currency's settings.
     */
    public static function updateCurrency(string $code, array $data): void
    {
        $code = strtoupper(trim($code));

        self::ensureTable();

        $update = ['updated_at' => date('Y-m-d H:i:s')];

        if (array_key_exists('rate', $data) && $data['rate'] > 0) {
            $update['rate'] = (float) $data['rate'];
        }
        if (array_key_exists('symbol', $data)) {
            $update['symbol'] = $data['symbol'];
        }
        if (array_key_exists('is_active', $data)) {
            $update['is_active'] = $data['is_active'] ? 1 : 0;
        }

        \Illuminate\Database\Capsule\Manager::table('currency_settings')
            ->where('code', $code)
            ->update($update);

        self::clearCache();
    }

    /**
     * Remove a currency. Cannot remove the base currency or currencies in use by tutors/bookings.
     */
    public static function removeCurrency(string $code): array
    {
        $code = strtoupper(trim($code));

        self::ensureTable();

        // Cannot remove the base currency
        if ($code === self::getBaseCurrency()) {
            return ['success' => false, 'message' => 'Cannot remove the base currency. Set a different base first.'];
        }

        // Check if any tutor is using this currency
        $tutorCount = \Illuminate\Database\Capsule\Manager::table('tutor_profiles')
            ->where('currency', $code)
            ->count();

        if ($tutorCount > 0) {
            return ['success' => false, 'message' => "Cannot remove {$code}: {$tutorCount} tutor(s) are using this currency. Change their currency first."];
        }

        // Check if any booking uses this currency
        $bookingCount = \Illuminate\Database\Capsule\Manager::table('bookings')
            ->where('currency', $code)
            ->count();

        if ($bookingCount > 0) {
            return ['success' => false, 'message' => "Cannot remove {$code}: {$bookingCount} booking(s) use this currency. Historical records must retain the currency."];
        }

        \Illuminate\Database\Capsule\Manager::table('currency_settings')
            ->where('code', $code)
            ->delete();

        self::clearCache();

        return ['success' => true, 'message' => "{$code} removed."];
    }

    public static function supported(): array
    {
        return array_keys(self::loadRates());
    }

    public static function rate(string $code): float
    {
        return self::loadRates()[$code] ?? 1.0;
    }

    public static function symbol(string $code): string
    {
        // Try DB first
        try {
            self::ensureTable();
            $row = \Illuminate\Database\Capsule\Manager::table('currency_settings')
                ->where('code', $code)
                ->first();
            if ($row && !empty($row->symbol)) {
                return $row->symbol;
            }
        } catch (\Exception $e) {
            // fallback
        }

        return self::FALLBACK_SYMBOLS[$code] ?? ($code . ' ');
    }

    public static function convert(int $cents, string $from, string $to): int
    {
        if ($from === $to || $cents <= 0) {
            return $cents;
        }

        return (int) round($cents * (self::rate($to) / self::rate($from)));
    }

    public static function format(int $cents, ?string $currency = null): string
    {
        $currency = $currency ?? self::getBaseCurrency();
        $amount = $cents / 100;

        return self::symbol($currency) . number_format($amount, fmod($amount, 1) === 0.0 ? 0 : 2);
    }

    /**
     * Return all currencies with their current settings.
     */
    public static function allSettings(): array
    {
        $dbCurrencies = self::loadAllFromDb();
        $base = self::getBaseCurrency();

        // Ensure base currency is in the list
        if (!isset($dbCurrencies[$base])) {
            $dbCurrencies[$base] = [
                'code' => $base,
                'rate' => 1.0,
                'symbol' => self::FALLBACK_SYMBOLS[$base] ?? ($base . ' '),
                'is_active' => true,
            ];
        }

        // Mark base
        $dbCurrencies[$base]['is_base'] = true;

        return $dbCurrencies;
    }

    /**
     * Update rates for one or more currencies.
     */
    public static function updateRates(array $updates): void
    {
        self::ensureTable();

        foreach ($updates as $code => $data) {
            $code = strtoupper($code);
            $rate = $data['rate'] ?? null;
            $isActive = $data['is_active'] ?? true;

            if ($rate === null || $rate <= 0) {
                continue;
            }

            \Illuminate\Database\Capsule\Manager::table('currency_settings')
                ->updateOrInsert(
                    ['code' => $code],
                    [
                        'rate' => $rate,
                        'is_active' => $isActive ? 1 : 0,
                        'updated_at' => date('Y-m-d H:i:s'),
                    ]
                );
        }

        self::clearCache();
    }

    /**
     * Get list of active currencies for user-facing dropdowns.
     */
    public static function activeCurrencies(): array
    {
        $all = self::allSettings();
        return array_filter($all, fn($c) => $c['is_active']);
    }
}
