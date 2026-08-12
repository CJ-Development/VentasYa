from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import MetodoPago
from utils.permissions import IsAdministrador

from .models import Pago
from .serializers import MetodoPagoCatalogoSerializer, PagoSerializer


class MetodosPagoView(APIView):
    """
    GET /api/payments/metodos/  -> catálogo público de métodos de pago
    disponibles para el checkout.
    """

    permission_classes = [AllowAny]

    def get(self, request):

        metodos = MetodoPago.objects.all().order_by("tipo")

        data = [MetodoPagoCatalogoSerializer.from_model(m) for m in metodos]

        return Response(data)


class PagosView(APIView):
    """
    GET /api/payments/?compra_id=X  -> pagos de una compra (administradores).

    Los pagos NO se crean por API: los genera el checkout dentro de la
    transacción de compra (y en el futuro el webhook de la pasarela).
    """

    permission_classes = [IsAdministrador]

    def get(self, request):

        compra_id = request.query_params.get("compra_id")

        qs = Pago.objects.select_related("metodo_pago").all().order_by("-fecha_pago")

        if compra_id:
            qs = qs.filter(compra_id=compra_id)

        return Response(PagoSerializer(qs, many=True).data)
