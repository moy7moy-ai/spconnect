<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantIntegration extends Model
{
    protected $fillable = [
        'tenant_id',
        'plataforma',
        'external_id',
        'activo',
        'metadata',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'metadata' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
