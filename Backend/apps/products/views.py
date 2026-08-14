import json

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
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
    def get(self, request):
        solo_nuevos = self._parse_bool(request.query_params.get("solo_nuevos"))
        categoria_id = self._parse_int(request.query_params.get("categoria"))
        ordering = request.query_params.get("ordering") or None
        estado = request.query_params.get("estado") or None
        productos = ProductoService.listar(
            solo_nuevos=solo_nuevos,
            categoria_id=categoria_id,
            estado=estado,
            ordering=ordering,
        )
        return Response(ProductoSerializer(productos, many=True).data)

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

    def post(self, request):
        serializer = ProductoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        producto = ProductoService.crear(serializer.validated_data)
        return Response(ProductoSerializer(producto).data, status=status.HTTP_201_CREATED)


class ProductoCompletoView(APIView):
    """Single endpoint for the admin product editor.

    Accepts multipart/form-data with:
      payload: JSON containing producto + complete variantes/images state
      files: fields referenced by each image's `file_key`.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        return self._save(request, None)

    def put(self, request, id):
        return self._save(request, id)

    def _save(self, request, id):
        try:
            raw_payload = request.data.get("payload")
            if raw_payload is None:
                # JSON requests are also accepted for URL-only products.
                payload = request.data
            elif isinstance(raw_payload, str):
                payload = json.loads(raw_payload)
            else:
                payload = raw_payload

            if not isinstance(payload, dict):
                return Response({"detail": "El payload del producto no es válido."}, status=400)

            producto_data = dict(payload.get("producto") or {})
            variantes_data = [dict(v) for v in (payload.get("variantes") or [])]

            if id is not None:
                producto_data["id_producto"] = id

            serializer = ProductoSerializer(data={
                key: value for key, value in producto_data.items()
                if key != "id_producto"
            })
            serializer.is_valid(raise_exception=True)

            archivos = {key: value for key, value in request.FILES.items()}
            producto = ProductoService.guardar_completo(
                producto_data={**serializer.validated_data, "id_producto": producto_data.get("id_producto")},
                variantes_data=variantes_data,
                archivos=archivos,
            )

            return Response(
                ProductoSerializer(producto).data,
                status=status.HTTP_200_OK if id is not None else status.HTTP_201_CREATED,
            )
        except Producto.DoesNotExist:
            return Response({"detail": "Producto no encontrado."}, status=404)
        except (ValueError, TypeError, json.JSONDecodeError) as exc:
            return Response({"detail": str(exc)}, status=400)


class LowStockVariantesView(APIView):
    UMBRAL_STOCK = 5

    def get(self, request):
        variantes = (
            Variante.objects.select_related("producto")
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
        return Response(ColorSerializer(colores, many=True).data)

    def post(self, request):
        serializer = ColorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        color = serializer.save()
        return Response(ColorSerializer(color).data, status=status.HTTP_201_CREATED)


class ColorDetalleView(APIView):
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


class TallaListView(APIView):
    def get(self, request):
        tallas = Talla.objects.all().order_by("nombre")
        return Response(TallaSerializer(tallas, many=True).data)

    def post(self, request):
        serializer = TallaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        talla = serializer.save()
        return Response(TallaSerializer(talla).data, status=status.HTTP_201_CREATED)


class TallaDetalleView(APIView):
    def get(self, request, id):
        talla = get_object_or_404(Talla, id_talla=id)
        return Response(TallaSerializer(talla).data)

    def put(self, request, id):
        talla = get_object_or_404(Talla, id_talla=id)
        serializer = TallaSerializer(talla, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TallaSerializer(talla).data)

    def delete(self, request, id):
        Talla.objects.filter(id_talla=id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductoDetalleView(APIView):
    def get(self, request, id):
        producto = get_object_or_404(Producto, id_producto=id)
        return Response(ProductoSerializer(producto).data)

    def put(self, request, id):
        producto = get_object_or_404(Producto, id_producto=id)
        serializer = ProductoSerializer(producto, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        producto.refresh_from_db()
        return Response(ProductoSerializer(producto).data)

    def delete(self, request, id):
        ProductoService.eliminar(id)
        return Response({"estado": "archivado"}, status=status.HTTP_200_OK)


class ProductoReactivarView(APIView):
    def post(self, request, id):
        get_object_or_404(Producto, id_producto=id)
        producto = ProductoService.reactivar(id)
        return Response(ProductoSerializer(producto).data)


class VariantesPorProductoView(APIView):
    def get(self, request, id):
        variantes = (
            Variante.objects.select_related("color", "talla")
            .filter(producto_id=id)
            .order_by("id_variante")
        )
        return Response(VarianteSerializer(variantes, many=True).data)

    def post(self, request, id):
        get_object_or_404(Producto, id_producto=id)
        data = request.data.copy()
        data["producto_id"] = id
        serializer = VarianteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        variante = serializer.save()
        variante.refresh_from_db()
        return Response(VarianteSerializer(variante).data, status=status.HTTP_201_CREATED)


class VarianteDetalleView(APIView):
    def get(self, request, variante_id):
        variante = get_object_or_404(
            Variante.objects.select_related("color", "talla"), id_variante=variante_id
        )
        return Response(VarianteSerializer(variante).data)

    def put(self, request, variante_id):
        variante = get_object_or_404(Variante, id_variante=variante_id)
        serializer = VarianteSerializer(variante, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        variante.refresh_from_db()
        return Response(VarianteSerializer(variante).data)

    def delete(self, request, variante_id):
        Variante.objects.filter(id_variante=variante_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ImagenesPorVarianteView(APIView):
    def get(self, request, variante_id):
        imagenes = ImagenProducto.objects.filter(variante_id=variante_id).order_by("orden", "id_imagen")
        return Response(ImagenSerializer(imagenes, many=True).data)

    def post(self, request, variante_id):
        get_object_or_404(Variante, id_variante=variante_id)
        data = request.data.copy()
        data["variante"] = variante_id
        serializer = ImagenSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        imagen = serializer.save()
        return Response(ImagenSerializer(imagen).data, status=status.HTTP_201_CREATED)


class ImagenDetalleView(APIView):
    def put(self, request, imagen_id):
        imagen = get_object_or_404(ImagenProducto.objects.select_related("variante"), id_imagen=imagen_id)
        nuevo_principal = request.data.get("principal")
        if str(nuevo_principal).lower() in ("true", "1", "yes"):
            ImagenProducto.objects.filter(variante_id=imagen.variante_id, principal=True).exclude(id_imagen=imagen_id).update(principal=False)
        serializer = ImagenSerializer(imagen, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, imagen_id):
        imagen = get_object_or_404(ImagenProducto, id_imagen=imagen_id)
        ProductoService._delete_file_if_local(imagen)
        imagen.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
