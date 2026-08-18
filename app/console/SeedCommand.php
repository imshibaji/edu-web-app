<?php

namespace App\Console;

use Leaf\Sprout\Command;

class SeedCommand extends Command
{
    protected $signature = 'app:seed';
    protected $description = 'Seed Larnr with demo data from Leaf Schema seed blocks';

    protected function handle()
    {
        $dbPath = \StoragePath('database/database.sqlite');

        if (!file_exists($dbPath)) {
            $this->error('Database not found. Run `php leaf app:init` first.');

            return 1;
        }

        $schemaFiles = glob(getcwd() . DIRECTORY_SEPARATOR . AppPaths('database') . DIRECTORY_SEPARATOR . '*.yml');

        if (empty($schemaFiles)) {
            $this->error('No schema files found in app/database.');

            return 1;
        }

        foreach ($schemaFiles as $schemaFile) {
            $name = basename($schemaFile, '.yml');

            if (!\Leaf\Schema::seed($schemaFile)) {
                $this->error("Could not seed $name");

                return 1;
            }

            $this->writeln("  <info>+</info> seeded $name");
        }

        $this->info('Seeding complete.');

        return 0;
    }
}