<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\TenantIntegrationController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\EnsureTenantAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Route;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;

// Rutas públicas
Route::post('/login', [AuthController::class, 'login']);

Route::post('/forgot-password', function (Request $request) {
    $request->validate(['email' => 'required|email']);
    Password::sendResetLink($request->only('email'));
    return response()->json(['message' => 'Si existe una cuenta con ese correo, recibirás el enlace.']);
});

Route::post('/reset-password', function (Request $request) {
    $request->validate([
        'token'    => 'required',
        'email'    => 'required|email',
        'password' => 'required|min:8|confirmed',
    ]);

    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function ($user, $password) {
            $user->forceFill(['password' => Hash::make($password)])
                 ->setRememberToken(Str::random(60));
            $user->save();
            event(new PasswordReset($user));
        }
    );

    return $status === Password::PASSWORD_RESET
        ? response()->json(['message' => 'Contraseña actualizada correctamente.'])
        : response()->json(['message' => __($status)], 422);
});

// Rutas protegidas
Route::middleware(['auth:sanctum', EnsureTenantAccess::class])->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::patch('/profile', [AuthController::class, 'updateProfile']);

    // Tenants — CRUD + papelera
    Route::get('tenants/trashed',                [TenantController::class, 'trashed']);
    Route::post('tenants/{id}/restore',          [TenantController::class, 'restore']);
    Route::delete('tenants/{id}/force',          [TenantController::class, 'forceDestroy']);
    Route::apiResource('tenants', TenantController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::apiResource('tenants.integrations', TenantIntegrationController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Usuarios — CRUD + papelera
    Route::get('users/trashed',                  [UserController::class, 'trashed']);
    Route::post('users/{id}/restore',            [UserController::class, 'restore']);
    Route::delete('users/{id}/force',            [UserController::class, 'forceDestroy']);
    Route::post('users/{user}/reset-password',   [UserController::class, 'resetPassword']);
    Route::apiResource('users', UserController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
});
