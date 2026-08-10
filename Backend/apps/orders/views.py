from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Compra
from .serializers import CompraSerializer

from .services import CompraService


class CompraView(APIView):

    def get(self,request):

        compras=CompraService.listar()

        serializer=CompraSerializer(
            compras,
            many=True
        )

        return Response(serializer.data)


    def post(self,request):

        serializer=CompraSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        compra=CompraService.crear(
            serializer.validated_data
        )

        return Response(

            CompraSerializer(compra).data,

            status=status.HTTP_201_CREATED
        )


class CompraDetalleView(APIView):

    ESTADOS_VALIDOS = ["pendiente", "pagado", "enviado", "entregado", "cancelado"]

    CAMPOS_PERMITIDOS = {"estado_compra", "telefono_contacto"}

    def get(self, request, id):

        compra = get_object_or_404(Compra, id_compra=id)

        return Response(CompraSerializer(compra).data)

    def put(self, request, id):

        compra = get_object_or_404(Compra, id_compra=id)

        nuevo_estado = request.data.get("estado_compra")

        if nuevo_estado and nuevo_estado not in self.ESTADOS_VALIDOS:

            return Response(
                {"estado_compra": f"Estado inválido. Use uno de: {self.ESTADOS_VALIDOS}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data_filtrada = {

            k: v for k, v in request.data.items() if k in self.CAMPOS_PERMITIDOS

        }

        compra_actualizada = CompraService.actualizar(id, data_filtrada)

        return Response(CompraSerializer(compra_actualizada).data)

    def delete(self, request, id):

        CompraService.eliminar(id)

        return Response(status=status.HTTP_204_NO_CONTENT)


class MisPedidosView(APIView):

    def get(self, request):

        usuario_id = (
            request.query_params.get("usuario_id")
            or request.query_params.get("usuario")
        )

        if not usuario_id:

            return Response(
                {"detail": "Se requiere el parámetro 'usuario_id'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pedidos = (
            Compra.objects
            .filter(usuario_id=usuario_id)
            .select_related("metodo_pago")
            .prefetch_related("detalles")
            .order_by("-fecha_compra")
        )

        return Response(CompraSerializer(pedidos, many=True).data)