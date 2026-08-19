<?php

namespace App\Services;

use Illuminate\Support\Str;

/**
 * Generates Jitsi Meet meeting links for lessons.
 *
 * Simple MVP integration: each booking gets a deterministic room
 * identifier based on the booking UUID so both the student and the
 * tutor always join the same room without needing a backend room
 * registry or a Jitsi API key.
 */
class JitsiService
{
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim((string) (_env('JITSI_BASE_URL') ?: 'https://meet.jit.si'), '/');
    }

    /**
     * Build a meeting URL for a booking.
     */
    public function meetingUrl(string $bookingId, ?string $subjectName = null): string
    {
        $room = $this->roomName($bookingId);

        $slug = $subjectName
            ? Str::slug($subjectName)
            : 'lesson';

        return "{$this->baseUrl}/Larnr-{$slug}-{$room}";
    }

    /**
     * Deterministic short room token for a booking.
     */
    public function roomName(string $bookingId): string
    {
        return strtoupper(substr(md5($bookingId), 0, 8));
    }
}