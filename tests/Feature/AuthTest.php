<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\StudentProfile;
use App\Models\TutorProfile;
use App\Models\UserActivity;
use App\Controllers\Auth\LoginController;
use App\Controllers\Auth\RegisterController;
use Leaf\Helpers\Password;
use Illuminate\Support\Str;

class AuthTest extends TestCase
{
    public function testLoginShowsPage(): void
    {
        $controller = new LoginController();
        $controller->show();
        $this->assertTrue(true);
    }

    public function testLoginRejectsInvalidEmail(): void
    {
        $this->withRequestData([
            'email' => 'invalid-email',
            'password' => 'password123',
        ]);

        $controller = new LoginController();
        $controller->store();
        
        $this->assertFlashHas('error');
    }

    public function testLoginRejectsShortPassword(): void
    {
        $this->withRequestData([
            'email' => 'test@example.com',
            'password' => 'short',
        ]);

        $controller = new LoginController();
        $controller->store();
        
        $this->assertFlashHas('error');
    }

    public function testLoginRejectsNonExistentUser(): void
    {
        $this->withRequestData([
            'email' => 'nonexistent@example.com',
            'password' => 'password123',
        ]);

        $controller = new LoginController();
        $controller->store();
        
        $this->assertFlashHas('error');
    }

    public function testLoginRejectsIncorrectPassword(): void
    {
        $user = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'test@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => 'STUDENT',
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $this->withRequestData([
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $controller = new LoginController();
        $controller->store();
        
        $this->assertFlashHas('error');
    }

    public function testLoginSuccess(): void
    {
        $user = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'test@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => 'STUDENT',
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $this->withRequestData([
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $controller = new LoginController();
        $controller->store();
        
        $this->assertAuthenticatedAs($user);
    }

    public function testLoginLogsActivity(): void
    {
        $user = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'test@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => 'STUDENT',
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $this->withRequestData([
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $controller = new LoginController();
        $controller->store();
        
        $this->assertDatabaseHas('user_activities', [
            'user_id' => $user->id,
            'type' => UserActivity::TYPE_LOGIN,
            'description' => 'Signed in',
        ]);
    }

    public function testLogout(): void
    {
        $user = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'test@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => 'STUDENT',
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $this->login($user);
        $this->assertAuthenticatedAs($user);

        $controller = new LoginController();
        $controller->logout();
        
        $this->assertGuest();
    }

    public function testLogoutLogsActivity(): void
    {
        $user = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'test@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => 'STUDENT',
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $this->login($user);
        $controller = new LoginController();
        $controller->logout();

        $this->assertDatabaseHas('user_activities', [
            'user_id' => $user->id,
            'type' => UserActivity::TYPE_LOGOUT,
            'description' => 'Signed out',
        ]);
    }
}