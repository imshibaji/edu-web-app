<?php

/**
 * Pest Bootstrap
 * 
 * This file is loaded before running tests to set up the application environment.
 */

require_once __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$dotenv = \Dotenv\Dotenv::createUnsafeImmutable(__DIR__ . '/..');
$dotenv->load();

// Set up database for testing (use in-memory SQLite or separate test DB)
// Using a separate test database file
$_ENV['DB_DATABASE'] = __DIR__ . '/../storage/database/testing.sqlite';
$_ENV['DB_CONNECTION'] = 'sqlite';

// Boot the Leaf application
$app = require_once __DIR__ . '/../leaf';

// Ensure the app is booted
if (function_exists('app')) {
    $app = app();
}

// Ensure database connection is set up
if (class_exists('Leaf\Database')) {
    \Leaf\Database::connect();
}

// Run migrations on test database
if (class_exists('Leaf\Schema')) {
    $schemaFiles = glob(__DIR__ . '/../app/database/*.yml');
    foreach ($schemaFiles as $file) {
        \Leaf\Schema::migrate($file);
    }
}

// Set up Pest expectations
uses()->group('feature', 'unit', 'integration');