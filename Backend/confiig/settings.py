import os
from pathlib import Path


# ============================================================
# BASE
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent


# ============================================================
# CARGA MANUAL DE VARIABLES .env
# ============================================================
#
# Local:
#   VentasYa/.env
#   Backend/.env
#
# Vercel:
#   Las variables llegan directamente por os.environ.
#
# IMPORTANTE:
# - No sobrescribimos variables que ya existan.
# - Quitamos comillas externas de valores provenientes de .env.
#

_ENV_FILES = [
    PROJECT_ROOT / ".env",
    BASE_DIR / ".env",
]

for _env_path in _ENV_FILES:
    if not _env_path.exists():
        continue

    for _line in _env_path.read_text(
        encoding="utf-8"
    ).splitlines():

        _line = _line.strip()

        if (
            not _line
            or _line.startswith("#")
            or "=" not in _line
        ):
            continue

        _key, _value = _line.split("=", 1)

        _key = _key.strip()
        _value = _value.strip()

        # El .env descargado por Vercel puede contener:
        #
        # POSTGRES_HOST="host.example.com"
        #
        # Django necesita:
        #
        # host.example.com
        #
        if (
            len(_value) >= 2
            and _value[0] == _value[-1]
            and _value[0] in ('"', "'")
        ):
            _value = _value[1:-1]

        os.environ.setdefault(_key, _value)


# ============================================================
# SEGURIDAD
# ============================================================

SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "django-insecure-development-key-change-me",
)

DEBUG = os.environ.get(
    "DEBUG",
    "False",
).lower() in (
    "1",
    "true",
    "yes",
)


# ============================================================
# HOSTS
# ============================================================

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "ventasya-backend.vercel.app",
    "ventas-ya.vercel.app",
    ".vercel.app",
]

# Dominio actual de Vercel (inyectado por la plataforma, sin protocolo)
VERCEL_URL = os.environ.get("VERCEL_URL")

if VERCEL_URL:
    _vercel_host = VERCEL_URL.strip()
    if _vercel_host and _vercel_host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(_vercel_host)


# ============================================================
# APLICACIONES
# ============================================================

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "corsheaders",

    # Aplicaciones VentasYa
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
]


# ============================================================
# MIDDLEWARE
# ============================================================

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.security.SecurityMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",

    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",

    "django.contrib.messages.middleware.MessageMiddleware",

    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ============================================================
# URLS / WSGI
# ============================================================

ROOT_URLCONF = "confiig.urls"

WSGI_APPLICATION = "confiig.wsgi.application"


# ============================================================
# TEMPLATES
# ============================================================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",

        "DIRS": [],

        "APP_DIRS": True,

        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]
# ============================================================
# DATABASE
# ============================================================
#
# Supabase ofrece dos endpoints por proyecto:
#   - POSTGRES_URL                → pooler transaction-mode (puerto 6543)
#   - POSTGRES_URL_NON_POOLING    → conexión directa (puerto 5432)
# En Vercel (serverless) hay que usar el pooler: la conexión
# directa está limitada a ~15 conexiones simultáneas en plan free
# y se cae con EMAXCONNSESSION bajo carga.
#
# Estrategia:
#   1. Si POSTGRES_URL existe (Supabase la inyecta), parseamos su
#      URL y la usamos como host/user/pass/db/port. Esto funciona
#      tanto con el pooler transaction-mode como con session-mode.
#   2. Si solo vienen las variables sueltas (POSTGRES_HOST/PORT/…)
#      las respetamos como fallback.
#   3. CONN_MAX_AGE=0 + CONN_HEALTH_CHECKS=True cierra cada
#      conexión al terminar el request y descarta conexiones
#      caídas. Reduce la presión sobre el pool de Supabase.
#

def _parse_pg_url(url):
    """Devuelve (host, port, user, password, dbname) o None."""
    if not url:
        return None
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        if parsed.scheme not in ("postgres", "postgresql"):
            return None
        return (
            parsed.hostname,
            parsed.port or 5432,
            parsed.username,
            parsed.password,
            (parsed.path or "/").lstrip("/"),
        )
    except Exception:
        return None


# Prioridad 1: POSTGRES_URL (pooler recomendado por Supabase para serverless)
_parsed = _parse_pg_url(os.environ.get("POSTGRES_URL"))

if _parsed:
    _host, _port, _user, _password, _dbname = _parsed
else:
    # Prioridad 2: variables sueltas que ya usaba el proyecto
    _host = os.environ.get("POSTGRES_HOST")
    _port = int(os.environ.get("POSTGRES_PORT", "5432"))
    _user = os.environ.get("POSTGRES_USER")
    _password = os.environ.get("POSTGRES_PASSWORD")
    _dbname = os.environ.get("POSTGRES_DATABASE")

if all([_host, _user, _password, _dbname]):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": _dbname,
            "USER": _user,
            "PASSWORD": _password,
            "HOST": _host,
            "PORT": _port,
            "OPTIONS": {
                "sslmode": "require",
                "connect_timeout": 10,
            },
            # Cierra la conexión al terminar cada request y descarta
            # las conexiones caídas antes de reusarlas. Crítico en
            # serverless para no agotar el pool de Supabase.
            "CONN_MAX_AGE": 0,
            "CONN_HEALTH_CHECKS": True,
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
# ============================================================
# USUARIO PERSONALIZADO
# ============================================================

AUTH_USER_MODEL = "users.Usuario"


# ============================================================
# VALIDADORES DE CONTRASEÑA
# ============================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# ============================================================
# IDIOMA / ZONA HORARIA
# ============================================================

LANGUAGE_CODE = "es-co"

TIME_ZONE = "America/Bogota"

USE_I18N = True

USE_TZ = True


# ============================================================
# ARCHIVOS ESTÁTICOS
# ============================================================

STATIC_URL = "/static/"


# ============================================================
# MEDIA
# ============================================================

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"


# ============================================================
# CORS
# ============================================================

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ventas-ya.vercel.app",
    "https://ventasya-backend.vercel.app",
]

# También aceptar cualquier preview-*.vercel.app del propio Vercel
# (necesario porque cada PR/branch genera un subdominio distinto).
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://([a-z0-9-]+\.)?ventas-ya\.vercel\.app$",
    r"^https://([a-z0-9-]+\.)?ventasya-backend\.vercel\.app$",
]

FRONTEND_URL = os.environ.get("FRONTEND_URL")

if FRONTEND_URL:
    FRONTEND_URL = FRONTEND_URL.rstrip("/")

    if FRONTEND_URL not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(
            FRONTEND_URL
        )

CORS_ALLOW_CREDENTIALS = True


# ============================================================
# CSRF
# ============================================================

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ventas-ya.vercel.app",
    "https://ventasya-backend.vercel.app",
]

if FRONTEND_URL:
    if FRONTEND_URL not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(
            FRONTEND_URL
        )


# ============================================================
# COOKIES
# ============================================================

if DEBUG:

    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = False

    CSRF_COOKIE_SAMESITE = "None"
    CSRF_COOKIE_SECURE = False

else:

    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = True

    CSRF_COOKIE_SAMESITE = "None"
    CSRF_COOKIE_SECURE = True


# ============================================================
# SESSION ENGINE (CRITICAL FOR VERCEL SERVERLESS)
# ============================================================
# En Vercel serverless, las sesiones en memoria no funcionan
# porque cada request es independiente. Usamos sesiones basadas
# en cookies firmadas que no requieren almacenamiento del lado
# del servidor.
# ============================================================

SESSION_ENGINE = "django.contrib.sessions.backends.signed_cookies"
SESSION_COOKIE_HTTPONLY = True


# ============================================================
# DJANGO REST FRAMEWORK
# ============================================================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],

    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],

    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
}


# ============================================================
# SEGURIDAD PARA PRODUCCIÓN
# ============================================================

if not DEBUG:

    SECURE_PROXY_SSL_HEADER = (
        "HTTP_X_FORWARDED_PROTO",
        "https",
    )

    SECURE_SSL_REDIRECT = False

    CSRF_COOKIE_HTTPONLY = False

    X_FRAME_OPTIONS = "DENY"


# ============================================================
# DEFAULT PRIMARY KEY
# ============================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ============================================================
# VERCEL BLOB STORAGE
# ============================================================
# Token para autenticación con Vercel Blob Storage
# Necesario para subir archivos de productos
# Configurado en variables de entorno de Vercel
# Si no está configurado, se usa almacenamiento local como fallback
BLOB_READ_WRITE_TOKEN = os.environ.get("BLOB_READ_WRITE_TOKEN")