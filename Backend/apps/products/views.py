from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Producto, Variante, Color, Talla, ImagenProducto
from .serializers import (
    VarianteSerializer,
    ProductoSerializer,
    ColorSerializer,
    TallaSerializer,
    ImagenSerializer,
)
from .services import ProductoService


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


class LowStockVariantesView(APIView):

    UMBRAL_STOCK = 5

    def get(self, request):

        variantes = (
            Variante.objects
            .select_related("producto")
            .filter(stock__lt=self.UMBRAL_STOCK)
            .order_by("stock")
        )

        data = [
            {
                "id_variante": v.id_variante,
                "sku": v.sku,
                "stock": v.stock,
                "producto_id": v.producto.id_producto,
                "producto_nombre": v.producto.nombre,
            }
            for v in variantes
        ]

        return Response(data)


class ColorListView(APIView):

    def get(self, request):

        colores = Color.objects.all().order_by("nombre")

        return Response(
            ColorSerializer(colores, many=True).data
        )


class TallaListView(APIView):

    def get(self, request):

        tallas = Talla.objects.all().order_by("nombre")

        return Response(
            TallaSerializer(tallas, many=True).data
        )


class ProductoDetalleView(APIView):

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

    def post(self, request, id):

        producto = get_object_or_404(Producto, id_producto=id)

        producto = ProductoService.reactivar(id)

        return Response(
            ProductoSerializer(producto).data
        )


class VariantesPorProductoView(APIView):

    def get(self, request, id):

        variantes = (
            Variante.objects
            .select_related("color", "talla")
            .filter(producto_id=id)
            .order_by("id_variante")
        )

        return Response(
            VarianteSerializer(variantes, many=True).data
        )

    def post(self, request, id):

        get_object_or_404(Producto, id_producto=id)

        data = dict(request.data)
        data["producto_id"] = id

        serializer = VarianteSerializer(data=data)

        serializer.is_valid(raise_exception=True)

        variante = serializer.save()

        variante.refresh_from_db()

        return Response(
            VarianteSerializer(variante).data,
            status=status.HTTP_201_CREATED
        )


class VarianteDetalleView(APIView):

    def get(self, request, variante_id):

        variante = get_object_or_404(
            Variante.objects.select_related("color", "talla"),
            id_variante=variante_id
        )

        return Response(
            VarianteSerializer(variante).data
        )

    def put(self, request, variante_id):

        variante = get_object_or_404(Variante, id_variante=variante_id)

        serializer = VarianteSerializer(variante, data=request.data)

        serializer.is_valid(raise_exception=True)

        serializer.save()

        variante.refresh_from_db()

        return Response(
            VarianteSerializer(variante).data
        )

    def delete(self, request, variante_id):

        Variante.objects.filter(id_variante=variante_id).delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


class ImagenesPorVarianteView(APIView):

    def get(self, request, variante_id):

        imagenes = ImagenProducto.objects.filter(
            variante_id=variante_id
        ).order_by("orden", "id_imagen")

        return Response(
            ImagenSerializer(imagenes, many=True).data
        )

    def post(self, request, variante_id):

        get_object_or_404(Variante, id_variante=variante_id)

        data = dict(request.data)
        data["variante"] = variante_id

        serializer = ImagenSerializer(data=data)

        serializer.is_valid(raise_exception=True)

        imagen = serializer.save()

        return Response(
            ImagenSerializer(imagen).data,
            status=status.HTTP_201_CREATED
        )


class ImagenDetalleView(APIView):

    def put(self, request, imagen_id):

        imagen = get_object_or_404(
            ImagenProducto.objects.select_related("variante"),
            id_imagen=imagen_id,
        )

        # Si se marca como principal, desmarcar las demás de la misma variante.
        nuevo_principal = request.data.get("principal")

        if str(nuevo_principal).lower() in ("true", "1", "yes"):

            ImagenProducto.objects.filter(
                variante_id=imagen.variante_id,
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