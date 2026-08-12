import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def api_exception_handler(exc, context):
    """
    Handler de DRF que además traduce errores de base de datos y de
    validación de Django a respuestas JSON en lugar de un 500 opaco.
    """

    if isinstance(exc, DjangoValidationError):
        return Response(
            {"detail": exc.messages},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, IntegrityError):
        logger.warning("IntegrityError en %s: %s", context.get("view"), exc)
        return Response(
            {"detail": "La operación viola una restricción de integridad de los datos."},
            status=status.HTTP_409_CONFLICT,
        )

    return exception_handler(exc, context)
