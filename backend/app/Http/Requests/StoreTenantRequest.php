<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'nombre'                  => ['required', 'string', 'max:255'],
            'activo'                  => ['boolean'],
            'modulos_activos'         => ['nullable', 'array'],
            'integrations'            => ['nullable', 'array'],
            'integrations.*.plataforma'  => ['required_with:integrations', 'string'],
            'integrations.*.external_id' => ['required_with:integrations', 'string'],
            'integrations.*.activo'      => ['boolean'],
            'integrations.*.metadata'    => ['nullable', 'array'],
        ];
    }
}
