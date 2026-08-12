from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.orders.models import MetodoPago
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
