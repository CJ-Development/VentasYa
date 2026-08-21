import json
import urllib.request
import urllib.error

from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.orders.models import Compra, MetodoPago
from apps.products.models import Variante

from .serializers import (
    MetodoPagoCatalogoSerializer,
    PagoSerializer,
)
from .models import Pago


class MetodosPagoView(APIView):

    def get(self, request):

        metodos = (
            MetodoPago.objects
            .all()
            .order_by("tipo")
        )

        data = [
            MetodoPagoCatalogoSerializer.from_model(m)
            for m in metodos
        ]

        return Response(data)


class PagosView(APIView):

    def get(self, request):

        compra_id = request.query_params.get("compra_id")

        qs = (
            Pago.objects
            .select_related("metodo_pago", "compra")
            .all()
            .order_by("-fecha_pago")
        )

        if compra_id:
            qs = qs.filter(compra_id=compra_id)

        return Response(
            PagoSerializer(qs, many=True).data
        )


class WompiCrearView(APIView):

    """
    POST /api/payments/wompi/crear/

    Body:
    {
        "compra_id": 123
    }
    """

    def post(self, request):

        compra_id = request.data.get("compra_id")

        if not compra_id:

            return Response(
                {"detail": "Se requiere 'compra_id'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        compra = get_object_or_404(
            Compra,
            id_compra=compra_id
        )

        # Buscar pago pendiente
        pago = (
            Pago.objects
            .filter(
                compra=compra,
                estado="pendiente",
            )
            .order_by("-fecha_pago")
            .first()
        )

        if not pago:

            return Response(
                {
                    "detail": (
                        "No existe un pago pendiente "
                        "para esta compra."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not settings.WOMPI_PUBLIC_KEY:

            return Response(
                {
                    "detail": (
                        "WOMPI_PUBLIC_KEY no está configurada."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not settings.WOMPI_PRIVATE_KEY:

            return Response(
                {
                    "detail": (
                        "WOMPI_PRIVATE_KEY no está configurada."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        referencia = (
            f"WMP-{compra.id_compra}-"
            f"{int(timezone.now().timestamp())}"
        )

        amount_in_cents = int(
            Decimal(compra.total) * 100
        )

        payload = {
            "amount_in_cents": amount_in_cents,
            "currency": "COP",
            "customer_email": compra.usuario.email,
            "reference": referencia,
            "redirect_url": (
                settings.WOMPI_REDIRECT_URL
            ),
        }

        url = (
            "https://production.wompi.co/v1/transactions"
        )

        headers = {
            "Authorization": (
                f"Bearer {settings.WOMPI_PRIVATE_KEY}"
            ),
            "Content-Type": "application/json",
        }

        try:

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST",
            )

            with urllib.request.urlopen(
                req,
                timeout=30
            ) as response:

                response_data = response.read()

            data = json.loads(
                response_data.decode("utf-8")
            )

        except urllib.error.HTTPError as e:

            error_body = e.read().decode(
                "utf-8",
                errors="ignore"
            )

            return Response(
                {
                    "detail": "Wompi rechazó la solicitud.",
                    "wompi_response": error_body,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:

            return Response(
                {
                    "detail": (
                        "Error conectando con Wompi."
                    ),
                    "error": str(e),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        transaction_data = data.get("data", {})

        transaction_id = transaction_data.get("id")

        if not transaction_id:

            return Response(
                {
                    "detail": (
                        "Wompi no devolvió un "
                        "transaction_id."
                    ),
                    "response": data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Guardar referencia e ID real de Wompi
        pago.referencia_transaccion = referencia
        pago.wompi_transaction_id = str(
            transaction_id
        )
        pago.estado = "pendiente"
        pago.save(
            update_fields=[
                "referencia_transaccion",
                "wompi_transaction_id",
                "estado",
            ]
        )

        return Response(
            {
                "ok": True,
                "compra_id": compra.id_compra,
                "pago_id": pago.id_pago,
                "monto": float(compra.total),
                "moneda": "COP",
                "referencia": referencia,
                "transaction_id": str(transaction_id),
                "estado": "pendiente",
                "redirect_url": (
                    settings.WOMPI_REDIRECT_URL
                ),
            },
            status=status.HTTP_201_CREATED,
        )


class WompiStatusView(APIView):

    """
    GET /api/payments/wompi/status/?compra_id=123
    """

    def get(self, request):

        compra_id = request.query_params.get(
            "compra_id"
        )

        if not compra_id:

            return Response(
                {
                    "detail": (
                        "Se requiere 'compra_id'."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        compra = get_object_or_404(
            Compra,
            id_compra=compra_id
        )

        pago = (
            Pago.objects
            .filter(compra=compra)
            .order_by("-fecha_pago")
            .first()
        )

        if not pago:

            return Response(
                {
                    "ok": True,
                    "compra_id": compra.id_compra,
                    "estado": "pendiente",
                }
            )

        if not pago.wompi_transaction_id:

            return Response(
                {
                    "ok": True,
                    "compra_id": compra.id_compra,
                    "pago_id": pago.id_pago,
                    "estado": pago.estado,
                }
            )

        if not settings.WOMPI_PRIVATE_KEY:

            return Response(
                {
                    "detail": (
                        "WOMPI_PRIVATE_KEY no configurada."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        url = (
            "https://production.wompi.co/v1/transactions/"
            f"{pago.wompi_transaction_id}"
        )

        headers = {
            "Authorization": (
                f"Bearer {settings.WOMPI_PRIVATE_KEY}"
            ),
        }

        try:

            req = urllib.request.Request(
                url,
                headers=headers,
                method="GET",
            )

            with urllib.request.urlopen(
                req,
                timeout=30
            ) as response:

                response_data = response.read()

            data = json.loads(
                response_data.decode("utf-8")
            )

        except Exception as e:

            return Response(
                {
                    "detail": (
                        "Error consultando Wompi."
                    ),
                    "error": str(e),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        transaction_data = data.get(
            "data",
            {}
        )

        status_wompi = transaction_data.get(
            "status"
        )

        estado_map = {
            "PENDING": "pendiente",
            "APPROVED": "aprobado",
            "DECLINED": "rechazado",
            "ERROR": "rechazado",
        }

        estado = estado_map.get(
            status_wompi,
            "pendiente"
        )

        if estado != pago.estado:

            pago.estado = estado
            pago.save(
                update_fields=["estado"]
            )

        # Si el pago fue aprobado,
        # completar la compra.
        if estado == "aprobado":

            self._finalizar_compra(
                compra
            )

        elif estado == "rechazado":

            if compra.estado_compra == "pendiente":

                compra.estado_compra = "cancelado"
                compra.save(
                    update_fields=[
                        "estado_compra"
                    ]
                )

        return Response(
            {
                "ok": True,
                "compra_id": compra.id_compra,
                "pago_id": pago.id_pago,
                "estado": estado,
                "estado_wompi": status_wompi,
                "transaction_id": (
                    pago.wompi_transaction_id
                ),
                "referencia": (
                    pago.referencia_transaccion
                ),
                "monto": float(pago.monto),
            }
        )

    @staticmethod
    def _finalizar_compra(compra):

        if compra.estado_compra == "pagado":
            return

        with transaction.atomic():

            compra = (
                Compra.objects
                .select_for_update()
                .get(
                    id_compra=compra.id_compra
                )
            )

            if compra.estado_compra == "pagado":
                return

            for detalle in compra.detalles.select_related(
                "variante"
            ):

                variante = (
                    Variante.objects
                    .select_for_update()
                    .get(
                        id_variante=(
                            detalle.variante.id_variante
                        )
                    )
                )

                if variante.stock < detalle.cantidad:

                    raise ValueError(
                        (
                            "Stock insuficiente "
                            "al confirmar el pago."
                        )
                    )

                variante.stock -= detalle.cantidad
                variante.save(
                    update_fields=["stock"]
                )

            compra.estado_compra = "pagado"

            compra.save(
                update_fields=[
                    "estado_compra"
                ]
            )

            try:

                carrito = (
                    compra.usuario.carrito
                )

                carrito.items.all().delete()

            except Exception:
                pass
