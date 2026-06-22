<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'tenant_id' => ['required', 'exists:tenants,id'],
            'nombre'    => ['required', 'string', 'max:255'],
            'email'     => ['required', 'email', 'unique:users,email'],
            'perfil'    => ['required', 'string'],
            'permisos'  => ['nullable', 'array'],
            'activo'    => ['boolean'],
        ];
    }
}
