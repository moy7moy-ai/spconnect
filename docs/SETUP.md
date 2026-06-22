# Setup local — auth-multitenant

## Requisitos previos

| Herramienta | Versión mínima | Cómo instalar |
|---|---|---|
| PHP | 8.2+ | [Laravel Herd](https://herd.laravel.com) (macOS) |
| Composer | 2.x | Incluido con Herd |
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| MySQL | 8.x | `brew install mysql` |
| Redis | 7.x | `brew install redis` |

---

## Inicio rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/moy7moy-ai/auth-multitenant.git
cd auth-multitenant
```

### 2. Backend (Laravel)

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
```

Editar `.env` con tus credenciales locales:
```env
DB_CONNECTION=mysql
DB_DATABASE=auth_multitenant
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=redis
CACHE_STORE=redis
REDIS_CLIENT=predis

SANCTUM_STATEFUL_DOMAINS=localhost:3000
FRONTEND_URL=http://localhost:3000
```

```bash
php artisan migrate
php artisan db:seed          # crea el super_admin inicial
php artisan serve            # → http://localhost:8000
```

### 3. Frontend (Next.js)

```bash
cd ../frontend
npm install
npm run dev                  # → http://localhost:3000
```

Crear `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Credenciales de acceso iniciales

| Campo | Valor |
|---|---|
| URL | http://localhost:3000/auth/login |
| Email | `superadmin@auth.local` |
| Contraseña | `password` |

> Cambia la contraseña después del primer login desde **Mi perfil**.

---

## Servicios (macOS con Homebrew)

```bash
brew services start mysql
brew services start redis
```

---

## Resetear el proyecto (datos limpios)

```bash
cd backend
php artisan migrate:fresh --seed
```

Borra todas las tablas, las recrea y deja únicamente el superadmin. Útil al reutilizar el módulo para un nuevo proyecto.

---

## Estructura del proyecto

```
auth-multitenant/
├── backend/              → Laravel (API pura, puerto 8000)
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   ├── Mail/
│   │   └── Scopes/TenantScope.php
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/api.php
├── frontend/             → Next.js 14 App Router (puerto 3000)
│   ├── app/
│   │   ├── admin/        → panel de super admin
│   │   ├── portal/       → portal del usuario final
│   │   └── auth/         → login, forgot/reset password
│   ├── components/
│   ├── config/           → ⭐ los 3 archivos que cambias por proyecto
│   ├── context/
│   ├── hooks/
│   └── lib/
└── docs/                 → documentación por etapa
```

---

## Personalización por proyecto

Este módulo está diseñado para reutilizarse. **Solo necesitas modificar 3 archivos** en `frontend/config/` para adaptar el sistema a cualquier proyecto.

---

### `config/modules.ts` — Los módulos del sistema

Define qué bloques funcionales existen en tu producto. Cada módulo tiene una `key` única, un `label` visible y un `icon`.

```typescript
export const MODULES = [
  { key: 'ventas',    label: 'Ventas',     icon: '💰' },
  { key: 'inventario',label: 'Inventario', icon: '📦' },
  { key: 'reportes',  label: 'Reportes',   icon: '📊' },
  { key: 'rrhh',      label: 'RRHH',       icon: '👥' },
] as const

export type ModuleKey = typeof MODULES[number]['key']
```

**Qué ocurre automáticamente al agregar un módulo:**
- Aparece en el panel admin al crear/editar un tenant → el admin activa o desactiva ese módulo por empresa
- Aparece en la matriz de permisos al crear/editar usuarios → se asigna nivel `full / ver / none`
- Aparece en el portal del usuario si el tenant lo tiene activo y el usuario tiene permiso

**Para quitar un módulo:** bórralo del array. Los permisos guardados en MySQL con esa key se ignoran silenciosamente, no rompe nada.

---

### `config/roles.ts` — Los roles del sistema

Define los perfiles de usuario disponibles. El `key` se guarda en la base de datos; el `label` se muestra en la UI.

```typescript
export const ROLES = [
  { key: 'super_admin', label: 'Super Admin' },  // ⚠️ no eliminar
  { key: 'admin',       label: 'Administrador' },
  { key: 'editor',      label: 'Editor' },
  { key: 'viewer',      label: 'Solo lectura' },
] as const
```

**Reglas:**
- El rol `super_admin` es especial — no está ligado a ningún tenant y tiene acceso total. No lo elimines.
- Puedes renombrar, agregar o quitar el resto de roles libremente según el negocio.
- Los roles son solo etiquetas de organización. El control real de acceso se hace con los permisos por módulo.

---

### `config/theme.ts` — Identidad visual

```typescript
export const THEME = {
  primaryColor: '#000000',   // color del header y elementos de marca
  companyName:  'Mi Empresa',
  portalName:   'Mi Portal',
  logo:         null,        // ruta a imagen en /public o null
}
```

---

## Cómo usar los permisos en tu dashboard

Una vez que defines los módulos, puedes proteger cualquier sección del portal con el hook `usePermissions`:

```typescript
import { usePermissions } from '@/hooks/usePermissions'

export default function VentasPage() {
  const { level, canEdit, canAccess } = usePermissions()

  if (!canAccess('ventas')) return <p>Sin acceso</p>

  return (
    <div>
      <h1>Ventas</h1>
      {canEdit('ventas') && <button>Crear venta</button>}
      {/* contenido de solo lectura visible para todos con acceso */}
    </div>
  )
}
```

**Niveles de permiso:**

| Nivel | `canAccess()` | `canEdit()` | Uso típico |
|---|---|---|---|
| `full` | ✅ | ✅ | Puede ver y modificar datos |
| `ver` | ✅ | ❌ | Solo lectura |
| `none` | ❌ | ❌ | No ve la sección |

---

## Integración con APIs externas

Cada módulo puede consumir sus propias APIs desde el backend Laravel. El token Sanctum protege todas las rutas automáticamente.

```php
// backend/routes/api.php — dentro del grupo auth:sanctum
Route::get('/ventas/resumen', function () {
    $data = Http::withToken(config('services.crm.key'))
                ->get('https://api.crm.com/summary');
    return $data->json();
});
```

```typescript
// frontend — el mismo api.get() que ya existe
const resumen = await api.get('/ventas/resumen')
```

El diseño del componente que muestra esos datos es completamente libre — gráficas, tablas, mapas, tiempo real. El módulo de auth no impone ninguna restricción de UI.

---

## Producción con Docker

```bash
# En la raíz del proyecto
docker-compose up -d

# Primera vez: migrar y seedear dentro del contenedor
docker exec auth_backend php artisan migrate --seed
```

Servicios expuestos:
- Frontend → `http://localhost:3000`
- Backend API → `http://localhost:8000`
- MySQL → puerto `3306`
- Redis → puerto `6379`

### Variables de entorno para producción

Crear `backend/.env` basado en `.env.example` y ajustar:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.tudominio.com
FRONTEND_URL=https://tudominio.com

# SMTP real (Mailgun)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_ENCRYPTION=tls
MAIL_USERNAME=postmaster@tudominio.com
MAIL_PASSWORD=tu_mailgun_password
MAIL_FROM_ADDRESS=noreply@tudominio.com

# Token expiration
SANCTUM_TOKEN_EXPIRATION=480   # minutos (8 horas)
```

---

## Rutas API disponibles

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/login` | Login |
| POST | `/api/forgot-password` | Solicitar reset |
| POST | `/api/reset-password` | Aplicar reset |
| POST | `/api/logout` | Logout |
| GET | `/api/me` | Usuario autenticado |
| PATCH | `/api/profile` | Actualizar perfil propio |
| GET | `/api/tenants` | Listar tenants |
| POST | `/api/tenants` | Crear tenant |
| GET | `/api/tenants/trashed` | Papelera de tenants |
| GET/PUT/DELETE | `/api/tenants/{id}` | Ver / editar / eliminar tenant |
| POST | `/api/tenants/{id}/restore` | Restaurar tenant |
| DELETE | `/api/tenants/{id}/force` | Purgar tenant |
| GET/POST | `/api/tenants/{id}/integrations` | Integraciones del tenant |
| PUT/DELETE | `/api/tenants/{id}/integrations/{iid}` | Editar / eliminar integración |
| GET | `/api/users` | Listar usuarios (paginado, filtra por `?tenant_id`, `?search`, `?page`) |
| POST | `/api/users` | Crear usuario (genera contraseña y envía email) |
| GET | `/api/users/trashed` | Papelera de usuarios |
| GET/PUT/DELETE | `/api/users/{id}` | Ver / editar / eliminar usuario |
| POST | `/api/users/{id}/restore` | Restaurar usuario |
| DELETE | `/api/users/{id}/force` | Purgar usuario |
| POST | `/api/users/{id}/reset-password` | Resetear contraseña (envía email) |
