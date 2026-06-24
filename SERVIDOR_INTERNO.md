# SPConnect — Migración a Servidor Interno

Guía para mover el sistema de Railway + Vercel a un servidor propio (Linux Ubuntu 22.04).

---

## Arquitectura resultante

```
Internet
    │
    ▼
[Nginx] ── :80/:443 (SSL)
    ├── /api/*  →  Laravel (PHP-FPM, puerto 9000)
    └── /*      →  Next.js (Node.js, puerto 3000)

[MySQL]   puerto 3306 (interno)
[Redis]   puerto 6379 (interno)
```

---

## 1. Requisitos del servidor

- Ubuntu 22.04 LTS (mínimo 2 GB RAM, 20 GB disco)
- Acceso root o usuario con sudo
- Dominio apuntando al servidor (registro A en DNS)

---

## 2. Instalación de dependencias

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar utilidades
sudo apt install -y curl git unzip zip software-properties-common

# PHP 8.4
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.4 php8.4-fpm php8.4-mysql php8.4-redis \
    php8.4-mbstring php8.4-xml php8.4-zip php8.4-bcmath php8.4-curl

# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# MySQL 8
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Nginx
sudo apt install -y nginx

# Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

---

## 3. MySQL — crear base de datos

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE spconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'spconnect'@'localhost' IDENTIFIED BY 'TU_PASSWORD_SEGURO';
GRANT ALL PRIVILEGES ON spconnect.* TO 'spconnect'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 4. Backend — Laravel

### Clonar y configurar

```bash
cd /var/www
sudo git clone https://github.com/moy7moy-ai/spconnect.git spconnect
sudo chown -R www-data:www-data /var/www/spconnect
cd /var/www/spconnect/backend

sudo -u www-data composer install --no-dev --optimize-autoloader
sudo -u www-data cp .env.example .env
sudo -u www-data php artisan key:generate
```

### Archivo `.env` del backend

Edita `/var/www/spconnect/backend/.env`:

```env
APP_NAME=SPConnect
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tudominio.com

# Base de datos (MySQL local)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=spconnect
DB_USERNAME=spconnect
DB_PASSWORD=TU_PASSWORD_SEGURO

# Sesiones y caché (Redis local)
SESSION_DRIVER=redis
SESSION_DOMAIN=.tudominio.com
CACHE_STORE=redis
REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=null

# Sanctum
SANCTUM_STATEFUL_DOMAINS=tudominio.com
SANCTUM_TOKEN_EXPIRATION=480
FRONTEND_URL=https://tudominio.com

# Correo — cambiar según proveedor del cliente (ver sección 7)
MAIL_MAILER=smtp
MAIL_HOST=smtp.tuproveedor.com
MAIL_PORT=587
MAIL_USERNAME=correo@tudominio.com
MAIL_PASSWORD=TU_PASSWORD_CORREO
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@tudominio.com
MAIL_FROM_NAME=SPConnect

# Logs
LOG_CHANNEL=stack
LOG_LEVEL=error
```

### Migraciones

```bash
cd /var/www/spconnect/backend
sudo -u www-data php artisan migrate --force --seed
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan storage:link
sudo chmod -R 775 storage bootstrap/cache
```

---

## 5. Frontend — Next.js

```bash
cd /var/www/spconnect/frontend

# Crear archivo de entorno
sudo tee .env.production > /dev/null <<EOF
NEXT_PUBLIC_API_URL=https://tudominio.com/api
EOF

# Instalar y compilar
sudo npm install
sudo npm run build
```

### Process manager (PM2)

```bash
sudo npm install -g pm2

# Iniciar Next.js
sudo -u www-data pm2 start npm --name "spconnect-frontend" -- start -- -p 3000
sudo -u www-data pm2 save
sudo pm2 startup
```

---

## 6. Nginx — configuración

Crea el archivo `/etc/nginx/sites-available/spconnect`:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name tudominio.com www.tudominio.com;

    ssl_certificate     /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    # API Laravel
    location /api/ {
        root /var/www/spconnect/backend/public;
        try_files $uri $uri/ /index.php?$query_string;

        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME /var/www/spconnect/backend/public/index.php;
        include fastcgi_params;
    }

    # Sanctum CSRF
    location /sanctum/ {
        root /var/www/spconnect/backend/public;
        try_files $uri $uri/ /index.php?$query_string;

        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME /var/www/spconnect/backend/public/index.php;
        include fastcgi_params;
    }

    # Frontend Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/spconnect /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. SSL con Certbot

```bash
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

---

## 8. Correo — opciones según cliente

### Opción A: SMTP propio del cliente (Exchange, Gmail Workspace)

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.office365.com       # o smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=notificaciones@empresa.com
MAIL_PASSWORD=PASSWORD
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=notificaciones@empresa.com
```

### Opción B: Resend (actual, recomendado)

Requiere actualizar `UserController.php` para que use `Mail::` en vez del HTTP client directo, o mantener el mismo código con `RESEND_API_KEY` como variable de entorno del servidor.

```bash
# En el .env del servidor agregar:
RESEND_API_KEY=re_XXXXXXXXXXXX
MAIL_FROM_ADDRESS=noreply@tudominio.com
```

### Opción C: Sin correo (temporal)

```env
MAIL_MAILER=log
```

Los correos se escriben en `storage/logs/laravel.log` en vez de enviarse.

---

## 9. Qué reemplaza a Railway

| Railway | Servidor interno |
|---|---|
| Backend (Laravel) | PHP-FPM + Nginx |
| MySQL | MySQL local |
| Redis | Redis local |
| Variables de entorno | Archivo `.env` |
| Deploy automático | `git pull` + `php artisan` |

---

## 10. Qué reemplaza a Vercel

| Vercel | Servidor interno |
|---|---|
| Frontend (Next.js) | Node.js + PM2 + Nginx proxy |
| Deploy automático | `npm run build` + `pm2 restart` |
| SSL | Certbot (Let's Encrypt) |

---

## 11. CORS — actualizar para servidor interno

En `backend/config/cors.php`, agregar el dominio del cliente:

```php
'allowed_origins' => ['https://tudominio.com'],
'allowed_origins_patterns' => [],
```

---

## 12. Deploy de actualizaciones

Cada vez que haya cambios en el código:

```bash
cd /var/www/spconnect

# Backend
git pull origin main
cd backend
sudo -u www-data composer install --no-dev --optimize-autoloader
sudo -u www-data php artisan migrate --force
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache

# Frontend
cd ../frontend
sudo npm install
sudo npm run build
pm2 restart spconnect-frontend
```

---

## 13. Credenciales iniciales

| Campo | Valor |
|---|---|
| URL | `https://tudominio.com` |
| Email admin | `superadmin@auth.local` |
| Contraseña | `password` ← **cambiar después del primer login** |
