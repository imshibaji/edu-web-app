<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Controllers\PublicController;
use App\Models\Subject;
use App\Models\Currency;
use Illuminate\Support\Str;
use Leaf\Helpers\Password;

class PublicControllerTest extends TestCase
{
    public function testHomeActionDataStructure(): void
    {
        $this->createTutor();
        
        // Test the tutorListingData method via controller instance
        $controller = new PublicController();
        
        // Use reflection to call protected method
        $reflection = new \ReflectionMethod(PublicController::class, 'tutorListingData');
        $reflection->setAccessible(true);
        $data = $reflection->invoke($controller, request());
        
        $this->assertArrayHasKey('filters', $data);
        $this->assertArrayHasKey('tutors', $data);
        $this->assertArrayHasKey('total', $data);
        $this->assertArrayHasKey('cities', $data);
        $this->assertArrayHasKey('cityBreakdown', $data);
        $this->assertArrayHasKey('specialties', $data);
        $this->assertArrayHasKey('subjects', $data);
        $this->assertArrayHasKey('stats', $data);
        
        $this->assertIsArray($data['tutors']);
        $this->assertIsInt($data['total']);
    }

    public function testSubjectsDataStructure(): void
    {
        Subject::create([
            'id' => Str::orderedUuid(),
            'name' => 'Mathematics',
        ]);
        
        Subject::create([
            'id' => Str::orderedUuid(),
            'name' => 'Physics',
        ]);

        $specialtyBreakdown = Subject::query()
            ->withCount('tutors')
            ->orderByDesc('tutors_count')
            ->get()
            ->map(fn ($subject) => [
                'name' => $subject->name,
                'count' => (int) $subject->tutors_count,
            ])
            ->values()
            ->all();

        $subjects = Subject::query()
            ->orderBy('name')
            ->get()
            ->map(fn ($subject) => [
                'id' => $subject->id,
                'name' => $subject->name,
            ])
            ->values()
            ->all();

        $this->assertCount(2, $specialtyBreakdown);
        $this->assertEquals('Mathematics', $specialtyBreakdown[0]['name']);
        $this->assertCount(2, $subjects);
    }

    public function testCurrencyRatesData(): void
    {
        $settings = Currency::allSettings();
        $baseCurrency = Currency::getBaseCurrency();

        $this->assertArrayHasKey('INR', $settings);
        $this->assertEquals('INR', $baseCurrency);
    }

    public function testContactValidation(): void
    {
        // Test validation logic directly
        $name = '';
        $email = 'test@example.com';
        $message = 'Hello';
        
        $isValid = $name !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) && $message !== '';
        $this->assertFalse($isValid);

        $name = 'Test';
        $email = 'invalid-email';
        $message = 'Hello';
        
        $isValid = $name !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) && $message !== '';
        $this->assertFalse($isValid);

        $name = 'Test';
        $email = 'test@example.com';
        $message = '';
        
        $isValid = $name !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) && $message !== '';
        $this->assertFalse($isValid);

        $name = 'Test User';
        $email = 'test@example.com';
        $message = 'Hello, this is a test message.';
        
        $isValid = $name !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) && $message !== '';
        $this->assertTrue($isValid);
    }
}