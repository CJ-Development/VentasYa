from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Categoria
from .serializers import CategoriaSerializer
from .services import CategoriaService


class CategoriaView(APIView):

    def get(self, request):

        categorias = CategoriaService.listar()

        serializer = CategoriaSerializer(
            categorias,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):

        print("=" * 50)
        print("REQUEST:")
        print(request.data)

        serializer = CategoriaSerializer(data=request.data)

        if serializer.is_valid():

            print("VALIDADO:")
            print(serializer.validated_data)

            categoria = serializer.save()

            print("GUARDADO:")
            print(categoria.id_categoria)

            return Response(
                CategoriaSerializer(categoria).data,
                status=status.HTTP_201_CREATED
            )

        print(serializer.errors)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class CategoriaDetalleView(APIView):

    def get(self, request, id):

        categoria = CategoriaService.obtener(id)

        return Response(
            CategoriaSerializer(categoria).data
        )

    def put(self, request, id):

        serializer = CategoriaSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        categoria = CategoriaService.actualizar(
            id,
            serializer.validated_data
        )

        return Response(
            CategoriaSerializer(categoria).data
        )

    def delete(self, request, id):

        CategoriaService.eliminar(id)

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )