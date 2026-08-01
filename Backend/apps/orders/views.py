from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

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