import os
import sys


# ============================================================
# RUTA DEL PROYECTO
# ============================================================

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

BACKEND_DIR = os.path.join(
    PROJECT_ROOT,
    "Backend",
)


# ============================================================
# PYTHON PATH
# ============================================================

if BACKEND_DIR not in sys.path:
    sys.path.insert(
        0,
        BACKEND_DIR,
    )


# ============================================================
# DJANGO
# ============================================================

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "confiig.settings",
)


from django.core.wsgi import get_wsgi_application


app = get_wsgi_application()