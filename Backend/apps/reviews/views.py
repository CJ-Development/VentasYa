from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Producto

from .models import Resena
from .serializers import ResenaSerializer
from .services import ResenaService


class ResenaView(APIView):
    """
    GET  /api/reviews/producto/<id_producto>/  -> reseñas del producto (público)
    POST /api/reviews/producto/<id_producto>/  -> crea/actualiza la reseña del usuario
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, id_producto):

        resenas = ResenaService.listar_producto(id_producto)

        return Response(ResenaSerializer(resenas, many=True).data)

    def post(self, request, id_producto):

        producto = get_object_or_404(Producto, id_producto=id_producto)

        serializer = ResenaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resena = ResenaService.crear_o_actualizar(
            usuario=request.user,
            producto=producto,
            calificacion=serializer.validated_data["calificacion"],
            comentario=serializer.validated_data["comentario"],
        )

        return Response(
            ResenaSerializer(resena).data,
            status=status.HTTP_201_CREATED,
        )


class ResenaDetalleView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, id):

        resena = get_object_or_404(Resena, id_resena=id)

        if not (
            resena.usuario_id == request.user.pk
            or request.user.es_administrador
        ):
            return Response(
                {"detail": "No tienes permiso sobre esta reseña."},
                status=status.HTTP_403_FORBIDDEN,
            )

        resena.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
