<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class Subject extends Model
{
    use HasUuids;

    public const STATUS_ACTIVE = 'ACTIVE';
    public const STATUS_PENDING = 'PENDING';
    public const STATUS_REJECTED = 'REJECTED';

    protected $table = 'subjects';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'name',
        'description',
        'slug',
        'status',
        'proposed_by',
    ];

    public $timestamps = true;

    public function tutors(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tutor_subjects', 'subject_id', 'tutor_id');
    }

    public function proposer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'proposed_by');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Generate a unique URL slug from a subject name.
     */
    public static function makeSlug(string $name, ?string $ignoreId = null): string
    {
        $base = Str::slug($name) ?: Str::slug($name, '_');

        $slug = $base;
        $i = 2;

        while (static::query()
            ->where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $base . '-' . $i;
            $i++;
        }

        return $slug;
    }
}