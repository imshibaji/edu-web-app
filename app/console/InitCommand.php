<?php

namespace App\Console;

use Leaf\Sprout\Command;

class InitCommand extends Command
{
    protected $signature = 'app:init';
    protected $description = 'Create/update the Larnr database schema (idempotent)';
    protected $help = 'Applies app/database/schema.sqlite.sql to the configured SQLite database.';

    protected function handle()
    {
        $dbPath = \StoragePath('database/database.sqlite');

        if (!is_dir(dirname($dbPath))) {
            mkdir(dirname($dbPath), 0775, true);
        }

        if (!file_exists($dbPath)) {
            touch($dbPath);
        }

        $schema = file_get_contents(\AppPaths('database') . '/schema.sqlite.sql');

        $pdo = new \PDO('sqlite:' . $dbPath);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA busy_timeout = 5000');
        $pdo->exec($schema);

        $this->info('Schema ready: ' . realpath($dbPath));

        return 0;
    }
}
