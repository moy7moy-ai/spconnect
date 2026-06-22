# Etapa 1 — Scaffolding y base del módulo auth-multitenant

**Fecha:** 22 de junio de 2026  
**Estado:** Completada ✅

---

## Objetivo de esta etapa

Montar el entorno de desarrollo local, crear los dos proyectos (backend y frontend), configurar la base de datos, implementar la autenticación base con Laravel Sanctum y dejar el sistema funcionando con un super_admin capaz de hacer login.

---

## Stack instalado

| Herramienta | Versión | Método |
|---|---|---|
| PHP | 8.4.22 | Laravel Herd |
| Composer | 2.9.5 | Laravel Herd |
| Node.js | 25.9.0 | Preexistente |
| npm | 11.12.1 | Preexistente |
| MySQL | 9.6.0 | Homebrew |
| Redis | 8.8.0 | Homebrew |

---

## Estructura de carpetas creada

```
auth-multitenant/
├── backend/                          → Laravel 13 (API pura)
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── TenantController.php
│   │   │   │   ├── UserController.php
│   │   │   │   └── TenantIntegrationController.php
│   │   │   ├── Middleware/
│   │   │   │   └── EnsureTenantAccess.php
│   │   │   └── Requests/
│   │   │       ├── LoginRequest.php
│   │   │       ├── StoreTenantRequest.php
│   │   │       └── StoreUserRequest.php
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Tenant.php
│   │   │   ├── TenantIntegration.php
│   │   │   └── AccessLog.php
│   │   └── Scopes/
│   │       └── TenantScope.php
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 2026_06_22_000001_create_tenants_table.php
│   │   │   ├── 2026_06_22_000002_create_users_table.php
│   │   │   ├── 2026_06_22_000003_create_tenant_integrations_table.php
│   │   │   ├── 2026_06_22_000004_create_access_logs_table.php
│   │   │   └── ..._create_personal_access_tokens_table.php
│   │   └── seeders/
│   │       └── DatabaseSeeder.php
│   ├── routes/
│   │   └── api.php                   → 15 rutas registradas
│   ├── config/
│   │   ├── cors.php                  → configurado para localhost:3000
│   │   └── sanctum.php
│   └── .env                          → MySQL + Redis + Sanctum configurados
│
├── frontend/                         → Next.js 14 App Router
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (admin)/
│   │   │   └── dashboard/page.tsx
│   │   └── portal/page.tsx
│   ├── components/
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       ├── AuthGuard.tsx
│   │       └── RoleGuard.tsx
│   ├── config/
│   │   ├── modules.ts
│   │   ├── roles.ts
│   │   └── theme.ts
│   ├── lib/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── permissions.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTenant.ts
│   │   └── usePermissions.ts
│   ├── middleware.ts                  → protección de rutas
│   └── .env.local
│
└── docs/
    ├── SETUP.md
    └── ETAPA_1_RESUMEN.md            → este archivo
```

---

## Base de datos — MySQL

**Base de datos:** `auth_multitenant`

### Tablas creadas

#### `tenants`
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| nombre | varchar | |
| activo | boolean | default true |
| modulos_activos | JSON | `{ "facturacion": true, "tickets": false }` |
| created_at / updated_at | timestamps | |

#### `users`
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| tenant_id | FK → tenants | nullable (super_admin no tiene tenant) |
| nombre | varchar | |
| email | varchar unique | |
| password | varchar | hasheado con bcrypt |
| perfil | varchar | valor de `config/roles.ts` |
| permisos | JSON | `{ "facturacion": "full", "tickets": "none" }` |
| activo | boolean | default true |
| email_verified_at | timestamp | nullable |
| remember_token | varchar | |
| created_at / updated_at | timestamps | |

#### `tenant_integrations`
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| tenant_id | FK → tenants | cascade delete |
| plataforma | varchar | ej: 'contpaqi', 'otrs' |
| external_id | varchar | formato libre por plataforma |
| activo | boolean | |
| metadata | JSON | nullable |
| created_at / updated_at | timestamps | |

#### `access_logs`
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint PK | |
| user_id | FK → users | cascade delete |
| tenant_id | FK → tenants | nullable, null on delete |
| accion | varchar | ej: 'login', 'crear_tenant' |
| modulo | varchar | nullable |
| metadata | JSON | nullable (IP, payload extra) |
| created_at | timestamp | sin updated_at |

#### `personal_access_tokens`
Gestionada por Laravel Sanctum. Almacena los tokens de API.

---

## Rutas API registradas

**Base URL:** `http://localhost:8000/api`

| Método | Ruta | Controller | Auth |
|---|---|---|---|
| POST | `/login` | AuthController@login | Pública |
| POST | `/logout` | AuthController@logout | Sanctum |
| GET | `/me` | AuthController@me | Sanctum |
| GET | `/tenants` | TenantController@index | Sanctum |
| POST | `/tenants` | TenantController@store | Sanctum |
| GET | `/tenants/{id}` | TenantController@show | Sanctum |
| PUT/PATCH | `/tenants/{id}` | TenantController@update | Sanctum |
| GET | `/tenants/{id}/integrations` | TenantIntegrationController@index | Sanctum |
| POST | `/tenants/{id}/integrations` | TenantIntegrationController@store | Sanctum |
| PUT/PATCH | `/tenants/{id}/integrations/{iid}` | TenantIntegrationController@update | Sanctum |
| DELETE | `/tenants/{id}/integrations/{iid}` | TenantIntegrationController@destroy | Sanctum |
| GET | `/users` | UserController@index | Sanctum |
| POST | `/users` | UserController@store | Sanctum |
| GET | `/users/{id}` | UserController@show | Sanctum |
| PUT/PATCH | `/users/{id}` | UserController@update | Sanctum |

Todas las rutas protegidas pasan por dos middlewares en orden:
1. `auth:sanctum` — valida el token Bearer
2. `EnsureTenantAccess` — valida que el usuario y su tenant estén activos

---

## Seguridad implementada

| Mecanismo | Implementación |
|---|---|
| Autenticación | Laravel Sanctum — tokens Bearer en header `Authorization` |
| Contraseñas | `Hash::make()` bcrypt, cast `'password' => 'hashed'` en modelo |
| Aislamiento de tenants | `TenantScope` (Global Scope Eloquent) — filtra `tenant_id` automáticamente |
| Validación de acceso | `EnsureTenantAccess` middleware en cada request protegido |
| Validación de input | Form Requests de Laravel (`LoginRequest`, `StoreTenantRequest`, `StoreUserRequest`) |
| CORS | Solo permite origen `http://localhost:3000`, `supports_credentials: true` |
| Sesiones | Redis como driver (SESSION_DRIVER=redis) |
| Caché | Redis (CACHE_STORE=redis) |
| Logs de acceso | Tabla `access_logs` — registra login, logout, crear_tenant, crear_usuario, editar_tenant, editar_usuario |

---

## Archivos de configuración del frontend

Estos 3 archivos son **lo único que cambia entre proyectos**:

### `frontend/config/modules.ts`
Define los módulos del sistema. Cada módulo tiene `key`, `label` e `icon`.

### `frontend/config/roles.ts`
Define los perfiles de usuario disponibles. El campo `perfil` en la tabla `users` toma uno de estos keys.

### `frontend/config/theme.ts`
Define `primaryColor`, `logo`, `companyName` y `portalName`. Todos los componentes leen de aquí — nunca hardcodeado.

---

## Credenciales iniciales (seeder)

Abrir en el navegador: **http://localhost:3000/auth/login**

| Campo | Valor |
|---|---|
| Email | `superadmin@auth.local` |
| Contraseña | `password` |
| Perfil | `super_admin` |
| Tenant | ninguno (super_admin no pertenece a tenant) |
| Redirect post-login | `/admin` |

---

## Cómo levantar el proyecto

```bash
# Servicios (solo la primera vez o tras reiniciar Mac)
brew services start mysql
brew services start redis

# Terminal 1 — Backend
cd backend
php artisan serve          # → http://localhost:8000

# Terminal 2 — Frontend
cd frontend
npm run dev                # → http://localhost:3000
```

---

## Prueba de login verificada

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"superadmin@auth.local","password":"password"}'
```

**Respuesta exitosa:**
```json
{
  "token": "1|...",
  "user": {
    "id": 1,
    "nombre": "Super Admin",
    "email": "superadmin@auth.local",
    "perfil": "super_admin",
    "tenant_id": null
  },
  "redirect": "/admin"
}
```

---

## Decisiones técnicas relevantes

| Decisión | Razón |
|---|---|
| Laravel 13 en vez de 11 | `composer create-project` instala la última versión estable; la arquitectura es idéntica |
| Token Bearer en lugar de cookies SPA | Más simple para desarrollo local sin necesidad de configurar dominios compartidos |
| `predis/predis` en vez de `phpredis` | No requiere extensión C adicional; compatible con Herd sin configuración extra |
| `tenant_id nullable` en users | El super_admin no pertenece a ningún tenant |
| `access_logs` sin `updated_at` | Los logs son inmutables; `$timestamps = false` + solo `created_at` |
| Global Scope en lugar de RLS | MySQL no tiene Row Level Security; el scope de Eloquent es el equivalente correcto |

---

## Pendiente para etapa 2

- [ ] Panel Admin — lista de tenants con estado, módulos activos y conteo de usuarios
- [ ] Formulario crear/editar tenant con toggles de módulos y captura de `external_id` por plataforma
- [ ] Formulario crear usuario: selector de perfil desde `config/roles.ts`, matriz de permisos visual
- [ ] Componentes: `ModuleToggles.tsx`, `PermissionsMatrix.tsx`, `IntegrationIdsForm.tsx`
- [ ] Envío de email con credenciales al crear usuario (Laravel Mailable)
- [ ] Flujo completo de reset de contraseña (`forgot-password` → email → `reset-password`)
- [ ] Componentes UI base: `Button.tsx`, `Input.tsx`, `Toggle.tsx`, `Table.tsx`
