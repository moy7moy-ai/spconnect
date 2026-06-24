# SPConnect — Configuración Local

Portal cliente para servicios administrados (facturación, tickets, reportes).

---

## Requisitos

| Herramienta | Versión mínima |
|---|---|
| PHP | 8.4+ |
| Composer | 2.x |
| MySQL | 8.0+ |
| Redis | 6.x+ |
| Node.js | 18+ |
| npm | 9+ |

> **macOS (recomendado):** Usa [Laravel Herd](https://herd.laravel.com/) — instala PHP 8.4, Composer y nginx en un clic.
> Descarga gratis en: https://herd.laravel.com
>
> Adicionalmente instala MySQL y Redis via [Homebrew](https://brew.sh/):
> ```bash
> brew install mysql redis node
> brew services start mysql
> brew services start redis
> ```
>
> **Windows:** Usa [Herd para Windows](https://herd.laravel.com/) o [Laragon](https://laragon.org/) que incluye PHP, MySQL y Redis.

---

## Backend (Laravel 11)

```bash
cd backend

# 1. Copiar archivo de entorno
cp .env.example .env

# 2. Editar .env con tus credenciales de base de datos
#    DB_DATABASE, DB_USERNAME, DB_PASSWORD

# 3. Instalar dependencias
composer install

# 4. Generar clave de aplicación
php artisan key:generate

# 5. Crear base de datos en MySQL
mysql -u root -p -e "CREATE DATABASE spconnect;"

# 6. Ejecutar migraciones y datos iniciales
php artisan migrate --seed

# 7. Iniciar servidor (puerto 8001)
php artisan serve --port=8001
```

---

## Frontend (Next.js 14)

```bash
cd frontend

# 1. Crear archivo de entorno
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8001/api" > .env.local

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo (puerto 3000)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Credenciales iniciales

| Campo | Valor |
|---|---|
| Email | `superadmin@auth.local` |
| Contraseña | `password` |

---

## Flujo básico

1. Inicia sesión con el super admin
2. Crea un **Tenant** (empresa cliente) en `/admin/tenants`
3. Crea un **Usuario** asociado al tenant en `/admin/usuarios`
4. Cierra sesión y entra con las credenciales del usuario para ver el portal cliente

---

## Notas

- Los correos en entorno local se escriben en `backend/storage/logs/laravel.log` (no se envían)
- El portal del cliente usa datos de ejemplo (mock) — no requiere APIs externas
- Redis es necesario para sesiones y caché; si no lo tienes puedes cambiar en `.env`:
  ```
  SESSION_DRIVER=file
  CACHE_STORE=file
  ```
