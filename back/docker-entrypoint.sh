#!/bin/sh
set -eu
python manage.py migrate --noinput
if [ "${SEED_DEMO:-true}" = "true" ]; then
  python manage.py seed_demo
fi
# Sem autoreload: o volume ./back no Windows costuma gerar EIO após suspender o notebook.
exec python manage.py runserver 0.0.0.0:8000 --noreload
