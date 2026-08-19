<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Model
{
    use HasUuids;

    protected $table = 'users';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'email',
        'username',
        'password_hash',
        'role',
        'is_active',
        'base_currency',
        'remember_token',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    public $timestamps = true;

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public const ROLE_STUDENT = 'STUDENT';
    public const ROLE_TUTOR = 'TUTOR';
    public const ROLE_ADMIN = 'ADMIN';

    public function isTutor(): bool
    {
        return $this->role === self::ROLE_TUTOR;
    }

    public function isStudent(): bool
    {
        return $this->role === self::ROLE_STUDENT;
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class, 'user_id');
    }

    public function tutorProfile(): HasOne
    {
        return $this->hasOne(TutorProfile::class, 'user_id');
    }

    public function tutorSubjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'tutor_subjects', 'tutor_id', 'subject_id')
            ->withPivot('rate_cents');
    }

    public function availabilitySlots(): HasMany
    {
        return $this->hasMany(AvailabilitySlot::class, 'tutor_id');
    }

    public function bookingsAsStudent(): HasMany
    {
        return $this->hasMany(Booking::class, 'student_id');
    }

    public function bookingsAsTutor(): HasMany
    {
        return $this->hasMany(Booking::class, 'tutor_id');
    }
}
