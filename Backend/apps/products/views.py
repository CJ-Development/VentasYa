from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .services import ProductoService
from .serializers import ProductoSerializer


class ProductoView(APIView):

    def get(self,request):

        productos=ProductoService.listar()

        return Response(

            ProductoSerializer(
                productos,
                many=True
            ).data
        )


    def post(self,request):

        serializer=ProductoSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        producto=ProductoService.crear(
            serializer.validated_data
        )

        return Response(

            ProductoSerializer(producto).data,

            status=status.HTTP_201_CREATED
        )