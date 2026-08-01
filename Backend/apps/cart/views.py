from rest_framework.views import APIView
from rest_framework.response import Response

from .serializers import CarritoSerializer
from .services import CarritoService


class CarritoView(APIView):

    def get(self, request):

        carrito = CarritoService.obtener(
            request.user
        )

        serializer = CarritoSerializer(carrito)

        return Response(serializer.data)