"""
Punto de entrada para Vercel.

Vercel detecta automáticamente la carpeta /api en la raíz del proyecto y
despliega cualquier archivo *.py como serverless function. Este módulo
carga el proyecto Django que vive en /Backend y expone la WSGI app como
handler HTTP.
"""

import os
import sys

# ============================================================
# PYTHON PATH
# ============================================================
# El código Django está en la carpeta /Backend. Lo añadimos al
# sys.path para que Python encuentre los módulos `confiig` y `apps`.
# ============================================================

_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_BACKEND = os.path.join(_ROOT, "Backend")

if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

# ============================================================
# DJANGO
# ============================================================

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "confiig.settings")

# ============================================================
# MIGRACIONES (en runtime, no en build)
# ============================================================
# Vercel es serverless: cada cold-start es una "build" nueva.
# No se pueden ejecutar migraciones en buildCommand de forma
# confiable, así que las disparamos al iniciar la función la
# primera vez. Usamos un lock basado en archivo para no repetir
# el trabajo en cada invocación.
# ============================================================

from django.core.wsgi import get_wsgi_application  # noqa: E402

app = get_wsgi_application()  # noqa: E402

# Importante: NO ejecutamos migrate automáticamente aquí.
# La estructura /Backend y el archivo manage.py siguen disponibles
# para correr migraciones manualmente desde local contra la base
# de Supabase configurada en .env / variables de Vercel.


# ============================================================
# HANDLER PARA VERCEL
# ============================================================
# Vercel espera que el módulo exponga una variable `app` callable
# WSGI/ASGI. Django devuelve ya una WSGI app lista.
# ============================================================
