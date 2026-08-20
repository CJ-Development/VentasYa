from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Categoria
from .serializers import CategoriaSerializer
from .services import CategoriaService


def _permisos_admin_en_mutacion(self):
    """
    Helper común: GET es público (catálogo), cualquier
    mutación requiere usuario staff (IsAdminUser).
    """
    if self.request.method == "GET":
        return [AllowAny()]
    return [IsAdminUser()]


# ensure_csrf_cookie en las vistas admin: cada respuesta del backend
# garantiza que el navegador tiene la cookie `csrftoken`. Sin esto,
# el admin entra → GET /categories/ abre sesión pero NO emite
# csrftoken → POST /categories/ siguiente llega sin X-CSRFToken
# → DRF responde 403 "CSRF Failed: CSRF token missing".
# Aplicar el decorador tanto en el listado como en el detalle
# cubre todos los flujos admin (crear, editar, archivar).
@method_decorator(ensure_csrf_cookie, name="dispatch")
class CategoriaView(APIView):
    """
    GET /categories/                   → listado jerárquico (padres + hijos).
    GET /categories/?solo_padres=true  → solo categorías principales.
    GET /categories/?incluir_inactivos=false → solo activas.

    POST /categories/ crea una categoría (o subcategoría si llega
    `categoria_padre_id`). Requiere staff.
    """

    get_permissions = _permisos_admin_en_mutacion

    def get(self, request):
        solo_padres = self._parse_bool(request.query_params.get("solo_padres"))
        incluir_inactivos = self._parse_bool(
            request.query_params.get("incluir_inactivos", "true")
        )

        categorias = CategoriaService.listar(
            solo_padres=solo_padres,
            incluir_inactivos=incluir_inactivos,
        )

        serializer = CategoriaSerializer(categorias, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CategoriaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated = serializer.validated_data
        validated.pop("categoria_padre", None)  # viene del método, no se guarda

        categoria = CategoriaService.crear(validated)
        return Response(
            CategoriaSerializer(categoria).data,
            status=status.HTTP_201_CREATED,
        )

    @staticmethod
    def _parse_bool(value):
        if value is None:
            return False
        return str(value).lower() in ("true", "1", "yes")


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CategoriaDetalleView(APIView):
    """
    GET    /categories/<id>/           → público.
    PUT    /categories/<id>/           → staff.
    DELETE /categories/<id>/           → archivado simple (staff).
    DELETE /categories/<id>/?cascade=true → archiva también los productos
                                            vinculados (staff).
    """

    get_permissions = _permisos_admin_en_mutacion

    def get(self, request, id):
        categoria = CategoriaService.obtener(id)
        return Response(CategoriaSerializer(categoria).data)

    def put(self, request, id):
        instancia = get_object_or_404(Categoria, id_categoria=id)
        serializer = CategoriaSerializer(instancia, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        validated = serializer.validated_data
        validated.pop("categoria_padre", None)

        categoria = CategoriaService.actualizar(id, validated)
        return Response(CategoriaSerializer(categoria).data)

    def delete(self, request, id):
        cascade = str(request.query_params.get("cascade", "")).lower() in (
            "true",
            "1",
            "yes",
        )

        # Primero archivamos la categoría (y descendientes) en cascada
        # dentro del service.
        categoria = CategoriaService.eliminar(id)

        if not cascade:
            return Response(
                {
                    "estado": "archivado",
                    "id_categoria": categoria.id_categoria,
                    "cascade": False,
                },
                status=status.HTTP_200_OK,
            )

        # Cascade a productos vinculados a la categoría archivada
        # y a todas sus descendientes.
        from apps.products.models import Producto

        with transaction.atomic():
            ids = [categoria.id_categoria]
            visitados = set(ids)
            pendientes = list(categoria.subcategorias.all())
            while pendientes:
                hijo = pendientes.pop()
                if hijo.id_categoria in visitados:
                    continue
                visitados.add(hijo.id_categoria)
                ids.append(hijo.id_categoria)
                pendientes.extend(hijo.subcategorias.all())

            actualizados = Producto.objects.filter(
                categoria_id__in=ids, estado="activo"
            ).update(estado="archivado")

        return Response(
            {
                "estado": "archivado",
                "id_categoria": categoria.id_categoria,
                "cascade": True,
                "productos_archivados": actualizados,
            },
            status=status.HTTP_200_OK,
        )
