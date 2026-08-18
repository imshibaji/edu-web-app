<?php

namespace Tests;

use Leaf\Flash;
use Leaf\Auth;
use Leaf\Helpers\Password;
use Illuminate\Support\Str;
use Illuminate\Database\Capsule\Manager as Capsule;
use Leaf\Http\Session;
use Illuminate\Events\Dispatcher;
use Illuminate\Container\Container;
use PHPUnit\Framework\TestCase as PHPUnitTestCase;

/**
 * Base test case for Larnr application
 * Provides database setup and helper methods for testing controllers directly
 */
abstract class TestCase extends PHPUnitTestCase
{
    protected static bool $booted = false;
    protected array $flashData = [];
    protected static ?Capsule $capsule = null;

    public function setUp(): void
    {
        if (!self::$booted) {
            self::bootApplication();
            self::$booted = true;
        }
        
        $this->refreshDatabase();
        $this->clearFlash();
    }

    public function tearDown(): void
    {
        $this->clearFlash();
    }

    /**
     * Boot the minimal application for testing (first-run only).
     * Sets up Leaf paths/config. DB connection is handled by refreshDatabase().
     */
    protected static function bootApplication(): void
    {
        // Load environment
        $dotenv = \Dotenv\Dotenv::createUnsafeImmutable(__DIR__ . '/..');
        $dotenv->load();

        // Set test DB connection type
        $_ENV['DB_CONNECTION'] = 'sqlite';

        // Load Leaf config for paths, auth, etc. (does NOT call Database::connect())
        \Leaf\Core::loadApplicationConfig();

        // Start session for flash messages
        if (class_exists(Session::class)) {
            Session::start();
        }
    }

    /**
     * Refresh the database for each test.
     * Creates a fresh SQLite file, updates Capsule config, and reconnects.
     */
    protected function refreshDatabase(): void
    {
        $className = static::class;
        $shortName = basename(str_replace('\\', '/', $className));
        $dbPath = __DIR__ . '/../storage/database/testing_' . $shortName . '.sqlite';

        // Delete and recreate the test database file
        if (file_exists($dbPath)) {
            unlink($dbPath);
        }
        touch($dbPath);

        // Ensure we have a Capsule Manager
        if (!self::$capsule) {
            self::$capsule = new Capsule();
            self::$capsule->addConnection([
                'driver'                => 'sqlite',
                'url'                   => null,
                'database'              => $dbPath,
                'prefix'                => '',
                'foreign_key_constraints' => true,
            ], 'default');
            self::$capsule->setEventDispatcher(new Dispatcher(new Container()));
            self::$capsule->setAsGlobal();
            self::$capsule->bootEloquent();
        } else {
            // Update the default connection's database path in the container config
            // Fluent stores config as flat dot-notation keys, not nested arrays
            $container = self::$capsule->getContainer();
            $connections = $container['config']['database.connections'];
            $connections['default']['database'] = $dbPath;
            $container['config']['database.connections'] = $connections;

            // Force-purge the cached connection so it reconnects to the new file
            self::$capsule->getDatabaseManager()->purge('default');
        }

        // Point Leaf helpers at our Capsule
        if (class_exists('Leaf\Database')) {
            \Leaf\Database::$capsule = self::$capsule;
        }
        if (class_exists('Leaf\Schema')) {
            \Leaf\Schema::setDbConnection(self::$capsule);
        }

        // Run migrations via Leaf Schema
        if (class_exists('Leaf\Schema')) {
            $schemaFiles = glob(__DIR__ . '/../app/database/*.yml');
            foreach ($schemaFiles as $file) {
                \Leaf\Schema::migrate($file);
            }
        }
    }

    /**
     * Clear flash messages
     */
    protected function clearFlash(): void
    {
        $this->flashData = [];
        if (class_exists(Flash::class) && method_exists(Flash::class, 'clear')) {
            Flash::clear();
        }
    }

    /**
     * Create a user with given attributes
     */
    protected function createUser(array $attributes = []): \App\Models\User
    {
        $defaults = [
            'id' => Str::orderedUuid(),
            'email' => 'test' . uniqid() . '@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => 'STUDENT',
            'is_active' => true,
            'base_currency' => 'USD',
        ];

        return \App\Models\User::create(array_merge($defaults, $attributes));
    }

    /**
     * Create a tutor user with profile
     */
    protected function createTutor(array $attributes = []): \App\Models\User
    {
        $user = $this->createUser(array_merge([
            'role' => 'TUTOR',
        ], $attributes));

        \App\Models\TutorProfile::create(array_merge([
            'user_id' => $user->id,
            'full_name' => 'Test Tutor',
            'hourly_rate' => 0,
            'currency' => 'USD',
            'is_verified' => false,
            'format' => 'ONLINE',
            'experience_level' => 'ENTRY',
            'rating' => 0,
        ], $attributes));

        return $user;
    }

    /**
     * Create a student user with profile
     */
    protected function createStudent(array $attributes = []): \App\Models\User
    {
        $user = $this->createUser(array_merge([
            'role' => 'STUDENT',
        ], $attributes));

        \App\Models\StudentProfile::create(array_merge([
            'user_id' => $user->id,
            'full_name' => 'Test Student',
            'phone_number' => null,
        ], $attributes));

        return $user;
    }

    /**
     * Log in a user (simulate auth session)
     */
    protected function login(\App\Models\User $user): void
    {
        // Use Leaf's auth helper to log in
        auth()->login([
            'email' => $user->email,
            'password_hash' => $user->password_hash,
        ]);
    }

    /**
     * Log out current user
     */
    protected function logout(): void
    {
        auth()->logout('/');
    }

    /**
     * Get the currently authenticated user
     */
    protected function authUser(): ?\App\Models\User
    {
        $auth = auth()->user();
        if (!$auth || !$auth->id()) {
            return null;
        }
        return \App\Models\User::query()->find($auth->id());
    }

    /**
     * Assert user is authenticated
     */
    protected function assertAuthenticated(?\App\Models\User $expectedUser = null): void
    {
        $user = $this->authUser();
        $this->assertNotNull($user, 'Expected authenticated user but got guest');
        
        if ($expectedUser) {
            $this->assertEquals($expectedUser->id, $user->id);
        }
    }

    /**
     * Assert user is guest (not authenticated)
     */
    protected function assertGuest(): void
    {
        $user = $this->authUser();
        $this->assertNull($user, 'Expected guest but user is authenticated');
    }

    /**
     * Assert database has a record
     */
    protected function assertDatabaseHas(string $table, array $data): void
    {
        $query = Capsule::table($table);
        foreach ($data as $key => $value) {
            $query->where($key, $value);
        }
        $this->assertTrue($query->exists(), "Record not found in {$table} with data: " . json_encode($data));
    }

    /**
     * Assert database missing a record
     */
    protected function assertDatabaseMissing(string $table, array $data): void
    {
        $query = Capsule::table($table);
        foreach ($data as $key => $value) {
            $query->where($key, $value);
        }
        $this->assertFalse($query->exists(), "Record found in {$table} but expected missing: " . json_encode($data));
    }

    /**
     * Assert database count
     */
    protected function assertDatabaseCount(string $table, int $count, array $where = []): void
    {
        $query = Capsule::table($table);
        foreach ($where as $key => $value) {
            $query->where($key, $value);
        }
        $this->assertEquals($count, $query->count());
    }

    /**
     * Get flash message
     */
    protected function getFlash(string $key): mixed
    {
        return Flash::get($key);
    }

    /**
     * Assert flash has key
     */
    protected function assertFlashHas(string $key, $value = null): void
    {
        $flash = $this->getFlash($key);
        $this->assertNotNull($flash, "Flash key '{$key}' not found");
        if ($value !== null) {
            $this->assertEquals($value, $flash);
        }
    }

    /**
     * Mock request data
     */
    protected function withRequestData(array $data): void
    {
        foreach ($data as $key => $value) {
            $_POST[$key] = $value;
            $_GET[$key] = $value;
        }
        
        // Also set request body for JSON
        file_put_contents('php://input', json_encode($data));
    }
}