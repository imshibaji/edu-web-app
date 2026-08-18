<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\Currency;
use Illuminate\Support\Str;

class CurrencyTest extends TestCase
{
    public function testDefaultRates(): void
    {
        $rates = Currency::FALLBACK_RATES;
        
        $this->assertArrayHasKey('INR', $rates);
        $this->assertEquals(1.0, $rates['INR']);
        $this->assertArrayHasKey('USD', $rates);
        $this->assertEquals(95.45, $rates['USD']);
    }

    public function testDefaultSymbols(): void
    {
        $symbols = Currency::FALLBACK_SYMBOLS;
        
        $this->assertEquals('₹', $symbols['INR']);
        $this->assertEquals('$', $symbols['USD']);
        $this->assertEquals('€', $symbols['EUR']);
        $this->assertEquals('£', $symbols['GBP']);
    }

    public function testFallbackBase(): void
    {
        $this->assertEquals('INR', Currency::FALLBACK_BASE);
    }

    public function testSupportedCurrencies(): void
    {
        $supported = Currency::supported();
        
        $this->assertContains('INR', $supported);
        $this->assertContains('USD', $supported);
        $this->assertContains('EUR', $supported);
    }

    public function testRate(): void
    {
        $this->assertEquals(1.0, Currency::rate('INR'));
        $this->assertEquals(95.45, Currency::rate('USD'));
        $this->assertEquals(1.0, Currency::rate('UNKNOWN')); // defaults to 1.0
    }

    public function testSymbol(): void
    {
        $this->assertEquals('₹', Currency::symbol('INR'));
        $this->assertEquals('$', Currency::symbol('USD'));
        $this->assertEquals('UNKNOWN ', Currency::symbol('UNKNOWN'));
    }

    public function testConvert(): void
    {
        // 10000 INR cents = 100 INR = 100/95.45 USD ≈ 1.047 USD = 104.7 cents
        $result = Currency::convert(10000, 'INR', 'USD');
        $expected = (int) round(10000 * (95.45 / 1.0));
        $this->assertEquals($expected, $result);
        
        // Same currency
        $this->assertEquals(5000, Currency::convert(5000, 'USD', 'USD'));
        
        // Zero amount
        $this->assertEquals(0, Currency::convert(0, 'INR', 'USD'));
    }

    public function testFormat(): void
    {
        $formatted = Currency::format(10000, 'INR');
        $this->assertStringContainsString('₹', $formatted);
        $this->assertStringContainsString('100', $formatted);
    }

    public function testActiveCurrencies(): void
    {
        $active = Currency::activeCurrencies();
        
        $this->assertGreaterThan(0, count($active));
        foreach ($active as $currency) {
            $this->assertTrue($currency['is_active']);
        }
    }

    public function testAddCurrency(): void
    {
        Currency::addCurrency('TEST', 123.45, 'T$');
        
        $this->assertEquals(123.45, Currency::rate('TEST'));
        $this->assertEquals('T$', Currency::symbol('TEST'));
    }

    public function testUpdateCurrency(): void
    {
        Currency::addCurrency('TEST2', 100.00, 'X$');
        Currency::updateCurrency('TEST2', ['rate' => 200.00]);
        
        $this->assertEquals(200.00, Currency::rate('TEST2'));
    }

    public function testRemoveCurrency(): void
    {
        Currency::addCurrency('TEST3', 50.00, 'Y$');
        $result = Currency::removeCurrency('TEST3');
        
        $this->assertTrue($result['success']);
        $this->assertEquals(1.0, Currency::rate('TEST3')); // falls back to default
    }

    public function testSetBaseCurrency(): void
    {
        Currency::setBaseCurrency('USD');
        $this->assertEquals('USD', Currency::getBaseCurrency());
        $this->assertEquals(1.0, Currency::rate('USD'));
    }
}