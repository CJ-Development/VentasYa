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
    POST /api/payments/wompi/crear/  -> crea una "transacción" simulada
    contra Wompi para la compra indicada.

    Body esperado: {"compra_id": <int>}

    Devuelve un payload con la URL pública de Wompi (placeholder) y un
    id de referencia que el frontend puede usar para consultar el
    estado. La integración real con la pasarela queda pendiente; este
    endpoint existe para que el flujo de checkout del frontend no
    reciba 404 en producción y para dejar lista la conexión.
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

        referencia = f"WMP-{compra_id}-{int(timezone.now().timestamp())}"

        return Response(
            {
                "ok": True,
                "compra_id": compra.id_compra,
                "monto": float(compra.total),
                "moneda": "COP",
                "referencia": referencia,
                "checkout_url": (
                    f"https://checkout.wompi.co/p/?reference={referencia}"
                ),
                "modo": "simulado",
            },
            status=status.HTTP_201_CREATED,
        )


class WompiStatusView(APIView):
    """
    GET /api/payments/wompi/status/?compra_id=<int>
        -> devuelve el estado del pago de una compra en Wompi.

    Como la integración real con Wompi está pendiente, este endpoint
    refleja el estado del Pago más reciente asociado a la compra.
    """

    def get(self, request):
        compra_id = request.query_params.get("compra_id")

        if not compra_id:
            return Response(
                {"detail": "Se requiere 'compra_id'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pago = (
            Pago.objects
            .filter(compra_id=compra_id)
            .order_by("-fecha_pago")
            .first()
        )

        if not pago:
            return Response(
                {
                    "ok": True,
                    "compra_id": int(compra_id),
                    "estado": "pendiente",
                    "modo": "simulado",
                }
            )

        return Response(
            {
                "ok": True,
                "compra_id": int(compra_id),
                "pago_id": pago.id_pago,
                "estado": pago.estado,
                "monto": float(pago.monto),
                "referencia": pago.referencia_transaccion,
                "fecha_pago": pago.fecha_pago,
                "modo": "simulado",
            }
        )
