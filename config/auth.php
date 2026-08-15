<?php

/**
 * Leaf Auth configuration for Larnr.
 *
 * These settings are merged on top of the MVC defaults in
 * vendor/leafs/mvc-core/src/Core.php. We map auth onto the
 * project schema: users.password_hash holds the password.
 */
return [
    'db.table' => _env('AUTH_DB_TABLE', 'users'),
    'id.key' => _env('AUTH_DB_ID', 'id'),
    'password.key' => 'password_hash',
    'unique' => ['email'],
    'session' => true,
    'timestamps' => true,
    'messages.loginParamsError' => 'These credentials do not match our records.',
    'messages.loginPasswordError' => 'Incorrect password.',
];
