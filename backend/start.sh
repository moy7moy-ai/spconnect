#!/bin/sh

echo "Caching config and routes..."
php artisan config:cache
php artisan route:cache

echo "Waiting for database connection..."
until php -r "
\$h=getenv('DB_HOST'); \$p=getenv('DB_PORT');
\$s=@fsockopen(\$h,\$p,\$e,\$m,5);
if(\$s){fclose(\$s);echo 'DB ready'.PHP_EOL;exit(0);}
echo 'DB not ready: '.\$m.PHP_EOL;exit(1);
"; do
  sleep 3
done

echo "Running migrations..."
php artisan migrate --force --seed

echo "Starting server..."
exec php artisan serve --host=0.0.0.0 --port=8000
