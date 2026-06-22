<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'nombre',
        'activo',
        'modulos_activos',
    ];

    protected $casts = [
        'modulos_activos' => 'array',
        'activo' => 'boolean',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function integrations(): HasMany
    {
        return $this->hasMany(TenantIntegration::class);
    }

    public function accessLogs(): HasMany
    {
        return $this->hasMany(AccessLog::class);
    }
}
