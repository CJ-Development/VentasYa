from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Categoria
from .serializers import CategoriaSerializer
from .services import CategoriaService


def permisos_admin_en_mutacion(self):
    """
    GET:
        Público.

    POST / PUT / DELETE:
        Requiere sesión Django con is_staff=True.
    """

    if self.request.method == "GET":
        return [AllowAny()]

    return [IsAdminUser()]


@method_decorator(
    ensure_csrf_cookie,
    name="dispatch"
)
class CategoriaView(APIView):

    authentication_classes = [
        SessionAuthentication
    ]

    get_permissions = permisos_admin_en_mutacion

    def get(self, request):

        solo_padres = self._parse_bool(
            request.query_params.get(
                "solo_padres"
            )
        )

        incluir_inactivos = self._parse_bool(
            request.query_params.get(
                "incluir_inactivos",
                "true"
            )
        )

        categorias = CategoriaService.listar(
            solo_padres=solo_padres,
            incluir_inactivos=incluir_inactivos,
        )

        serializer = CategoriaSerializer(
            categorias,
            many=True
        )

        return Response(
            serializer.data
        )

    def post(self, request):

        serializer = CategoriaSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        validated = serializer.validated_data

        validated.pop(
            "categoria_padre",
            None
        )

        categoria = CategoriaService.crear(
            validated
        )

        return Response(
            CategoriaSerializer(
                categoria
            ).data,
            status=status.HTTP_201_CREATED
        )

    @staticmethod
    def _parse_bool(value):

        if value is None:
            return False

        return str(value).lower() in (
            "true",
            "1",
            "yes"
        )


@method_decorator(
    ensure_csrf_cookie,
    name="dispatch"
)
class CategoriaDetalleView(APIView):

    authentication_classes = [
        SessionAuthentication
    ]

    get_permissions = permisos_admin_en_mutacion

    def get(self, request, id):

        categoria = CategoriaService.obtener(
            id
        )

        return Response(
            CategoriaSerializer(
                categoria
            ).data
        )

    def put(self, request, id):

        instancia = get_object_or_404(
            Categoria,
            id_categoria=id
        )

        serializer = CategoriaSerializer(
            instancia,
            data=request.data,
            partial=True
        )

        serializer.is_valid(
            raise_exception=True
        )

        validated = serializer.validated_data

        validated.pop(
            "categoria_padre",
            None
        )

        categoria = CategoriaService.actualizar(
            id,
            validated
        )

        return Response(
            CategoriaSerializer(
                categoria
            ).data
        )

    def delete(self, request, id):

        cascade = str(
            request.query_params.get(
                "cascade",
                ""
            )
        ).lower() in (
            "true",
            "1",
            "yes"
        )

        categoria = CategoriaService.eliminar(
            id
        )

        if not cascade:

            return Response(
                {
                    "estado": "archivado",
                    "id_categoria":
                        categoria.id_categoria,
                    "cascade": False,
                },
                status=status.HTTP_200_OK
            )

        from apps.products.models import Producto

        with transaction.atomic():

            ids = [
                categoria.id_categoria
            ]

            visitados = set(ids)

            pendientes = list(
                categoria.subcategorias.all()
            )

            while pendientes:

                hijo = pendientes.pop()

                if (
                    hijo.id_categoria
                    in visitados
                ):
                    continue

                visitados.add(
                    hijo.id_categoria
                )

                ids.append(
                    hijo.id_categoria
                )

                pendientes.extend(
                    hijo.subcategorias.all()
                )

            actualizados = (
                Producto.objects
                .filter(
                    categoria_id__in=ids,
                    estado="activo"
                )
                .update(
                    estado="archivado"
                )
            )

        return Response(
            {
                "estado": "archivado",
                "id_categoria":
                    categoria.id_categoria,
                "cascade": True,
                "productos_archivados":
                    actualizados,
            },
            status=status.HTTP_200_OK
        )