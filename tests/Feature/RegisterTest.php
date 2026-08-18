<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\StudentProfile;
use App\Models\TutorProfile;
use App\Models\UserActivity;
use App\Controllers\Auth\RegisterController;
use Leaf\Helpers\Password;
use Illuminate\Support\Str;

class RegisterTest extends TestCase
{
    public function testRegisterShowsPage(): void
    {
        $controller = new RegisterController();
        $controller->show();
        $this->assertTrue(true);
    }

    public function testRegisterRejectsMissingFullName(): void
    {
        $this->withRequestData([
            'fullName' => '',
            'email' => 'test@example.com',
            'role' => 'STUDENT',
            'password' => 'password123',
            'confirmPassword' => 'password123',
        ]);

        $controller = new RegisterController();
        $controller->store();
        
        $this->assertFlashHas('error');
    }

    public function testRegisterRejectsShortFullName(): void
    {
        $this->withRequestData([
            'fullName' => 'A',
            'email' => 'test@example.com',
            'role' => 'STUDENT',
            'password' => 'password123',
            'confirmPassword' => 'password123',
        ]);

        $controller = new RegisterController();
        $controller->store();
        
        $this->assertFlashHas('error');
    }

    public function testRegisterRejectsInvalidEmail(): void
    {
        $this->withRequestData([
            'fullName' => 'Test User',
            'email' => 'invalid-email',
            'role' => 'STUDENT',
            'password' => 'password123',
            'confirmPassword' => 'password123',
        ]);

        $controller = new RegisterController();
        $controller->store();
        
        $this->assertFlashHas('error');
    }

    public function testRegisterRejectsInvalidRole(): void
    {
        $this->withRequestData([
            'fullName' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'INVALID',
            'password' => 'password123',
            'confirmPassword' => 'password123',
        ]);

        $controller = new RegisterController();
        $controller->store();
        
        $this->assertFlashHas('error');
    }

    public function testRegisterRejectsShortPassword(): void
    {
        $this->withRequestData([
            'fullName' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'STUDENT',
            'password' => 'short',
            'confirmPassword' => 'short',
        ]);

        $controller = new RegisterController();
        $controller->store();
        
        $this->assertFlashHas('error');
    }

    public function testRegisterRejectsMismatchedPassword(): void
    {
        $this->withRequestData([
            'fullName' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'STUDENT',
            'password' => 'password123',
            'confirmPassword' => 'different123',
        ]);

        $controller = new RegisterController();
        $controller->store();
        
        $this->assertFlashHas('error');
    }

    public function testRegisterRejectsDuplicateEmail(): void
    {
        User::create([
            'id' => Str::orderedUuid(),
            'email' => 'existing@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => 'STUDENT',
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $this->withRequestData([
            'fullName' => 'Test User',
            'email' => 'existing@example.com',
            'role' => 'STUDENT',
            'password' => 'password123',
            'confirmPassword' => 'password123',
        ]);

        $controller = new RegisterController();
        $controller->store();
        
        $this->assertFlashHas('error');
    }

    public function testRegisterStudent(): void
    {
        $this->withRequestData([
            'fullName' => 'Test Student',
            'email' => 'student@example.com',
            'role' => 'STUDENT',
            'password' => 'password123',
            'confirmPassword' => 'password123',
        ]);

        $controller = new RegisterController();
        $controller->store();
        
        $this->assertDatabaseHas('users', [
            'email' => 'student@example.com',
            'role' => 'STUDENT',
        ]);
        
        $this->assertDatabaseHas('student_profiles', [
            'full_name' => 'Test Student',
        ]);
        
        $this->assertDatabaseHas('user_activities', [
            'type' => UserActivity::TYPE_REGISTERED,
            'description' => 'Created a STUDENT account',
        ]);
    }

    public function testRegisterTutor(): void
    {
        $this->withRequestData([
            'fullName' => 'Test Tutor',
            'email' => 'tutor@example.com',
            'role' => 'TUTOR',
            'password' => 'password123',
            'confirmPassword' => 'password123',
        ]);

        $controller = new RegisterController();
        $controller->store();
        
        $this->assertDatabaseHas('users', [
            'email' => 'tutor@example.com',
            'role' => 'TUTOR',
        ]);
        
        $this->assertDatabaseHas('tutor_profiles', [
            'full_name' => 'Test Tutor',
        ]);
        
        $this->assertDatabaseHas('user_activities', [
            'type' => UserActivity::TYPE_REGISTERED,
            'description' => 'Created a TUTOR account',
        ]);
    }

    public function testRegisterDefaultsToStudent(): void
    {
        $this->withRequestData([
            'fullName' => 'Test User',
            'email' => 'default@example.com',
            'password' => 'password123',
            'confirmPassword' => 'password123',
        ]);

        $controller = new RegisterController();
        $controller->store();
        
        $this->assertDatabaseHas('users', [
            'email' => 'default@example.com',
            'role' => 'STUDENT',
        ]);
    }
}