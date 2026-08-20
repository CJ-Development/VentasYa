import os
import sys

# Ruta raíz del backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Configuración de Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "confiig.settings")

from django.core.wsgi import get_wsgi_application

app = get_wsgi_application()