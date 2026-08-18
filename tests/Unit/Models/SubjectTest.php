<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\Subject;
use App\Models\TutorSubject;
use App\Models\User;
use Illuminate\Support\Str;
use Leaf\Helpers\Password;

class SubjectTest extends TestCase
{
    public function testCanCreateSubject(): void
    {
        $subject = Subject::create([
            'id' => Str::orderedUuid(),
            'name' => 'Mathematics',
        ]);

        $this->assertInstanceOf(Subject::class, $subject);
        $this->assertEquals('Mathematics', $subject->name);
    }

    public function testSubjectTimestamps(): void
    {
        $subject = Subject::create([
            'id' => Str::orderedUuid(),
            'name' => 'Physics',
        ]);

        $this->assertNotNull($subject->created_at);
        $this->assertNotNull($subject->updated_at);
    }

    public function testSubjectTutorsRelationship(): void
    {
        $subject = Subject::create([
            'id' => Str::orderedUuid(),
            'name' => 'Chemistry',
        ]);

        $tutor1 = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'tutor1@example.com',
            'password_hash' => \Leaf\Helpers\Password::hash('password123'),
            'role' => 'TUTOR',
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $tutor2 = User::create([
            'id' => Str::orderedUuid(),
            'email' => 'tutor2@example.com',
            'password_hash' => \Leaf\Helpers\Password::hash('password123'),
            'role' => 'TUTOR',
            'is_active' => true,
            'base_currency' => 'USD',
        ]);

        $subject->tutors()->attach($tutor1->id);
        $subject->tutors()->attach($tutor2->id);

        $this->assertCount(2, $subject->tutors);
    }
}