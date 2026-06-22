# Etapa 3 — Edición de usuarios, Portal, Mejoras de UX y Soft Deletes

**Fecha:** 22 de junio de 2026  
**Estado:** Completada ✅

---

## Objetivo de esta etapa

Completar el ciclo de administración de usuarios (edición), construir el portal del usuario final con módulos según permisos, mejorar la robustez de la app con auto-logout, validación por campo y modal de confirmación, e implementar un sistema de borrado seguro en dos fases (soft delete + purga definitiva).

---

## 1. Manejo de errores mejorado — `lib/api.ts`

### Clase `ApiError`

Reemplaza el `throw new Error` genérico anterior. Permite distinguir entre error global y errores por campo.

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string[]>  // errores 422 de Laravel
  ) { ... }

  fieldError(key: string): string | undefined  // primer error de un campo
}
```

### Auto-logout en 401

Cuando cualquier request recibe un 401 (token expirado o inválido):
1. Elimina `auth_token` de `localStorage`
2. Redirige a `/auth/login` via `window.location.href`

No requiere intervención del usuario ni lógica adicional en los componentes.

### Manejo de 422 (validación Laravel)

Laravel devuelve errores de validación con esta estructura:
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "nombre": ["The nombre field is required."],
    "email": ["The email has already been taken."]
  }
}
```

`ApiError` captura el objeto `errors` en la propiedad `fields`. Los formularios lo usan para mostrar el error bajo cada campo específico.

---

## 2. `ConfirmDialog` — `components/ui/ConfirmDialog.tsx`

Modal de confirmación usando el elemento nativo `<dialog>` de HTML5.

**Props:**

| Prop | Tipo | Descripción |
|---|---|---|
| `open` | boolean | Controla si el modal está visible |
| `title` | string | Título del modal |
| `description` | string? | Texto explicativo opcional |
| `confirmLabel` | string | Texto del botón de confirmar (default: "Confirmar") |
| `cancelLabel` | string | Texto del botón de cancelar (default: "Cancelar") |
| `danger` | boolean | Usa variante roja en el botón de confirmar |
| `loading` | boolean | Deshabilita botones y muestra spinner |
| `onConfirm` | fn | Callback al confirmar |
| `onCancel` | fn | Callback al cancelar o presionar Escape |

Usa `useEffect` + `dialogRef.current.showModal()` para el comportamiento nativo (backdrop, cierre con Escape).

---

## 3. Editar usuario

### `components/admin/EditUserForm.tsx`

Formulario completo para editar un usuario existente.

**Campos editables:**
- Nombre completo (con error por campo)
- Perfil / Rol (selector con opciones de `config/roles.ts`)
- `PermissionsMatrix` filtrada por módulos activos del tenant
- Estado activo/inactivo — con botón separado y `ConfirmDialog`

**Campos de solo lectura (mostrados como info):**
- Correo electrónico
- Nombre del tenant

**Comportamiento de validación:**
- Errores 422 de Laravel → se muestran bajo cada campo con `ApiError.fields`
- Error global (500, red, etc.) → se muestra en banner rojo al final del formulario

**Confirmación al desactivar/activar:**
- El botón "Desactivar" / "Activar" abre un `ConfirmDialog` antes de hacer el PATCH
- El dialog describe el efecto: "El usuario no podrá iniciar sesión hasta que se reactive"
- Variante `danger` cuando se va a desactivar, `secondary` cuando se va a activar

### `app/admin/usuarios/[id]/page.tsx`

- Carga el usuario desde `GET /api/users/{id}` al montar
- Muestra spinner mientras carga
- Renderiza `EditUserForm` con los datos del usuario
- Muestra el email como subtítulo de la página

---

## 4. Portal del usuario final

### `app/portal/layout.tsx`

Layout independiente del admin. Header con:
- Nombre del portal (`THEME.portalName`)
- Badge con el nombre del tenant del usuario autenticado
- Nombre del usuario y botón "Cerrar sesión"

### `app/portal/page.tsx`

Muestra los módulos activos del tenant del usuario como tarjetas.

**Lógica de visualización:**
1. Filtra `MODULES` de `config/modules.ts` por los que el tenant tiene activos (`modulos_activos`)
2. Para cada módulo activo, obtiene el nivel de permiso del usuario via `usePermissions().level()`
3. Renderiza una `ModuleCard` por módulo

**Niveles de permiso — badge visual:**

| Nivel | Badge | Color |
|---|---|---|
| `full` | Acceso completo | Verde |
| `ver` | Solo lectura | Azul |
| `none` | Sin acceso | Gris, tarjeta opaca |

**Casos especiales:**
- Super admin → muestra mensaje con link al panel de admin (no tiene módulos de tenant)
- Sin módulos activos → mensaje informativo

---

## 5. Soft Deletes — borrado en dos fases

### Concepto

El borrado de tenants y usuarios ocurre en dos pasos deliberados para evitar pérdidas accidentales de datos:

```
Eliminar (panel)   →  deleted_at = NOW()  →  desaparece de listas activas
                                               (recuperable desde papelera)

Purgar (papelera)  →  DELETE físico        →  eliminado permanentemente de MySQL
                                               (irreversible — requiere confirmación)
```

### Backend

**Migración:** columna `deleted_at` (nullable timestamp) añadida a `tenants` y `users`.

**Modelos:** trait `SoftDeletes` en `Tenant` y `User`. Eloquent filtra automáticamente los registros con `deleted_at != null` en todas las queries normales.

**Nuevos endpoints (6 rutas):**

| Método | Ruta | Acción |
|---|---|---|
| `DELETE` | `/api/tenants/{id}` | Soft delete — pone `deleted_at` |
| `GET` | `/api/tenants/trashed` | Lista tenants en papelera |
| `POST` | `/api/tenants/{id}/restore` | Restaura — borra `deleted_at` |
| `DELETE` | `/api/tenants/{id}/force` | Purga — `forceDelete()` físico |
| `DELETE` | `/api/users/{id}` | Soft delete usuario |
| `GET` | `/api/users/trashed` | Lista usuarios en papelera |
| `POST` | `/api/users/{id}/restore` | Restaura usuario |
| `DELETE` | `/api/users/{id}/force` | Purga usuario definitivamente |

**Nota de rutas:** `trashed` se declara **antes** de `{id}` en `api.php` para que Laravel no lo interprete como un ID numérico.

**Logs de acceso:** cada operación queda registrada en `access_logs` con acción `eliminar_tenant`, `restaurar_tenant`, `purgar_tenant` (y equivalentes para usuarios).

**Reset completo para nuevo proyecto:**
```bash
php artisan migrate:fresh --seed
# Borra todas las tablas, las recrea y deja solo el superadmin
```

### Frontend

**Listas activas** (`/admin/tenants`, `/admin/usuarios`):
- Botón **"Eliminar"** (rojo) en cada fila → abre `ConfirmDialog` antes del DELETE
- El dialog advierte: *"pasará a la papelera, podrás restaurarlo"*
- Botón **"Papelera"** en el header de la lista → navega a la vista de papelera

**Papelera** (`/admin/tenants/papelera`, `/admin/usuarios/papelera`):
- Tabla con nombre, fecha de eliminación (formateada en `es-MX`) y acciones
- Botón **"Restaurar"** → `POST /restore` — el registro vuelve a la lista activa
- Botón **"Purgar"** → abre `ConfirmDialog` con advertencia **irreversible** → `DELETE /force`
- Botón "← Volver" al header

---

## 6. Validación por campo en formularios

### `TenantForm.tsx` actualizado

Agrega `fieldErrors` state. Al recibir un `ApiError` con `fields`:
- Extrae el primer mensaje de cada campo
- Lo pasa como prop `error` al componente `Input` correspondiente
- El `Input` muestra el mensaje en rojo bajo el campo y colorea el borde

---

## Flujo completo de la aplicación (Etapas 1–3)

```
/ → /auth/login
     │
     ├─ superadmin@auth.local → /admin/dashboard
     │       ├─ /admin/tenants
     │       │       ├─ crear / editar tenant  → módulos + IDs externos
     │       │       ├─ eliminar               → soft delete + ConfirmDialog
     │       │       └─ papelera               → restaurar | purgar definitivo
     │       └─ /admin/usuarios
     │               ├─ crear usuario          → rol + permisos + email con credenciales
     │               ├─ editar usuario         → nombre, rol, permisos, activar/desactivar
     │               ├─ eliminar               → soft delete + ConfirmDialog
     │               └─ papelera               → restaurar | purgar definitivo
     │
     └─ usuario@tenant.com → /portal
             └─ tarjetas de módulos con nivel de acceso (full / ver / none)

/auth/forgot-password → email → /auth/reset-password?token=&email=
```

---

## Comportamientos de seguridad activos

| Comportamiento | Implementación |
|---|---|
| Sesión expirada | 401 → auto-logout + redirect a login |
| Ruta protegida sin token | `AuthGuard` redirige a `/auth/login` |
| Ruta de admin sin rol | `RoleGuard` redirige a `/portal` |
| Desactivar usuario | Requiere confirmación explícita via `ConfirmDialog` |
| Errores de validación | Se muestran por campo, no solo en banner global |
| Eliminar tenant/usuario | Soft delete — datos no se pierden, van a papelera |
| Purgar definitivamente | Segunda confirmación con aviso de irreversibilidad |

---

## Estado de componentes UI

| Componente | Archivo | Estado |
|---|---|---|
| Button | `ui/Button.tsx` | ✅ Etapa 2 |
| Input | `ui/Input.tsx` | ✅ Etapa 2 |
| Toggle | `ui/Toggle.tsx` | ✅ Etapa 2 |
| Table | `ui/Table.tsx` | ✅ Etapa 2 |
| ConfirmDialog | `ui/ConfirmDialog.tsx` | ✅ Etapa 3 |

---

## Rutas API — estado final (25 rutas)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/login` | Login |
| POST | `/api/forgot-password` | Solicitar reset |
| POST | `/api/reset-password` | Aplicar reset |
| POST | `/api/logout` | Logout |
| GET | `/api/me` | Usuario autenticado |
| GET | `/api/tenants` | Listar tenants activos |
| POST | `/api/tenants` | Crear tenant |
| GET | `/api/tenants/trashed` | Papelera de tenants |
| GET | `/api/tenants/{id}` | Ver tenant |
| PUT/PATCH | `/api/tenants/{id}` | Editar tenant |
| DELETE | `/api/tenants/{id}` | Soft delete tenant |
| POST | `/api/tenants/{id}/restore` | Restaurar tenant |
| DELETE | `/api/tenants/{id}/force` | Purgar tenant |
| GET | `/api/tenants/{id}/integrations` | Listar integraciones |
| POST | `/api/tenants/{id}/integrations` | Crear integración |
| PUT/PATCH | `/api/tenants/{id}/integrations/{iid}` | Editar integración |
| DELETE | `/api/tenants/{id}/integrations/{iid}` | Eliminar integración |
| GET | `/api/users` | Listar usuarios activos |
| POST | `/api/users` | Crear usuario |
| GET | `/api/users/trashed` | Papelera de usuarios |
| GET | `/api/users/{id}` | Ver usuario |
| PUT/PATCH | `/api/users/{id}` | Editar usuario |
| DELETE | `/api/users/{id}` | Soft delete usuario |
| POST | `/api/users/{id}/restore` | Restaurar usuario |
| DELETE | `/api/users/{id}/force` | Purgar usuario |

---

## 7. Navegación cruzada Tenants ↔ Usuarios

### Contador de usuarios como link rápido — `app/admin/tenants/page.tsx`

La columna **Usuarios** en la lista de tenants muestra un badge clicable que navega directamente a `/admin/usuarios?tenant_id={id}` con el filtro preseleccionado:

```tsx
render: (t: Tenant) => (
  <button onClick={() => router.push(`/admin/usuarios?tenant_id=${t.id}`)}>
    {t.users_count ?? 0} usuario{...}
    {t.users_count > 0 && <span>→</span>}
  </button>
),
```

### Filtro por tenant en lista de usuarios — `app/admin/usuarios/page.tsx`

La página lee el parámetro `?tenant_id` de la URL al montar. Usa `useSearchParams` dentro de un componente separado (`UsuariosContent`) envuelto en `<Suspense>` — requerido por Next.js para `useSearchParams` en App Router.

```tsx
function UsuariosContent() {
  const searchParams  = useSearchParams()
  const initialTenant = searchParams.get('tenant_id') ?? ''
  const [tenantFilter, setTenantFilter] = useState<string>(initialTenant)
  ...
}

export default function UsuariosPage() {
  return <Suspense><UsuariosContent /></Suspense>
}
```

**Comportamiento:**
- Dropdown "Filtrar por tenant" con todos los tenants activos
- Subtítulo dinámico: *"Mostrando usuarios de: NombreTenant"* o *"Todos los usuarios — N en total"*
- Botón **"✕ Limpiar filtro"** para volver a ver todos
- Cuando llegas desde el badge del tenant, el filtro ya llega preseleccionado

### Sección de usuarios en detalle del tenant — `app/admin/tenants/[id]/page.tsx`

Debajo del formulario de edición, se muestra la lista de usuarios pertenecientes al tenant. El backend ya devuelve el array `users` en `GET /api/tenants/{id}` vía `$tenant->load(['users', 'integrations'])`.

**Nuevo tipo en `hooks/useTenant.ts`:**
```typescript
export interface TenantUser {
  id: number
  nombre: string
  email: string
  perfil: string
  activo: boolean
}

// Tenant ahora incluye:
users?: TenantUser[]
```

**Visualización por usuario:**
- Nombre + email (truncado)
- Badge de rol (de `config/roles.ts`)
- Badge de estado (Activo / Inactivo)
- Link **"Editar →"** a `/admin/usuarios/{id}`

**Header de la sección:**
- Título con conteo: *"Usuarios (3)"*
- Link **"Ver en lista completa →"** que navega a `/admin/usuarios?tenant_id={id}`

**Estado vacío:** mensaje informativo dentro de un borde punteado cuando el tenant no tiene usuarios.

---

## Árbol de archivos nuevos/modificados en esta etapa

```
backend/
├── database/migrations/
│   └── ..._add_soft_deletes_to_tenants_and_users_tables.php  ← NUEVO
├── app/Models/
│   ├── Tenant.php                        ← MODIFICADO: +SoftDeletes
│   └── User.php                          ← MODIFICADO: +SoftDeletes
├── app/Http/Controllers/
│   ├── TenantController.php              ← MODIFICADO: +trashed, +restore, +forceDestroy, +destroy
│   └── UserController.php               ← MODIFICADO: +trashed, +restore, +forceDestroy, +destroy
└── routes/api.php                        ← MODIFICADO: +8 rutas soft delete

frontend/
├── hooks/
│   └── useTenant.ts                      ← MODIFICADO: +TenantUser, +users en Tenant
├── lib/
│   └── api.ts                            ← MODIFICADO: ApiError, auto-logout 401, manejo 422
├── components/
│   ├── ui/
│   │   └── ConfirmDialog.tsx             ← NUEVO
│   └── admin/
│       ├── EditUserForm.tsx              ← NUEVO
│       ├── TenantForm.tsx                ← MODIFICADO: validación por campo
│       └── UserForm.tsx                  ← MODIFICADO: tipo string en perfil
└── app/
    ├── admin/
    │   ├── tenants/
    │   │   ├── page.tsx                  ← MODIFICADO: users_count como link + papelera
    │   │   ├── [id]/page.tsx             ← MODIFICADO: +sección usuarios del tenant
    │   │   └── papelera/page.tsx         ← NUEVO
    │   └── usuarios/
    │       ├── page.tsx                  ← MODIFICADO: filtro por tenant + Suspense
    │       ├── [id]/page.tsx             ← NUEVO
    │       └── papelera/page.tsx         ← NUEVO
    └── portal/
        ├── layout.tsx                    ← NUEVO
        └── page.tsx                      ← REESCRITO: módulos con permisos
```

---

## Pendiente para etapa 4 (o según prioridad)

- [ ] Configurar SMTP real (Mailgun / SES) para emails en staging/producción
- [ ] Logout automático en el frontend cuando el token de Sanctum llega a su tiempo de expiración configurable
- [ ] Página de perfil del usuario (cambiar contraseña propia)
- [ ] Filtros y búsqueda en las tablas de tenants y usuarios
- [ ] Paginación en listas grandes
- [ ] Toast/notificaciones de éxito al guardar (actualmente solo redirige)
- [ ] Preparación para Docker (fase futura — no en scope todavía)
