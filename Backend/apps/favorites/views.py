from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Producto

from .models import Favorito
from .serializers import FavoritoSerializer
from .services import FavoritoService


class FavoritoView(APIView):
    """Favoritos del usuario autenticado."""

    permission_classes = [IsAuthenticated]

    def get(self, request):

        favoritos = FavoritoService.listar(request.user)

        return Response(FavoritoSerializer(favoritos, many=True).data)

    def post(self, request):

        producto_id = request.data.get("producto_id")

        if not producto_id:

            return Response(
                {"detail": "Se requiere 'producto_id'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        producto = get_object_or_404(Producto, id_producto=producto_id)

        favorito, creado = Favorito.objects.get_or_create(
            usuario=request.user,
            producto=producto,
        )

        return Response(
            FavoritoSerializer(favorito).data,
            status=status.HTTP_201_CREATED if creado else status.HTTP_200_OK,
        )


class FavoritoDetalleView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, id):

        favorito = get_object_or_404(
            Favorito,
            id_favorito=id,
            usuario=request.user,
        )

        favorito.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
