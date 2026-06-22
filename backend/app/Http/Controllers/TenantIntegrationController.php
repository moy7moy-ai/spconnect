<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\TenantIntegration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantIntegrationController extends Controller
{
    public function index(Tenant $tenant): JsonResponse
    {
        return response()->json($tenant->integrations);
    }

    public function store(Request $request, Tenant $tenant): JsonResponse
    {
        $request->validate([
            'plataforma'  => ['required', 'string'],
            'external_id' => ['required', 'string'],
            'activo'      => ['boolean'],
            'metadata'    => ['nullable', 'array'],
        ]);

        $integration = $tenant->integrations()->create($request->only(
            'plataforma',
            'external_id',
            'activo',
            'metadata'
        ));

        return response()->json($integration, 201);
    }

    public function update(Request $request, Tenant $tenant, TenantIntegration $integration): JsonResponse
    {
        $request->validate([
            'plataforma'  => ['sometimes', 'string'],
            'external_id' => ['sometimes', 'string'],
            'activo'      => ['boolean'],
            'metadata'    => ['nullable', 'array'],
        ]);

        $integration->update($request->only('plataforma', 'external_id', 'activo', 'metadata'));

        return response()->json($integration);
    }

    public function destroy(Tenant $tenant, TenantIntegration $integration): JsonResponse
    {
        $integration->delete();

        return response()->json(null, 204);
    }
}
