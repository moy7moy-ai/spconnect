<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        if (! $user->activo) {
            return response()->json(['message' => 'Cuenta inactiva.'], 403);
        }

        if (! $user->tenant || ! $user->tenant->activo) {
            return response()->json(['message' => 'Tenant inactivo o no encontrado.'], 403);
        }

        return $next($request);
    }
}
