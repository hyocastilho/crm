#!/bin/sh
set -eu
python manage.py migrate --noinput
if [ "${SEED_DEMO:-true}" = "true" ]; then
  python manage.py seed_demo
fi
exec python manage.py runserver 0.0.0.0:8000
