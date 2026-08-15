<?php

namespace App\Console;

use Leaf\Sprout\Command;
use Illuminate\Support\Str;
use Leaf\Helpers\Password;

class SeedCommand extends Command
{
    protected $signature = 'app:seed';
    protected $description = 'Seed Larnr with demo data (admin, student, tutors, subjects, slots)';

    protected $subjects = [
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'English',
        'Hindi',
        'History',
        'Geography',
        'Economics',
        'Computer Science',
        'Coding & Programming',
        'Music',
        'IELTS Prep',
        'SAT Prep',
        'Accounting',
    ];

    protected $tutors = [
        ['Ananya Chatterjee', 'tutor1@larnr.app', 'IIT Graduate | Math & Physics Mentor', 'Kolkata', 'BOTH', 'SENIOR', 25000, 4.9, ['Mathematics', 'Physics'], 'INR'],
        ['Rahul Mehta', 'tutor2@larnr.app', 'Ex-Banker teaching Economics & Finance', 'Delhi', 'ONLINE', 'MID', 20000, 4.7, ['Economics', 'Accounting'], 'INR'],
        ['Priya Sharma', 'tutor3@larnr.app', 'English & Creative Writing Coach', 'Mumbai', 'IN_PERSON', 'SENIOR', 22000, 4.8, ['English', 'IELTS Prep'], 'INR'],
        ['Arjun Nair', 'tutor4@larnr.app', 'Full-Stack Developer | CS & Coding', 'Bangalore', 'ONLINE', 'SENIOR', 30000, 4.9, ['Computer Science', 'Coding & Programming'], 'INR'],
        ['Sneha Iyer', 'tutor5@larnr.app', 'Chemistry PhD | JEE & NEET Specialist', 'Chennai', 'BOTH', 'SENIOR', 28000, 5.0, ['Chemistry', 'Biology'], 'INR'],
        ['Vikram Singh', 'tutor6@larnr.app', 'Mechanical Engineer | Physics & Maths', 'Pune', 'ONLINE', 'MID', 18000, 4.5, ['Mathematics', 'Physics'], 'INR'],
        ['Fatima Khan', 'tutor7@larnr.app', 'Biology & Medical Entrance Coach', 'Hyderabad', 'BOTH', 'MID', 19000, 4.6, ['Biology', 'Chemistry'], 'INR'],
        ['Rohan Das', 'tutor8@larnr.app', 'History & Political Science Educator', 'Kolkata', 'IN_PERSON', 'ENTRY', 12000, 4.4, ['History', 'Geography'], 'INR'],
        ['Neha Gupta', 'tutor9@larnr.app', 'Hindi Literature & Language Teacher', 'Delhi', 'IN_PERSON', 'ENTRY', 10000, 4.3, ['Hindi', 'English'], 'INR'],
        ['Aditya Menon', 'tutor10@larnr.app', 'Music & Piano Instructor', 'Bangalore', 'IN_PERSON', 'ENTRY', 1500, 4.7, ['Music'], 'EUR'],
        ['Kavya Reddy', 'tutor11@larnr.app', 'SAT & GRE Verbal Expert', 'Hyderabad', 'ONLINE', 'MID', 21000, 4.8, ['SAT Prep', 'English'], 'INR'],
        ['Manish Patel', 'tutor12@larnr.app', 'Accounting & Business Studies Tutor', 'Ahmedabad', 'BOTH', 'MID', 17000, 4.5, ['Accounting', 'Economics'], 'INR'],
        ['Ishita Bose', 'tutor13@larnr.app', 'Computer Science Grad | Math Olympiad Coach', 'Mumbai', 'ONLINE', 'SENIOR', 2400, 4.8, ['Mathematics', 'Coding & Programming'], 'GBP'],
        ['Farhan Ali', 'tutor14@larnr.app', 'Geography & Environmental Science', 'Pune', 'ONLINE', 'ENTRY', 11000, 4.2, ['Geography', 'Biology'], 'INR'],
    ];

    protected function handle()
    {
        $dbPath = \StoragePath('database/database.sqlite');

        if (!file_exists($dbPath)) {
            $this->error('Database not found. Run `php leaf app:init` first.');
            return 1;
        }

        $pdo = new \PDO('sqlite:' . $dbPath);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->beginTransaction();

        try {
            $now = gmdate('Y-m-d H:i:s');

            $subjectIds = [];
            $insertSubject = $pdo->prepare('INSERT INTO subjects (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)');
            foreach ($this->subjects as $subject) {
                $id = (string) Str::orderedUuid();
                $insertSubject->execute([$id, $subject, $now, $now]);
                $subjectIds[$subject] = $id;
            }

            $insertUser = $pdo->prepare('INSERT INTO users (id, email, password_hash, role, is_active, base_currency, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
            $insertStudent = $pdo->prepare('INSERT INTO student_profiles (user_id, full_name, phone_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
            $insertTutor = $pdo->prepare('INSERT INTO tutor_profiles (user_id, full_name, headline, bio, hourly_rate, currency, is_verified, city, format, experience_level, rating, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $insertTutorSubject = $pdo->prepare('INSERT INTO tutor_subjects (tutor_id, subject_id, rate_cents) VALUES (?, ?, ?)');
            $insertSlot = $pdo->prepare('INSERT INTO availability_slots (id, tutor_id, start_time, end_time, is_booked, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)');
            $insertActivity = $pdo->prepare('INSERT INTO user_activities (id, user_id, type, description, ip_address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');

            $password = Password::hash('password');

            $adminId = (string) Str::orderedUuid();
            $insertUser->execute([$adminId, 'admin@larnr.app', $password, 'ADMIN', 1, 'INR', $now, $now]);
            $this->writeln('  <info>+</info> admin@larnr.app (ADMIN, password: password)');

            $studentId = (string) Str::orderedUuid();
            $insertUser->execute([$studentId, 'demo@larnr.app', $password, 'STUDENT', 1, 'INR', $now, $now]);
            $insertStudent->execute([$studentId, 'Demo Student', '+91 90000 00000', $now, $now]);
            $this->writeln('  <info>+</info> demo@larnr.app (STUDENT, password: password)');

            $tutorIds = [];

            foreach ($this->tutors as $index => [$name, $email, $headline, $city, $format, $level, $rate, $rating, $subjects, $currency]) {
                $tutorId = (string) Str::orderedUuid();
                $tutorIds[] = $tutorId;
                $verified = in_array($level, ['SENIOR'], true) || $rating >= 4.6 ? 1 : 0;
                $insertUser->execute([$tutorId, $email, $password, 'TUTOR', 1, $currency, $now, $now]);
                $insertTutor->execute([
                    $tutorId, $name, $headline,
                    "Passionate $level educator from $city. Focused on making complex topics simple, with structured lesson plans and regular progress reviews.",
                    $rate, $currency, $verified, $city, $format, $level, $rating, $now, $now,
                ]);

                foreach ($subjects as $subject) {
                    $insertTutorSubject->execute([$tutorId, $subjectIds[$subject], $rate]);
                }

                for ($day = 1; $day <= 3; $day++) {
                    $start = (new \DateTime('now', new \DateTimeZone('UTC')))
                        ->modify("+{$day} days")
                        ->setTime(10 + $day * 3, 0, 0);
                    $end = (clone $start)->modify('+1 hour');
                    $insertSlot->execute([
                        (string) Str::orderedUuid(),
                        $tutorId,
                        $start->format('Y-m-d H:i:s'),
                        $end->format('Y-m-d H:i:s'),
                        $now,
                        $now,
                    ]);
                }

                $this->writeln("  <info>+</info> {$email} (TUTOR, {$city}, {$format}, {$level})");
            }

            $seedActivity = function (string $userId, string $type, string $description, string $at, ?string $ip = '127.0.0.1') use ($insertActivity, $now) {
                $insertActivity->execute([(string) Str::orderedUuid(), $userId, $type, $description, $ip, $at, $now]);
            };

            $seedActivity($adminId, 'LOGIN', 'Signed in', $now);
            $seedActivity($studentId, 'LOGIN', 'Signed in', $now);
            $seedActivity($studentId, 'TRIAL_BOOKED', 'Booked a trial lesson with Ananya Chatterjee', $now);

            foreach ($tutorIds as $tutorId) {
                $seedActivity($tutorId, 'LOGIN', 'Signed in', $now);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            $this->error('Seeding failed: ' . $e->getMessage());
            return 1;
        }

        $this->info('Seeding complete.');
        return 0;
    }
}
