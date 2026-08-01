from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import FavoritoSerializer
from .services import FavoritoService


class FavoritoView(APIView):

    def get(self, request):

        favoritos = FavoritoService.listar(
            request.user
        )

        serializer = FavoritoSerializer(
            favoritos,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):

        serializer = FavoritoSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        favorito = FavoritoService.agregar(
            serializer.validated_data
        )

        return Response(
            FavoritoSerializer(favorito).data,
            status=status.HTTP_201_CREATED
        )


class FavoritoDetalleView(APIView):

    def delete(self, request, id):

        FavoritoService.eliminar(id)

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )