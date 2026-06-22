<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Models\AccessLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Credenciales inválidas.'], 401);
        }

        if (! $user->activo) {
            return response()->json(['message' => 'Tu cuenta está inactiva.'], 403);
        }

        if (! $user->isSuperAdmin() && $user->tenant && ! $user->tenant->activo) {
            return response()->json(['message' => 'El tenant está inactivo.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        AccessLog::create([
            'user_id'   => $user->id,
            'tenant_id' => $user->tenant_id,
            'accion'    => 'login',
            'modulo'    => null,
            'metadata'  => ['ip' => $request->ip()],
        ]);

        return response()->json([
            'token'    => $token,
            'user'     => $user->load('tenant'),
            'redirect' => $user->isSuperAdmin() ? '/admin' : '/portal',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        AccessLog::create([
            'user_id'   => $user->id,
            'tenant_id' => $user->tenant_id,
            'accion'    => 'logout',
        ]);

        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('tenant'));
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'nombre'                => 'sometimes|string|max:255',
            'current_password'      => 'required_with:password|string',
            'password'              => 'sometimes|string|min:8|confirmed',
            'password_confirmation' => 'required_with:password|string',
        ]);

        if (isset($data['password'])) {
            if (! Hash::check($data['current_password'], $user->password)) {
                return response()->json([
                    'message' => 'La contraseña actual es incorrecta.',
                    'errors'  => ['current_password' => ['La contraseña actual es incorrecta.']],
                ], 422);
            }
            $user->password = Hash::make($data['password']);
        }

        if (isset($data['nombre'])) {
            $user->nombre = $data['nombre'];
        }

        $user->save();

        return response()->json($user->load('tenant'));
    }
}
