<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Mail\PasswordResetByAdminMail;
use App\Mail\WelcomeUserMail;
use App\Models\AccessLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::with('tenant')
            ->when($request->tenant_id, fn ($q) => $q->where('tenant_id', $request->tenant_id))
            ->when($request->search, function ($q) use ($request) {
                $q->where(function ($q2) use ($request) {
                    $q2->where('nombre', 'like', "%{$request->search}%")
                       ->orWhere('email', 'like', "%{$request->search}%");
                });
            })
            ->paginate($request->input('per_page', 15));

        return response()->json($users);
    }

    public function trashed(): JsonResponse
    {
        $users = User::onlyTrashed()->with('tenant')->get();
        return response()->json($users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $plainPassword = Str::random(12);

        $user = User::create([
            'tenant_id' => $request->tenant_id,
            'nombre'    => $request->nombre,
            'email'     => $request->email,
            'password'  => Hash::make($plainPassword),
            'perfil'    => $request->perfil,
            'permisos'  => $request->permisos ?? [],
            'activo'    => $request->activo ?? true,
        ]);

        try {
            Mail::to($user->email)->send(new WelcomeUserMail($user->load('tenant'), $plainPassword));
        } catch (\Throwable $e) {
            \Log::warning('Welcome email failed: ' . $e->getMessage());
        }

        AccessLog::create([
            'user_id'   => $request->user()->id,
            'tenant_id' => $user->tenant_id,
            'accion'    => 'crear_usuario',
            'metadata'  => ['email' => $user->email, 'perfil' => $user->perfil],
        ]);

        return response()->json($user->load('tenant'), 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user->load('tenant'));
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'nombre'   => ['sometimes', 'string', 'max:255'],
            'perfil'   => ['sometimes', 'string'],
            'permisos' => ['sometimes', 'array'],
            'activo'   => ['sometimes', 'boolean'],
        ]);

        $user->update($request->only('nombre', 'perfil', 'permisos', 'activo'));

        AccessLog::create([
            'user_id'   => $request->user()->id,
            'tenant_id' => $user->tenant_id,
            'accion'    => 'editar_usuario',
            'metadata'  => ['email' => $user->email],
        ]);

        return response()->json($user->load('tenant'));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $user->delete();

        AccessLog::create([
            'user_id'   => $request->user()->id,
            'tenant_id' => $user->tenant_id,
            'accion'    => 'eliminar_usuario',
            'metadata'  => ['email' => $user->email],
        ]);

        return response()->json(null, 204);
    }

    public function restore(Request $request, int $id): JsonResponse
    {
        $user = User::onlyTrashed()->findOrFail($id);
        $user->restore();

        AccessLog::create([
            'user_id'   => $request->user()->id,
            'tenant_id' => $user->tenant_id,
            'accion'    => 'restaurar_usuario',
            'metadata'  => ['email' => $user->email],
        ]);

        return response()->json($user->load('tenant'));
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $plainPassword = Str::random(12);
        $user->update(['password' => Hash::make($plainPassword)]);

        try {
            Mail::to($user->email)->send(new PasswordResetByAdminMail($user->load('tenant'), $plainPassword));
        } catch (\Throwable $e) {
            \Log::warning('Reset password email failed: ' . $e->getMessage());
        }

        AccessLog::create([
            'user_id'   => $request->user()->id,
            'tenant_id' => $user->tenant_id,
            'accion'    => 'reset_password_usuario',
            'metadata'  => ['email' => $user->email],
        ]);

        return response()->json(['message' => 'Contraseña reseteada y enviada por correo.']);
    }

    public function forceDestroy(Request $request, int $id): JsonResponse
    {
        $user = User::onlyTrashed()->findOrFail($id);

        AccessLog::create([
            'user_id'   => $request->user()->id,
            'tenant_id' => $user->tenant_id,
            'accion'    => 'purgar_usuario',
            'metadata'  => ['email' => $user->email],
        ]);

        $user->forceDelete();

        return response()->json(null, 204);
    }
}
