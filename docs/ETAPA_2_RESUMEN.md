# Etapa 2 — Panel Admin, Componentes UI y Reset de Contraseña

**Fecha:** 22 de junio de 2026  
**Estado:** Completada ✅

---

## Objetivo de esta etapa

Construir el panel de administración completo: componentes UI reutilizables, formularios de tenants y usuarios con lógica de módulos/permisos, navegación del admin, y el flujo de reset de contraseña tanto en backend como en frontend.

---

## Componentes UI base (`frontend/components/ui/`)

### `Button.tsx`
Botón reutilizable con 4 variantes y 3 tamaños. Lee `primaryColor` de `config/theme.ts`.

| Prop | Valores |
|---|---|
| `variant` | `primary` (default) \| `secondary` \| `danger` \| `ghost` |
| `size` | `sm` \| `md` (default) \| `lg` |
| `loading` | boolean — muestra spinner y deshabilita |

### `Input.tsx`
Input con soporte para `label`, `error` (borde rojo + mensaje) y `hint` (texto gris debajo).

### `Toggle.tsx`
Switch ON/OFF. Usa `primaryColor` de `config/theme.ts` para el estado activo.

### `Table.tsx`
Tabla genérica con columnas configurables via prop `columns: Column<T>[]`. Soporta:
- Estado `loading` (spinner centrado)
- Estado vacío con mensaje personalizable
- Columna `render` para celdas personalizadas

---

## Componentes Admin (`frontend/components/admin/`)

### `ModuleToggles.tsx`
Lista todos los módulos de `config/modules.ts` como toggles ON/OFF.  
- Props: `value: Record<string, boolean>`, `onChange`  
- Se usa en `TenantForm` para activar/desactivar módulos por tenant

### `PermissionsMatrix.tsx`
Tabla de radio buttons: una fila por módulo activo, tres columnas (`Completo`, `Solo ver`, `Sin acceso`).  
- Props: `value: Record<string, PermissionLevel>`, `onChange`, `activeModules`  
- Si `activeModules` está vacío, muestra mensaje de ayuda  
- Se usa en `UserForm` — solo muestra los módulos que tiene activos el tenant seleccionado

### `IntegrationIdsForm.tsx`
Un campo de texto por cada módulo activo para capturar el `external_id` de la plataforma externa.  
- El formato del ID es libre (número, UUID, código alfanumérico, etc.)  
- Si no hay módulos activos, muestra mensaje de ayuda  
- Genera un array de `IntegrationEntry[]` compatible con `POST /api/tenants`

### `TenantForm.tsx`
Formulario completo para crear y editar tenants. Modo detectado automáticamente via prop `tenant?: Tenant`.

**Campos:**
- Nombre del tenant (texto)
- Toggle activo/inactivo
- `ModuleToggles` — módulos activos
- `IntegrationIdsForm` — IDs externos (aparecen solo si hay módulos activos)

**Comportamiento:**
- `POST /api/tenants` al crear
- `PUT /api/tenants/{id}` al editar
- Redirige a `/admin/tenants` al guardar

### `UserForm.tsx`
Formulario para crear nuevos usuarios dentro de un tenant.

**Campos:**
- Selector de tenant (cargado de `GET /api/tenants`)
- Nombre completo
- Correo electrónico (hint: la contraseña se genera automáticamente)
- Selector de perfil — opciones de `config/roles.ts` (excluye `super_admin`)
- `PermissionsMatrix` — permisos por módulo (filtra por módulos activos del tenant elegido)
- Toggle activo/inactivo

**Comportamiento:**
- `POST /api/users` al guardar
- Laravel genera contraseña aleatoria de 12 caracteres y envía `WelcomeUserMail`
- Muestra pantalla de éxito y redirige a `/admin/usuarios`

---

## Páginas del panel admin

### Layout admin (`app/admin/layout.tsx`)
Header fijo con navegación y botón de cerrar sesión. Aplica a todas las rutas bajo `/admin/`.

**Navegación:**
- Dashboard → `/admin/dashboard`
- Tenants → `/admin/tenants`
- Usuarios → `/admin/usuarios`

Muestra el nombre del usuario autenticado. El botón "Cerrar sesión" llama a `POST /api/logout` y redirige a `/auth/login`.

### `/admin/tenants` — Lista de tenants
Tabla con columnas: Nombre, Estado (badge), Módulos activos, Conteo de usuarios, botón Editar.  
Botón "+ Nuevo tenant" → `/admin/tenants/nuevo`

### `/admin/tenants/nuevo` — Crear tenant
Renderiza `TenantForm` sin prop `tenant`.

### `/admin/tenants/[id]` — Editar tenant
Carga el tenant desde `GET /api/tenants/{id}` y renderiza `TenantForm tenant={tenant}`.  
Muestra spinner mientras carga.

### `/admin/usuarios` — Lista de usuarios
Tabla con columnas: Nombre, Correo, Tenant, Perfil (badge), Estado (badge), botón Editar.  
Botón "+ Nuevo usuario" → `/admin/usuarios/nuevo`

### `/admin/usuarios/nuevo` — Crear usuario
Carga la lista de tenants primero, luego renderiza `UserForm tenants={tenants}`.

---

## Reset de contraseña

### Backend — 2 rutas nuevas en `routes/api.php`

#### `POST /api/forgot-password`
- Recibe `{ email }`
- Llama a `Password::sendResetLink()` — usa el sistema nativo de Laravel
- Siempre responde con el mismo mensaje (no revela si el email existe)

#### `POST /api/reset-password`
- Recibe `{ token, email, password, password_confirmation }`
- Llama a `Password::reset()` — valida el token y actualiza la contraseña con bcrypt
- Dispara el evento `PasswordReset` de Laravel

### Frontend — página nueva

#### `/auth/reset-password`
- Lee `token` y `email` de los query params (los pone Laravel en el enlace del email)
- Formulario con nueva contraseña y confirmación
- Al éxito muestra mensaje y redirige a `/auth/login` en 2 segundos
- Usa `Suspense` para compatibilidad con `useSearchParams` en Next.js 14

---

## Email de bienvenida (Mailable)

### `app/Mail/WelcomeUserMail.php`
Mailable con plantilla Markdown que se envía al crear un usuario.

**Contenido del email:**
- Nombre del usuario
- Nombre del tenant
- Correo de acceso
- Contraseña en texto plano (solo en este email inicial)
- Botón con enlace directo a `/auth/login`

**Cuándo se envía:** `POST /api/users` → `UserController@store` genera la contraseña con `Str::random(12)`, crea el usuario con `Hash::make($plainPassword)`, y luego llama `Mail::to($user->email)->send(new WelcomeUserMail($user, $plainPassword))`.

**Driver en local:** `MAIL_MAILER=log` — el email no se envía realmente, se escribe en `storage/logs/laravel.log` para desarrollo.

---

## Rutas API — estado actual (17 rutas)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/login` | Pública | Login |
| POST | `/api/forgot-password` | Pública | Solicitar reset |
| POST | `/api/reset-password` | Pública | Aplicar reset |
| POST | `/api/logout` | Sanctum | Logout |
| GET | `/api/me` | Sanctum | Usuario autenticado |
| GET | `/api/tenants` | Sanctum | Listar tenants |
| POST | `/api/tenants` | Sanctum | Crear tenant |
| GET | `/api/tenants/{id}` | Sanctum | Ver tenant |
| PUT/PATCH | `/api/tenants/{id}` | Sanctum | Editar tenant |
| GET | `/api/tenants/{id}/integrations` | Sanctum | Listar integraciones |
| POST | `/api/tenants/{id}/integrations` | Sanctum | Crear integración |
| PUT/PATCH | `/api/tenants/{id}/integrations/{iid}` | Sanctum | Editar integración |
| DELETE | `/api/tenants/{id}/integrations/{iid}` | Sanctum | Eliminar integración |
| GET | `/api/users` | Sanctum | Listar usuarios |
| POST | `/api/users` | Sanctum | Crear usuario |
| GET | `/api/users/{id}` | Sanctum | Ver usuario |
| PUT/PATCH | `/api/users/{id}` | Sanctum | Editar usuario |

---

## Árbol de archivos nuevos en esta etapa

```
frontend/
├── app/
│   ├── admin/
│   │   ├── layout.tsx                  ← nav + header del panel
│   │   ├── tenants/
│   │   │   ├── page.tsx                ← lista de tenants
│   │   │   ├── nuevo/page.tsx          ← crear tenant
│   │   │   └── [id]/page.tsx           ← editar tenant
│   │   └── usuarios/
│   │       ├── page.tsx                ← lista de usuarios
│   │       └── nuevo/page.tsx          ← crear usuario
│   └── auth/
│       └── reset-password/page.tsx     ← nueva contraseña
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Toggle.tsx
│   │   └── Table.tsx
│   └── admin/
│       ├── TenantForm.tsx
│       ├── UserForm.tsx
│       ├── ModuleToggles.tsx
│       ├── PermissionsMatrix.tsx
│       └── IntegrationIdsForm.tsx

backend/
├── app/
│   └── Mail/
│       └── WelcomeUserMail.php
├── resources/views/emails/
│   └── welcome-user.blade.php
└── routes/
    └── api.php                         ← +2 rutas: forgot/reset password
```

---

## Flujo completo verificado hasta esta etapa

```
1. http://localhost:3000              → redirige a /auth/login
2. Login superadmin@auth.local        → token guardado en localStorage
3. Redirige a /admin                  → redirige a /admin/dashboard
4. Dashboard con nav header           → links a Tenants y Usuarios
5. /admin/tenants/nuevo               → formulario con ModuleToggles + IntegrationIdsForm
6. /admin/usuarios/nuevo              → formulario con PermissionsMatrix filtrada por tenant
7. /auth/forgot-password              → solicita enlace de reset
8. /auth/reset-password?token=&email= → aplica nueva contraseña
```

---

## Pendiente para etapa 3

- [ ] Página de editar usuario (`/admin/usuarios/[id]`)
- [ ] Página `/portal` con módulos según permisos del usuario
- [ ] Configurar SMTP real para emails en producción (Mailgun, SES, etc.)
- [ ] Logout automático al expirar el token de Sanctum
- [ ] Validación visual de formularios (errores por campo, no solo mensaje global)
- [ ] Confirmación antes de desactivar tenant/usuario
- [ ] Preparación para Docker (fase futura)
