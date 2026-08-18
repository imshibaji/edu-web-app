<?php

/**
 * Bootstrap file that ensures environment is loaded before config
 * This works around Leaf's _env() static cache issue
 */

// Load environment first
$dotenv = \Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__));
$dotenv->load();

// Force putenv for all env vars
foreach ($_ENV as $key => $value) {
    putenv("$key=$value");
}

// Now load the application
require dirname(__DIR__) . '/vendor/autoload.php';

\Leaf\DevTools::install();

if (php_sapi_name() === 'cli-server') {
    $path = realpath(__DIR__ . parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

    if (is_string($path) && __FILE__ !== $path && is_file($path)) {
        return false;
    }
    unset($path);
}

// Load Leaf config with proper env
\Leaf\Core::loadApplicationConfig();

\Leaf\Core::runApplication();