from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from .serializers import ResenaSerializer
from .services import ResenaService


@method_decorator(ensure_csrf_cookie, name="dispatch")
class ResenaView(APIView):

    def get(self, request, id_producto):

        resenas = ResenaService.listar_producto(
            id_producto
        )

        serializer = ResenaSerializer(
            resenas,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):

        serializer = ResenaSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        resena = ResenaService.crear(
            serializer.validated_data
        )

        return Response(
            ResenaSerializer(resena).data,
            status=status.HTTP_201_CREATED
        )


@method_decorator(ensure_csrf_cookie, name="dispatch")
class ResenaDetalleView(APIView):

    def delete(self, request, id):

        ResenaService.eliminar(id)

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )