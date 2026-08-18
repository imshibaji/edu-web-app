<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TutorProfile extends Model
{
    protected $table = 'tutor_profiles';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $primaryKey = 'user_id';

    protected $fillable = [
        'user_id',
        'full_name',
        'headline',
        'bio',
        'hourly_rate',
        'currency',
        'is_verified',
        'city',
        'format',
        'experience_level',
        'rating',
        'avatar_url',
        'stripe_account_id',
        'payout_method',
        'payout_details',
    ];

    public $timestamps = true;

    protected $casts = [
        'hourly_rate' => 'integer',
        'is_verified' => 'boolean',
        'rating' => 'float',
        'payout_details' => 'array',
    ];

    public const FORMAT_ONLINE = 'ONLINE';
    public const FORMAT_IN_PERSON = 'IN_PERSON';
    public const FORMAT_BOTH = 'BOTH';

    public const LEVEL_ENTRY = 'ENTRY';
    public const LEVEL_MID = 'MID';
    public const LEVEL_SENIOR = 'SENIOR';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'tutor_subjects', 'tutor_id', 'subject_id')
            ->withPivot('rate_cents');
    }

    public function rateDisplay(): string
    {
        return '$' . number_format($this->hourly_rate / 100, 2);
    }

    public function hasStripeAccount(): bool
    {
        return !empty($this->stripe_account_id);
    }

    public function isPayoutReady(): bool
    {
        return $this->hasStripeAccount() && !empty($this->payout_method);
    }
}
