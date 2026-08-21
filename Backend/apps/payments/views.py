import json
import urllib.request
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.orders.models import Compra, MetodoPago
from .serializers import MetodoPagoCatalogoSerializer, PagoSerializer
from .models import Pago


class MetodosPagoView(APIView):
    """
    GET /api/payments/metodos/  -> lista de métodos de pago
    disponibles para el checkout del cliente.
    """

    def get(self, request):

        metodos = MetodoPago.objects.all().order_by("tipo")

        data = [MetodoPagoCatalogoSerializer.from_model(m) for m in metodos]

        return Response(data)


class PagosView(APIView):
    """
    GET  /api/payments/?compra_id=X  -> pagos de una compra
    POST /api/payments/              -> crear un pago (uso interno del checkout)
    """

    def get(self, request):

        compra_id = request.query_params.get("compra_id")

        qs = Pago.objects.select_related("metodo_pago").all().order_by("-fecha_pago")

        if compra_id:
            qs = qs.filter(compra_id=compra_id)

        return Response(PagoSerializer(qs, many=True).data)

    def post(self, request):

        serializer = PagoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pago = serializer.save()
        return Response(
            PagoSerializer(pago).data,
            status=status.HTTP_201_CREATED,
        )


class WompiCrearView(APIView):
    """
    POST /api/payments/wompi/crear/  -> crea una transacción real en Wompi
    para la compra indicada.

    Body esperado: {"compra_id": <int>}

    Devuelve la URL de checkout de Wompi para que el frontend redirija al usuario.
    """

    def post(self, request):
        compra_id = request.data.get("compra_id")

        if not compra_id:
            return Response(
                {"detail": "Se requiere 'compra_id'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            compra = Compra.objects.get(id_compra=compra_id)
        except Compra.DoesNotExist:
            return Response(
                {"detail": f"Compra {compra_id} no existe."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Verificar credenciales de Wompi
        if not settings.WOMPI_PUBLIC_KEY or not settings.WOMPI_PRIVATE_KEY:
            return Response(
                {"detail": "Credenciales de Wompi no configuradas."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        referencia = f"WMP-{compra_id}-{int(timezone.now().timestamp())}"

        # Crear transacción en Wompi
        try:
            url = "https://production.wompi.co/v1/transactions"
            
            payload = {
                "amount_in_cents": int(float(compra.total) * 100),  # Wompi usa centavos
                "currency": "COP",
                "customer_email": compra.usuario.email,
                "reference": referencia,
                "payment_method_type": "CARD",
                "redirect_url": settings.WOMPI_REDIRECT_URL or "https://ventas-ya.vercel.app/checkout/confirm",
            }

            headers = {
                "Authorization": f"Bearer {settings.WOMPI_PRIVATE_KEY}",
                "Content-Type": "application/json",
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers=headers,
                method='POST'
            )

            with urllib.request.urlopen(req, timeout=30) as response:
                response_data = response.read()
                data = json.loads(response_data.decode('utf-8'))

                if data.get("status") != "PENDING":
                    return Response(
                        {"detail": f"Error creando transacción Wompi: {data}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                transaction_id = data.get("data", {}).get("id")
                checkout_url = f"https://checkout.wompi.co/p/{transaction_id}"

                return Response(
                    {
                        "ok": True,
                        "compra_id": compra.id_compra,
                        "monto": float(compra.total),
                        "moneda": "COP",
                        "referencia": referencia,
                        "transaction_id": transaction_id,
                        "checkout_url": checkout_url,
                        "modo": "produccion",
                    },
                    status=status.HTTP_201_CREATED,
                )

        except Exception as e:
            return Response(
                {"detail": f"Error conectando con Wompi: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class WompiStatusView(APIView):
    """
    GET /api/payments/wompi/status/?compra_id=<int>
        -> devuelve el estado del pago de una compra en Wompi.

    Consulta el estado real de la transacción en Wompi.
    """

    def get(self, request):
        compra_id = request.query_params.get("compra_id")

        if not compra_id:
            return Response(
                {"detail": "Se requiere 'compra_id'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar credenciales de Wompi
        if not settings.WOMPI_PUBLIC_KEY or not settings.WOMPI_PRIVATE_KEY:
            return Response(
                {"detail": "Credenciales de Wompi no configuradas."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            compra = Compra.objects.get(id_compra=compra_id)
        except Compra.DoesNotExist:
            return Response(
                {"detail": f"Compra {compra_id} no existe."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Buscar el pago más reciente para obtener la referencia
        pago = (
            Pago.objects
            .filter(compra_id=compra_id)
            .order_by("-fecha_pago")
            .first()
        )

        if not pago or not pago.referencia_transaccion:
            return Response(
                {
                    "ok": True,
                    "compra_id": int(compra_id),
                    "estado": "pendiente",
                    "modo": "produccion",
                }
            )

        # Consultar estado en Wompi
        try:
            url = f"https://production.wompi.co/v1/transactions/{pago.referencia_transaccion}"
            
            headers = {
                "Authorization": f"Bearer {settings.WOMPI_PRIVATE_KEY}",
            }

            req = urllib.request.Request(url, headers=headers, method='GET')

            with urllib.request.urlopen(req, timeout=30) as response:
                response_data = response.read()
                data = json.loads(response_data.decode('utf-8'))

                transaction_data = data.get("data", {})
                status_wompi = transaction_data.get("status")

                # Mapear estados de Wompi a nuestros estados
                estado_map = {
                    "PENDING": "pendiente",
                    "APPROVED": "aprobado",
                    "DECLINED": "rechazado",
                    "ERROR": "rechazado",
                }

                estado = estado_map.get(status_wompi, "pendiente")

                # Actualizar el pago en la base de datos si cambió el estado
                if pago.estado != estado:
                    pago.estado = estado
                    pago.save()

                return Response(
                    {
                        "ok": True,
                        "compra_id": int(compra_id),
                        "pago_id": pago.id_pago,
                        "estado": estado,
                        "estado_wompi": status_wompi,
                        "monto": float(pago.monto),
                        "referencia": pago.referencia_transaccion,
                        "fecha_pago": pago.fecha_pago,
                        "modo": "produccion",
                    }
                )

        except Exception as e:
            return Response(
                {"detail": f"Error consultando estado en Wompi: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
