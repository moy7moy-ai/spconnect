<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTenantRequest;
use App\Models\AccessLog;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function index(): JsonResponse
    {
        $tenants = Tenant::withCount('users')->get();
        return response()->json($tenants);
    }

    public function trashed(): JsonResponse
    {
        $tenants = Tenant::onlyTrashed()->withCount('users')->get();
        return response()->json($tenants);
    }

    public function store(StoreTenantRequest $request): JsonResponse
    {
        $tenant = Tenant::create($request->only('nombre', 'activo', 'modulos_activos'));

        if ($request->has('integrations')) {
            foreach ($request->integrations as $integration) {
                $tenant->integrations()->create($integration);
            }
        }

        AccessLog::create([
            'user_id'   => $request->user()->id,
            'tenant_id' => $tenant->id,
            'accion'    => 'crear_tenant',
            'metadata'  => ['nombre' => $tenant->nombre],
        ]);

        return response()->json($tenant->load('integrations'), 201);
    }

    public function show(Tenant $tenant): JsonResponse
    {
        return response()->json($tenant->load(['users', 'integrations']));
    }

    public function update(StoreTenantRequest $request, Tenant $tenant): JsonResponse
    {
        $tenant->update($request->only('nombre', 'activo', 'modulos_activos'));

        if ($request->has('integrations')) {
            $tenant->integrations()->delete();
            foreach ($request->integrations as $integration) {
                $tenant->integrations()->create($integration);
            }
        }

        AccessLog::create([
            'user_id'   => $request->user()->id,
            'tenant_id' => $tenant->id,
            'accion'    => 'editar_tenant',
            'metadata'  => ['nombre' => $tenant->nombre],
        ]);

        return response()->json($tenant->load('integrations'));
    }

    public function destroy(Request $request, Tenant $tenant): JsonResponse
    {
        $tenant->delete();

        AccessLog::create([
            'user_id'  => $request->user()->id,
            'tenant_id' => $tenant->id,
            'accion'   => 'eliminar_tenant',
            'metadata' => ['nombre' => $tenant->nombre],
        ]);

        return response()->json(null, 204);
    }

    public function restore(Request $request, int $id): JsonResponse
    {
        $tenant = Tenant::onlyTrashed()->findOrFail($id);
        $tenant->restore();

        AccessLog::create([
            'user_id'  => $request->user()->id,
            'tenant_id' => $tenant->id,
            'accion'   => 'restaurar_tenant',
            'metadata' => ['nombre' => $tenant->nombre],
        ]);

        return response()->json($tenant);
    }

    public function forceDestroy(Request $request, int $id): JsonResponse
    {
        $tenant = Tenant::onlyTrashed()->findOrFail($id);

        AccessLog::create([
            'user_id'  => $request->user()->id,
            'tenant_id' => $tenant->id,
            'accion'   => 'purgar_tenant',
            'metadata' => ['nombre' => $tenant->nombre],
        ]);

        $tenant->forceDelete();

        return response()->json(null, 204);
    }
}
