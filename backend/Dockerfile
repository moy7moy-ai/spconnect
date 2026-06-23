FROM php:8.4-cli-alpine

RUN apk add --no-cache curl zip unzip git oniguruma-dev libxml2-dev libzip-dev

RUN docker-php-ext-install pdo pdo_mysql mbstring xml zip bcmath tokenizer

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction && \
    chmod -R 775 storage bootstrap/cache

EXPOSE 8000

CMD php artisan config:cache && \
    php artisan route:cache && \
    php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
