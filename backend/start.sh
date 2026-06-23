#!/bin/sh
set -e

echo "Caching config..."
php artisan config:cache
php artisan route:cache

echo "Waiting for database..."
until php -r "new PDO('mysql:host='.\$_ENV['DB_HOST'].';port='.\$_ENV['DB_PORT'].';dbname='.\$_ENV['DB_DATABASE'], \$_ENV['DB_USERNAME'], \$_ENV['DB_PASSWORD']);" 2>/dev/null; do
  echo "DB not ready, retrying in 3s..."
  sleep 3
done

echo "Running migrations..."
php artisan migrate --force --seed

echo "Starting server on port 8000..."
exec php artisan serve --host=0.0.0.0 --port=8000
