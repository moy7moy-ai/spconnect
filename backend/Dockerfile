FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
    curl zip unzip git \
    libonig-dev libxml2-dev libzip-dev \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo pdo_mysql mbstring xml zip bcmath

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction && \
    chmod -R 775 storage bootstrap/cache

EXPOSE 8000

CMD php artisan config:cache; php artisan route:cache; php artisan serve --host=0.0.0.0 --port=8000
