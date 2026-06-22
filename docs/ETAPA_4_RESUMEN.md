# Etapa 4 — Toasts, Perfil, Búsqueda y Reset de Contraseña

**Fecha:** 22 de junio de 2026  
**Estado:** Completada ✅

---

## Objetivo de esta etapa

Mejorar la experiencia de uso con feedback visual inmediato (toasts), permitir que cada usuario gestione su propio perfil, agregar búsqueda en las tablas, y dar al super admin la capacidad de resetear contraseñas sin comprometer la seguridad.

---

## 1. Sistema de toasts — `context/ToastContext.tsx`

Contexto global de notificaciones. Un solo provider envuelve toda la app desde `app/layout.tsx`.

### API

```typescript
const { addToast } = useToast()

addToast('Mensaje de éxito')                  // tipo 'success' (default)
addToast('Algo salió mal', 'error')           // tipo 'error'  — fondo rojo
addToast('Operación completada', 'info')      // tipo 'info'   — fondo gris oscuro
```

### Comportamiento

- Aparece en la esquina inferior derecha
- Se auto-cierra a los 4 segundos
- Se pueden apilar múltiples toasts simultáneos
- Icono diferenciado por tipo: ✓ / ✕ / ℹ

### Dónde se dispara

| Acción | Mensaje | Tipo |
|---|---|---|
| Crear tenant | "Tenant creado correctamente" | success |
| Editar tenant | "Cambios guardados correctamente" | success |
| Crear usuario | "Usuario creado. Las credenciales fueron enviadas por correo." | success |
| Editar usuario | "Usuario actualizado correctamente" | success |
| Activar/desactivar usuario | "Usuario activado / desactivado" | success |
| Eliminar (soft delete) | `"NombreX" enviado a la papelera` | success |
| Restaurar | `"NombreX" restaurado correctamente` | success |
| Purgar | `"NombreX" purgado permanentemente` | info |
| Resetear contraseña | "Nueva contraseña enviada al correo del usuario" | success |
| Actualizar perfil | "Perfil actualizado correctamente" | success |

---

## 2. Página de perfil

Disponible tanto en el panel admin como en el portal. El nombre del usuario en el header es un link a su perfil.

### Rutas

| Ruta | Descripción |
|---|---|
| `/admin/perfil` | Perfil del super admin |
| `/portal/perfil` | Perfil del usuario de tenant |

### Endpoint backend

```
PATCH /api/profile
```

**Payload:**
```json
{
  "nombre": "Nuevo nombre",
  "current_password": "contraseña_actual",
  "password": "nueva_contraseña",
  "password_confirmation": "nueva_contraseña"
}
```

**Reglas:**
- `nombre` — opcional, se actualiza solo si se envía
- `current_password` — requerido únicamente si se envía `password`
- Si `current_password` no coincide → 422 con error por campo
- Si no se envían campos de contraseña → solo se actualiza el nombre

**Implementación en `AuthController@updateProfile`:**
- Valida `current_password` con `Hash::check` antes de actualizar
- Nunca expone la contraseña anterior ni la nueva en la respuesta
- Devuelve el usuario actualizado con su tenant

### Frontend

- Formulario con campo `nombre` y sección colapsada de cambio de contraseña
- Errores por campo via `ApiError.fields`
- Después de guardar: llama `refresh()` del hook `useAuth` para actualizar el nombre en el header sin recargar la página
- Toast de confirmación

---

## 3. Búsqueda en tablas

Filtro client-side (sobre los datos ya cargados), sin llamadas extra al backend.

### Tenants — `app/admin/tenants/page.tsx`

- Input "Buscar tenant…" filtra por `nombre`
- Mensaje vacío diferenciado: *"Sin resultados para esa búsqueda."* vs *"No hay tenants registrados aún."*

### Usuarios — `app/admin/usuarios/page.tsx`

- Input "Buscar por nombre o correo…" filtra por `nombre` OR `email`
- Se combina con el filtro de tenant existente (ambos aplican simultáneamente)
- Mensaje vacío diferenciado según cuál filtro está activo

---

## 4. Reset de contraseña por el admin

El super admin puede forzar un reset de contraseña de cualquier usuario **sin ver la nueva contraseña en ningún momento**.

### Flujo

```
Admin hace clic "Resetear contraseña"
  → ConfirmDialog advierte que la contraseña actual deja de funcionar
    → POST /api/users/{id}/reset-password
      → Backend genera Str::random(12)
      → Hashea y guarda en DB
      → Envía PasswordResetByAdminMail al correo del usuario
      → Registra en access_logs con acción 'reset_password_usuario'
        → Toast "Nueva contraseña enviada al correo del usuario"
```

### Por qué es seguro

- El admin nunca ve la contraseña — ni en pantalla, ni en logs de aplicación
- La contraseña antigua se invalida inmediatamente al guardar la nueva
- El usuario recibe sus nuevas credenciales directamente en su correo
- La acción queda registrada en `access_logs` (quién la hizo, a quién)

### Backend — nuevos archivos

**`app/Mail/PasswordResetByAdminMail.php`**
- Subject: *"Tu contraseña ha sido reseteada"*
- Distinto de `WelcomeUserMail` para que el usuario entienda el contexto

**`resources/views/emails/password-reset-by-admin.blade.php`**
- Mismo formato de tabla de credenciales
- Mensaje: *"Un administrador ha reseteado tu contraseña en [Tenant]"*

**Nueva ruta:**
```
POST /api/users/{user}/reset-password
```

### Frontend — `components/admin/EditUserForm.tsx`

- Nuevo bloque "Contraseña" con botón **"Resetear contraseña"** (variante secondary)
- `ConfirmDialog` específico: advierte que el correo actual recibirá las nuevas credenciales
- Toast de éxito al completar

---

## Árbol de archivos nuevos/modificados en esta etapa

```
backend/
├── app/Http/Controllers/
│   ├── AuthController.php            ← MODIFICADO: +updateProfile
│   └── UserController.php            ← MODIFICADO: +resetPassword, +import PasswordResetByAdminMail
├── app/Mail/
│   └── PasswordResetByAdminMail.php  ← NUEVO
├── resources/views/emails/
│   └── password-reset-by-admin.blade.php ← NUEVO
└── routes/api.php                    ← MODIFICADO: +PATCH /profile, +POST /users/{user}/reset-password

frontend/
├── context/
│   └── ToastContext.tsx              ← NUEVO
├── app/
│   ├── layout.tsx                    ← MODIFICADO: +ToastProvider
│   ├── admin/
│   │   ├── layout.tsx                ← MODIFICADO: nombre → link a /admin/perfil
│   │   ├── perfil/page.tsx           ← NUEVO
│   │   ├── tenants/page.tsx          ← MODIFICADO: +búsqueda, +toast eliminar
│   │   ├── tenants/papelera/page.tsx ← MODIFICADO: +toast restaurar/purgar
│   │   └── usuarios/
│   │       ├── page.tsx              ← MODIFICADO: +búsqueda, +toast eliminar
│   │       └── papelera/page.tsx     ← MODIFICADO: +toast restaurar/purgar
│   └── portal/
│       ├── layout.tsx                ← MODIFICADO: nombre → link a /portal/perfil
│       └── perfil/page.tsx           ← NUEVO
└── components/admin/
    ├── TenantForm.tsx                ← MODIFICADO: +toast éxito
    ├── UserForm.tsx                  ← MODIFICADO: +toast, -estado success inline
    └── EditUserForm.tsx              ← MODIFICADO: +toast, +resetear contraseña
```

---

## Rutas API — nuevas en esta etapa

| Método | Ruta | Descripción |
|---|---|---|
| `PATCH` | `/api/profile` | Actualizar nombre y/o contraseña propios |
| `POST` | `/api/users/{id}/reset-password` | Resetear contraseña de un usuario (admin) |

---

## Pendiente para etapa 5 (o según prioridad)

- [ ] Paginación en listas grandes (backend + frontend)
- [ ] Configurar SMTP real (Mailgun / SES) para staging/producción
- [ ] Logout automático cuando el token de Sanctum expira
- [ ] Preparación para Docker

---

## Nota de arquitectura — Extensión a dashboards

Este módulo de autenticación está diseñado como **base reutilizable**. Solo cambian 3 archivos entre proyectos:

```
config/modules.ts   → define los bloques/secciones del sistema
config/roles.ts     → los roles del negocio
config/theme.ts     → colores y nombre de la empresa
```

### Aplicación a dashboards con APIs externas

El sistema de permisos ya existente permite construir dashboards donde cada usuario ve solo los bloques que le corresponden:

```typescript
// Cualquier bloque del dashboard usa el mismo hook
const { level, canEdit } = usePermissions()

// El bloque se muestra, oculta o pone en solo-lectura según el permiso
if (level('modulo_ventas') === 'none') return null
```

Las integraciones con APIs externas (CRMs, ERPs, servicios de analítica, etc.) van en el backend Laravel como nuevos endpoints que el frontend consume con el mismo `api.get()` ya configurado. El token Sanctum protege cada llamada automáticamente.

```php
// Ejemplo de endpoint que integra una API externa
Route::get('/ventas/resumen', function () {
    $data = Http::withToken(config('services.crm.key'))
                ->get('https://api.crm.com/summary');
    return $data->json();
});
```

**El módulo de auth resuelve: quién entra y qué puede ver.**  
**El dashboard resuelve: qué información se muestra y cómo.**  
Ambas capas son completamente independientes en diseño y tecnología.
