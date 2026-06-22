<x-mail::message>
# Hola, {{ $nombre }}

Un administrador ha reseteado tu contraseña en **{{ $tenantNombre }}**.

Tus nuevas credenciales de acceso son:

| Campo | Valor |
|---|---|
| **Correo** | {{ $email }} |
| **Contraseña** | {{ $password }} |

<x-mail::button :url="$loginUrl">
Iniciar sesión
</x-mail::button>

Por seguridad, cambia tu contraseña después de iniciar sesión.

Gracias,
{{ config('app.name') }}
</x-mail::message>
