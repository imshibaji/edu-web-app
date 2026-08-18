<?php

namespace App\Console;

use Leaf\Sprout\Command;

class InitCommand extends Command
{
    protected $signature = 'app:init';
    protected $description = 'Create/update the Larnr database schema (idempotent)';
    protected $help = 'Migrates all Leaf Schema files in app/database/*.yml against the configured SQLite database.';

    protected function handle()
    {
        $dbConfig = MvcConfig('database');
        $default = $dbConfig['default'] ?? 'sqlite';
        $connection = $dbConfig['connections'][$default] ?? [];
        $dbPath = $connection['database'] ?? \StoragePath('database/database.sqlite');

        if (!is_dir(dirname($dbPath))) {
            mkdir(dirname($dbPath), 0775, true);
        }

        if (!file_exists($dbPath)) {
            touch($dbPath);
        }

        $pdo = new \PDO('sqlite:' . $dbPath);
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA busy_timeout = 5000');

        $schemaFiles = glob(getcwd() . DIRECTORY_SEPARATOR . AppPaths('database') . DIRECTORY_SEPARATOR . '*.yml');

        if (empty($schemaFiles)) {
            $this->error('No schema files found in app/database.');

            return 1;
        }

        foreach ($schemaFiles as $schemaFile) {
            $name = basename($schemaFile, '.yml');

            if (!\Leaf\Schema::migrate($schemaFile)) {
                $this->error("Could not migrate $name");

                return 1;
            }

            $this->writeln("  <info>+</info> migrated $name");
        }

        $this->info('Schema ready: ' . realpath($dbPath));

        return 0;
    }
}