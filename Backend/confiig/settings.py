
import os
from pathlib import Path

# Carga variables del .env si existe (sin dependencia extra):
# SECRET_KEY, DEBUG, DB_*, ALLOWED_HOSTS, etc.
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv(BASE_DIR if False else None)
except Exception:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent
_env_path = BASE_DIR / ".env"
if _env_path.exists():
    for _line in _env_path.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if not _line or _line.startswith("#") or "=" not in _line:
            continue
        _k, _v = _line.split("=", 1)
        os.environ.setdefault(_k.strip(), _v.strip())

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-!a=s)h#mkm=+4cax!4euw3kx_p8_e9_#ni^y45g*v9zo_ho8@!')
DEBUG = os.environ.get('DEBUG', 'True').lower() in ('1', 'true', 'yes')
# Aceptamos tanto "localhost" como "127.0.0.1" para que el frontend Vite
# pueda hablar con Django sin que el middleware rechace el Host.
ALLOWED_HOSTS = [
    h.strip() for h in os.environ.get(
        'ALLOWED_HOSTS', 'localhost,127.0.0.1'
    ).split(',') if h.strip()
]

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    "rest_framework",
    "apps.users",
    "apps.categories",
    "apps.products",
    "apps.cart",
    "apps.offers",
    "apps.orders",
    "apps.payments",
    "apps.favorites",
    "apps.notifications",
    "apps.reviews",
    "corsheaders",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'confiig.urls'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]

WSGI_APPLICATION = 'confiig.wsgi.application'

DATABASES = {
    "default": {
        "ENGINE": os.environ.get(
            "DB_ENGINE", "django.db.backends.sqlite3"
        ),
        "NAME": os.environ.get("DB_NAME", "db.sqlite3"),
        "USER": os.environ.get("DB_USER", ""),
        "PASSWORD": os.environ.get("DB_PASSWORD", ""),
        "HOST": os.environ.get("DB_HOST", ""),
        "PORT": os.environ.get("DB_PORT", ""),
    }
}
AUTH_USER_MODEL = "users.Usuario"
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

CORS_ALLOW_CREDENTIALS = True

# CSRF_TRUSTED_ORIGINS: en Django 4+ los origins que reciben POST/PUT/DELETE
# con sesión tienen que estar acá, además de CORS_ALLOWED_ORIGINS. Sin esto
# DRF rechaza la request con 403 incluso si la cookie viaja.
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# En desarrollo el frontend (5173) y el backend (8000) suelen correr
# en hosts distintos (localhost vs 127.0.0.1), lo que el navegador
# considera "cross-site". Con SameSite=Lax, el navegador BLOQUEA la
# cookie `sessionid` en requests POST cross-site, y por eso DRF ve
# request.user como AnonymousUser y devuelve 403 "Authentication
# credentials were not provided". Forzamos SameSite=None (con Secure
# desactivado para que funcione en http://localhost) SOLO en DEBUG.
if DEBUG:
    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SAMESITE = "None"
    CSRF_COOKIE_SECURE = False

# DRF: usamos autenticación por sesión para que el admin pueda
# crear/editar ofertas con CSRF. El frontend envía withCredentials
# y la cookie csrftoken vía X-CSRFToken (ver frontend/src/services/api.js).
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        # Default abierto: el sitio público (home, catálogo, ofertas,
        # categorías, productos, favoritos, reviews) usa GET sin login.
        # Los endpoints admin (POST/PUT/DELETE) restringen por vista
        # vía get_permissions() usando IsAdminUser (staff).
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
}
