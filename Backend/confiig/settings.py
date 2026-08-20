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

POSTGRES_HOST = os.environ.get("POSTGRES_HOST")
POSTGRES_DATABASE = os.environ.get("POSTGRES_DATABASE")
POSTGRES_USER = os.environ.get("POSTGRES_USER")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD")

if all([
    POSTGRES_HOST,
    POSTGRES_DATABASE,
    POSTGRES_USER,
    POSTGRES_PASSWORD,
]):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": POSTGRES_DATABASE,
            "USER": POSTGRES_USER,
            "PASSWORD": POSTGRES_PASSWORD,
            "HOST": POSTGRES_HOST,
            "PORT": os.environ.get("POSTGRES_PORT", "5432"),
            "OPTIONS": {
                "sslmode": "require",
                "connect_timeout": 10,
            },
            "CONN_MAX_AGE": 60,
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

    SESSION_COOKIE_HTTPONLY = True

    CSRF_COOKIE_HTTPONLY = False

    X_FRAME_OPTIONS = "DENY"


# ============================================================
# DEFAULT PRIMARY KEY
# ============================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"