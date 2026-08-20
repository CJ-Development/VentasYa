import os
from pathlib import Path


# ============================================================
# BASE
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# CARGA MANUAL DEL .env
# ============================================================
#
# En local:
#   Backend/.env
#
# En Vercel:
#   Las variables se configuran desde Environment Variables.
#

_env_path = BASE_DIR / ".env"

if _env_path.exists():
    for _line in _env_path.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()

        if (
            not _line
            or _line.startswith("#")
            or "=" not in _line
        ):
            continue

        _key, _value = _line.split("=", 1)

        os.environ.setdefault(
            _key.strip(),
            _value.strip()
        )


# ============================================================
# SEGURIDAD
# ============================================================

SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "django-insecure-development-key-change-me"
)

DEBUG = os.environ.get(
    "DEBUG",
    "False"
).lower() in ("1", "true", "yes")


# ============================================================
# HOSTS
# ============================================================

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "ventasya-backend.vercel.app",
    ".vercel.app",
]


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
# LOCAL
#   Django → SQLite → db.sqlite3
#
# VERCEL
#   Django → PostgreSQL → Supabase
#

if os.environ.get("POSTGRES_URL"):

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",

            "NAME": os.environ.get(
                "POSTGRES_DATABASE"
            ),

            "USER": os.environ.get(
                "POSTGRES_USER"
            ),

            "PASSWORD": os.environ.get(
                "POSTGRES_PASSWORD"
            ),

            "HOST": os.environ.get(
                "POSTGRES_HOST"
            ),

            "PORT": os.environ.get(
                "POSTGRES_PORT",
                "5432"
            ),

            "OPTIONS": {
                "sslmode": "require",
            },

            # Serverless:
            # no mantenemos conexiones persistentes
            "CONN_MAX_AGE": 0,
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
#
# Local:
#   Vite normalmente usa localhost:5173
#
# Producción:
#   FRONTEND_URL se configurará en Vercel.
#

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


FRONTEND_URL = os.environ.get(
    "FRONTEND_URL"
)

if FRONTEND_URL:

    CORS_ALLOWED_ORIGINS.append(
        FRONTEND_URL.rstrip("/")
    )


CORS_ALLOW_CREDENTIALS = True


# ============================================================
# CSRF
# ============================================================

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


if FRONTEND_URL:

    CSRF_TRUSTED_ORIGINS.append(
        FRONTEND_URL.rstrip("/")
    )


# ============================================================
# COOKIES
# ============================================================

if DEBUG:

    # Desarrollo local
    SESSION_COOKIE_SAMESITE = "None"

    SESSION_COOKIE_SECURE = False

    CSRF_COOKIE_SAMESITE = "None"

    CSRF_COOKIE_SECURE = False

else:

    # Producción HTTPS
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