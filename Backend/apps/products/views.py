import json

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

from .models import Producto, ColorVariant, SizeVariant, ImagenProducto, Color
from .serializers import (
    SizeVariantSerializer,
    ColorVariantSerializer,
    ProductoSerializer,
    ColorSerializer,
    ImagenSerializer,
)
from .services import ProductoService

from utils.permissions import IsAdministrador, IsAdministradorOrReadOnly


class ProductoView(APIView):

    permission_classes = [IsAdministradorOrReadOnly]

    def get(self, request):

        solo_nuevos = self._parse_bool(
            request.query_params.get("solo_nuevos")
        )
        categoria_id = self._parse_int(
            request.query_params.get("categoria")
        )
        ordering = request.query_params.get("ordering") or None
        estado = request.query_params.get("estado") or None

        productos = ProductoService.listar(
            solo_nuevos=solo_nuevos,
            categoria_id=categoria_id,
            estado=estado,
            ordering=ordering,
        )

        return Response(
            ProductoSerializer(productos, many=True).data
        )


    @staticmethod
    def _parse_bool(value):
        if value is None:
            return False
        return str(value).lower() in ("true", "1", "yes")


    @staticmethod
    def _parse_int(value):
        if value is None or value == "":
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            return None


    def post(self,request):

        serializer=ProductoSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        producto=serializer.save()

        return Response(

            ProductoSerializer(producto).data,

            status=status.HTTP_201_CREATED
        )


class ProductoCrearCompletoView(APIView):

    permission_classes = [IsAdministrador]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        raw_data = request.data.get("data")

        if not raw_data:
            return Response(
                {"detail": "Falta el campo 'data' con el payload JSON."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payload = json.loads(raw_data)
        except (TypeError, ValueError):
            return Response(
                {"detail": "El campo 'data' no es un JSON válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(payload, dict):
            return Response(
                {"detail": "El payload debe ser un objeto JSON."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        producto = ProductoService.crear_completo(
            data=payload,
            archivos=request.FILES,
        )

        return Response(
            ProductoSerializer(producto).data,
            status=status.HTTP_201_CREATED,
        )


class LowStockVariantesView(APIView):

    permission_classes = [IsAdministrador]

    UMBRAL_STOCK = 5

    def get(self, request):

        size_variants = (
            SizeVariant.objects
            .select_related("color_variant__producto", "color_variant__color")
            .filter(stock__lt=self.UMBRAL_STOCK)
            .order_by("stock")
        )

        data = [
            {
                "id_size_variant": sv.id_size_variant,
                "sku": sv.sku,
                "stock": sv.stock,
                "talla": sv.talla,
                "color": sv.color_variant.color.nombre if sv.color_variant.color else None,
                "producto_id": sv.color_variant.producto.id_producto,
                "producto_nombre": sv.color_variant.producto.nombre,
            }
            for sv in size_variants
        ]

        return Response(data)


class ColorListView(APIView):

    permission_classes = [IsAdministradorOrReadOnly]

    def get(self, request):

        colores = Color.objects.all().order_by("nombre")

        return Response(
            ColorSerializer(colores, many=True).data
        )

    def post(self, request):

        serializer = ColorSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        color = serializer.save()

        return Response(
            ColorSerializer(color).data,
            status=status.HTTP_201_CREATED,
        )


class ColorDetalleView(APIView):

    permission_classes = [IsAdministradorOrReadOnly]

    def get(self, request, id):

        color = get_object_or_404(Color, id_color=id)

        return Response(ColorSerializer(color).data)

    def put(self, request, id):

        color = get_object_or_404(Color, id_color=id)

        serializer = ColorSerializer(color, data=request.data)

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(ColorSerializer(color).data)

    def delete(self, request, id):

        Color.objects.filter(id_color=id).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductoDetalleView(APIView):

    permission_classes = [IsAdministradorOrReadOnly]

    def get(self, request, id):

        producto = get_object_or_404(Producto, id_producto=id)

        return Response(
            ProductoSerializer(producto).data
        )

    def put(self, request, id):

        producto = get_object_or_404(Producto, id_producto=id)

        serializer = ProductoSerializer(
            producto,
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        producto.refresh_from_db()

        return Response(
            ProductoSerializer(producto).data
        )

    def delete(self, request, id):

        ProductoService.eliminar(id)

        return Response(
            {"estado": "archivado"},
            status=status.HTTP_200_OK
        )


class ProductoReactivarView(APIView):

    permission_classes = [IsAdministrador]

    def post(self, request, id):

        producto = get_object_or_404(Producto, id_producto=id)

        producto = ProductoService.reactivar(id)

        return Response(
            ProductoSerializer(producto).data
        )


class ColorVariantListView(APIView):

    permission_classes = [IsAdministradorOrReadOnly]

    def get(self, request, producto_id):

        color_variants = (
            ColorVariant.objects
            .select_related("color")
            .filter(producto_id=producto_id)
            .order_by("id_variante")
        )

        return Response(
            ColorVariantSerializer(color_variants, many=True).data
        )

    def post(self, request, producto_id):

        get_object_or_404(Producto, id_producto=producto_id)

        data = request.data.copy()
        data["producto_id"] = producto_id

        serializer = ColorVariantSerializer(data=data)

        serializer.is_valid(raise_exception=True)

        color_variant = serializer.save()

        color_variant.refresh_from_db()

        return Response(
            ColorVariantSerializer(color_variant).data,
            status=status.HTTP_201_CREATED
        )


class ColorVariantDetailView(APIView):

    permission_classes = [IsAdministradorOrReadOnly]

    def get(self, request, variante_id):

        color_variant = get_object_or_404(
            ColorVariant.objects.select_related("color", "producto"),
            id_variante=variante_id
        )

        return Response(
            ColorVariantSerializer(color_variant).data
        )

    def put(self, request, variante_id):

        color_variant = get_object_or_404(ColorVariant, id_variante=variante_id)

        serializer = ColorVariantSerializer(
            color_variant,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        color_variant.refresh_from_db()

        return Response(
            ColorVariantSerializer(color_variant).data
        )

    def delete(self, request, variante_id):

        ColorVariant.objects.filter(id_variante=variante_id).delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


class SizeVariantListView(APIView):

    permission_classes = [IsAdministradorOrReadOnly]

    def get(self, request, color_variant_id):

        size_variants = (
            SizeVariant.objects
            .filter(color_variant_id=color_variant_id)
            .order_by("id_size_variant")
        )

        return Response(
            SizeVariantSerializer(size_variants, many=True).data
        )

    def post(self, request, color_variant_id):

        get_object_or_404(ColorVariant, id_variante=color_variant_id)

        data = request.data.copy()
        data["color_variant_id"] = color_variant_id

        serializer = SizeVariantSerializer(data=data)

        serializer.is_valid(raise_exception=True)

        size_variant = serializer.save()

        return Response(
            SizeVariantSerializer(size_variant).data,
            status=status.HTTP_201_CREATED
        )


class SizeVariantDetailView(APIView):

    permission_classes = [IsAdministradorOrReadOnly]

    def get(self, request, size_variant_id):

        size_variant = get_object_or_404(SizeVariant, id_size_variant=size_variant_id)

        return Response(
            SizeVariantSerializer(size_variant).data
        )

    def put(self, request, size_variant_id):

        size_variant = get_object_or_404(SizeVariant, id_size_variant=size_variant_id)

        serializer = SizeVariantSerializer(
            size_variant,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(
            SizeVariantSerializer(size_variant).data
        )

    def delete(self, request, size_variant_id):

        SizeVariant.objects.filter(id_size_variant=size_variant_id).delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


class ImagenesPorColorVariantView(APIView):

    permission_classes = [IsAdministradorOrReadOnly]

    def get(self, request, color_variant_id):

        imagenes = ImagenProducto.objects.filter(
            color_variant_id=color_variant_id
        ).order_by("orden", "id_imagen")

        return Response(
            ImagenSerializer(imagenes, many=True).data
        )

    def post(self, request, color_variant_id):

        get_object_or_404(ColorVariant, id_variante=color_variant_id)

        data = request.data.copy()
        data["color_variant"] = color_variant_id

        serializer = ImagenSerializer(data=data)

        serializer.is_valid(raise_exception=True)

        imagen = serializer.save()

        return Response(
            ImagenSerializer(imagen).data,
            status=status.HTTP_201_CREATED
        )


class ImagenDetalleView(APIView):

    permission_classes = [IsAdministrador]

    def put(self, request, imagen_id):

        imagen = get_object_or_404(
            ImagenProducto.objects.select_related("color_variant"),
            id_imagen=imagen_id,
        )

        nuevo_principal = request.data.get("principal")

        if str(nuevo_principal).lower() in ("true", "1", "yes"):

            ImagenProducto.objects.filter(
                color_variant_id=imagen.color_variant_id,
                principal=True,
            ).exclude(id_imagen=imagen_id).update(principal=False)

        serializer = ImagenSerializer(
            imagen,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(serializer.data)

    def delete(self, request, imagen_id):

        ImagenProducto.objects.filter(id_imagen=imagen_id).delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )
