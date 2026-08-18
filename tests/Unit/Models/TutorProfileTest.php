<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\TutorProfile;
use App\Models\User;
use Illuminate\Support\Str;
use Leaf\Helpers\Password;

class TutorProfileTest extends TestCase
{
    public function testCanCreateTutorProfile(): void
    {
        $user = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'tutor@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => 'TUTOR',
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $profile = TutorProfile::create([
            'user_id' => $user->id,
            'full_name' => 'Test Tutor',
            'hourly_rate' => 5000,
            'currency' => 'USD',
            'is_verified' => false,
            'format' => 'ONLINE',
            'experience_level' => 'ENTRY',
            'rating' => 0,
        ]);

        $this->assertInstanceOf(TutorProfile::class, $profile);
        $this->assertEquals('Test Tutor', $profile->full_name);
        $this->assertEquals(5000, $profile->hourly_rate);
        $this->assertEquals('USD', $profile->currency);
        $this->assertFalse($profile->is_verified);
        $this->assertEquals('ONLINE', $profile->format);
        $this->assertEquals('ENTRY', $profile->experience_level);
        $this->assertEquals(0, $profile->rating);
    }

    public function testTutorProfileDefaults(): void
    {
        $user = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'tutor2@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => 'TUTOR',
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $profile = TutorProfile::create([
            'user_id' => $user->id,
            'full_name' => 'Minimal Tutor',
        ]);

        // Refresh from database to get defaults
        $profile->refresh();
        
        $this->assertEquals(0, $profile->hourly_rate);
        $this->assertEquals('USD', $profile->currency);
        $this->assertFalse($profile->is_verified);
        $this->assertEquals('ONLINE', $profile->format);
        $this->assertEquals('ENTRY', $profile->experience_level);
        $this->assertEquals(0, $profile->rating);
    }

    public function testTutorProfileUserRelationship(): void
    {
        $user = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'tutor3@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => 'TUTOR',
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $profile = TutorProfile::create([
            'user_id' => $user->id,
            'full_name' => 'Test Tutor',
        ]);

        $this->assertNotNull($profile->user);
        $this->assertEquals($user->id, $profile->user->id);
    }

    public function testTutorProfileSubjectsRelationship(): void
    {
        $user = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'tutor4@example.com',
            'password_hash' => Password::hash('password123'),
            'role' => 'TUTOR',
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $profile = TutorProfile::create([
            'user_id' => $user->id,
            'full_name' => 'Test Tutor',
        ]);

        $subject = \App\Models\Subject::create([
            'id' => Str::orderedUuid(),
            'name' => 'Biology',
        ]);

        $profile->subjects()->attach($subject->id, ['rate_cents' => 5000]);

        $this->assertCount(1, $profile->subjects);
    }
}