<?php

use Pest\PestPlugin;

pest()->extend(\Tests\TestCase::class);

return [
    'bootstrap' => __DIR__ . '/tests/bootstrap.php',
    'testsuite' => [
        'name' => 'Larnr Tests',
        'suites' => [
            'unit' => ['tests/Unit'],
            'feature' => ['tests/Feature'],
            'integration' => ['tests/Integration'],
        ],
    ],
    'parallel' => false,
    'processes' => 1,
    'colors' => true,
    'stop_on_failure' => false,
    'min' => 0,
    'reporters' => [
        'default' => [
            'title' => 'Larnr Test Suite',
        ],
    ],
];