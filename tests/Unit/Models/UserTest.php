<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\User;
use App\Models\StudentProfile;
use App\Models\TutorProfile;
use App\Models\Subject;
use App\Models\AvailabilitySlot;
use Leaf\Helpers\Password;
use Illuminate\Support\Str;

class UserTest extends TestCase
{
    public function testCanCreateUser(): void
    {
        $user = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'test@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => 'STUDENT',
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('test@example.com', $user->email);
        $this->assertEquals('STUDENT', $user->role);
        $this->assertTrue($user->is_active);
        $this->assertEquals('USD', $user->base_currency);
    }

    public function testUserRoles(): void
    {
        $student = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'student@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => User::ROLE_STUDENT,
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $tutor = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'tutor@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => User::ROLE_TUTOR,
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $admin = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'admin@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => User::ROLE_ADMIN,
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $this->assertTrue($student->isStudent());
        $this->assertFalse($student->isTutor());
        $this->assertFalse($student->isAdmin());

        $this->assertTrue($tutor->isTutor());
        $this->assertFalse($tutor->isStudent());
        $this->assertFalse($tutor->isAdmin());

        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($admin->isStudent());
        $this->assertFalse($admin->isTutor());
    }

    public function testUserProfileRelationships(): void
    {
        $user = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'test@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => 'STUDENT',
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        // Test student profile
        $studentProfile = StudentProfile::create([
            'user_id' => $user->id,
            'full_name' => 'Test Student',
            'phone_number' => '+1234567890',
        ]);

        $this->assertNotNull($user->studentProfile);
        $this->assertEquals('Test Student', $user->studentProfile->full_name);

        // Change role to tutor and test tutor profile
        $user->role = User::ROLE_TUTOR;
        $user->save();

        $tutorProfile = TutorProfile::create([
            'user_id' => $user->id,
            'full_name' => 'Test Tutor',
            'hourly_rate' => 5000,
            'currency' => 'USD',
            'is_verified' => false,
            'format' => 'ONLINE',
            'experience_level' => 'ENTRY',
            'rating' => 0,
        ]);

        $this->assertNotNull($user->tutorProfile);
        $this->assertEquals('Test Tutor', $user->tutorProfile->full_name);
        $this->assertEquals(5000, $user->tutorProfile->hourly_rate);
    }

    public function testUserSubjectsRelationship(): void
    {
        $user = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'tutor@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => User::ROLE_TUTOR,
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $subject1 = Subject::create([
            'id' => Str::orderedUuid(),
            'name' => 'Mathematics',
        ]);

        $subject2 = Subject::create([
            'id' => Str::orderedUuid(),
            'name' => 'Physics',
        ]);

        // Attach subjects with pivot data
        $user->tutorSubjects()->attach($subject1->id, ['rate_cents' => 5000]);
        $user->tutorSubjects()->attach($subject2->id, ['rate_cents' => 6000]);

        $this->assertCount(2, $user->tutorSubjects);
        $this->assertEquals(5000, $user->tutorSubjects->first()->pivot->rate_cents);
    }

    public function testUserAvailabilitySlots(): void
    {
        $user = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'tutor@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => User::ROLE_TUTOR,
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $slot = AvailabilitySlot::create([
            'id' => Str::orderedUuid(),
            'tutor_id' => $user->id,
            'start_time' => date('Y-m-d H:i:s', strtotime('+1 day 10:00:00')),
            'end_time' => date('Y-m-d H:i:s', strtotime('+1 day 11:00:00')),
            'is_booked' => false,
        ]);

        $this->assertCount(1, $user->availabilitySlots);
        $this->assertFalse($user->availabilitySlots->first()->is_booked);
    }
}