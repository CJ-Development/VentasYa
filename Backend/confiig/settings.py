"""
Configuración de Django para el proyecto VentasYa.

Todos los valores sensibles o dependientes del entorno se leen de
variables de entorno (archivo `.env` en la raíz de Backend/).
Ver `.env.example` para la lista completa.
"""

from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    CORS_ALLOWED_ORIGINS=(list, ["http://localhost:5173", "http://127.0.0.1:5173"]),
    CSRF_TRUSTED_ORIGINS=(list, []),
    DB_ENGINE=(str, "django.db.backends.mysql"),
    DB_NAME=(str, "ventasya_db"),
    DB_USER=(str, ""),
    DB_PASSWORD=(str, ""),
    DB_HOST=(str, "127.0.0.1"),
    DB_PORT=(str, "3306"),
    ACCESS_TOKEN_LIFETIME_MINUTES=(int, 60),
    REFRESH_TOKEN_LIFETIME_DAYS=(int, 7),
)

environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY", default=None) or env(
    "DJANGO_SECRET_KEY",
    default="django-insecure-solo-para-desarrollo-local-cambiar-en-produccion",
)

DEBUG = env("DEBUG")

ALLOWED_HOSTS = env("ALLOWED_HOSTS")

CSRF_TRUSTED_ORIGINS = env("CSRF_TRUSTED_ORIGINS")


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
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

ROOT_URLCONF = "confiig.urls"

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

WSGI_APPLICATION = "confiig.wsgi.application"


# Base de datos

DATABASES = {
    "default": {
        "ENGINE": env("DB_ENGINE"),
        "NAME": env("DB_NAME"),
        "USER": env("DB_USER"),
        "PASSWORD": env("DB_PASSWORD"),
        "HOST": env("DB_HOST"),
        "PORT": env("DB_PORT"),
    }
}

if DATABASES["default"]["ENGINE"].endswith("mysql"):
    DATABASES["default"]["OPTIONS"] = {
        "charset": "utf8mb4",
        # Evita que MySQL trunque datos en silencio.
        "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
    }

if DATABASES["default"]["ENGINE"].endswith("sqlite3"):
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": env("DB_NAME", default=str(BASE_DIR / "db.sqlite3")),
    }

DEFAULT_AUTO_FIELD = "django.db.models.AutoField"


# Autenticación

AUTH_USER_MODEL = "users.Usuario"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# Django REST Framework

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    # Por defecto TODO exige autenticación. Los endpoints públicos
    # declaran explícitamente `permission_classes = [AllowAny]`.
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "utils.pagination.OptionalPageNumberPagination",
    "PAGE_SIZE": 24,
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.ScopedRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "login": "10/min",
        "register": "5/min",
    },
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "utils.exceptions.api_exception_handler",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env("ACCESS_TOKEN_LIFETIME_MINUTES")),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env("REFRESH_TOKEN_LIFETIME_DAYS")),
    "ROTATE_REFRESH_TOKENS": True,
    "USER_ID_FIELD": "id_usuario",
    "USER_ID_CLAIM": "user_id",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "VentasYa API",
    "DESCRIPTION": "API del e-commerce VentasYa.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}


# Internacionalización

LANGUAGE_CODE = "es-co"

TIME_ZONE = "America/Bogota"

USE_I18N = True

USE_TZ = True


# Archivos estáticos y media

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"


# CORS

CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS")


# Seguridad en producción (se activa cuando DEBUG=False)

if not DEBUG:
    SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
    SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=31536000)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"


# Logging

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {
            "format": "{levelname} {asctime} {name} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": env("LOG_LEVEL", default="INFO"),
    },
}
