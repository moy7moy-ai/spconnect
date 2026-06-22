<x-mail::message>
# Bienvenido, {{ $nombre }}

Tu cuenta ha sido creada en **{{ $tenantNombre }}**.

Tus credenciales de acceso son:

| Campo | Valor |
|---|---|
| **Correo** | {{ $email }} |
| **Contraseña** | {{ $password }} |

<x-mail::button :url="$loginUrl">
Iniciar sesión
</x-mail::button>

Por seguridad, cambia tu contraseña después del primer acceso.

Gracias,
{{ config('app.name') }}
</x-mail::message>
