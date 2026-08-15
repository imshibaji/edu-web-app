<?php

namespace App\Models;

class Currency
{
    public const RATES = [
        'USD' => 1.0,
        'INR' => 83.5,
        'EUR' => 0.92,
        'GBP' => 0.79,
        'AED' => 3.67,
        'SGD' => 1.35,
    ];

    public const SYMBOLS = [
        'USD' => '$',
        'INR' => '₹',
        'EUR' => '€',
        'GBP' => '£',
        'AED' => 'AED ',
        'SGD' => 'S$',
    ];

    public const DEFAULT = 'USD';

    public static function supported(): array
    {
        return array_keys(self::RATES);
    }

    public static function rate(string $code): float
    {
        return self::RATES[$code] ?? 1.0;
    }

    public static function symbol(string $code): string
    {
        return self::SYMBOLS[$code] ?? $code . ' ';
    }

    public static function convert(int $cents, string $from, string $to): int
    {
        if ($from === $to || $cents <= 0) {
            return $cents;
        }

        return (int) round($cents * (self::rate($to) / self::rate($from)));
    }

    public static function format(int $cents, string $currency = self::DEFAULT): string
    {
        $amount = $cents / 100;

        return self::symbol($currency) . number_format($amount, fmod($amount, 1) === 0.0 ? 0 : 2);
    }
}
