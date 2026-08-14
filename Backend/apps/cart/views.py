from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import SizeVariant

from .models import ItemCarrito
from .serializers import CarritoSerializer, ItemCarritoSerializer
from .services import CarritoService


class CarritoView(APIView):
    """Carrito del usuario autenticado."""

    permission_classes = [IsAuthenticated]

    def get(self, request):

        carrito = CarritoService.obtener(request.user)

        return Response(CarritoSerializer(carrito).data)

    def post(self, request):

        variante_id = request.data.get("variante_id")

        if not variante_id:

            return Response(
                {"detail": "Se requiere 'variante_id'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            cantidad = int(request.data.get("cantidad", 1))
        except (TypeError, ValueError):
            return Response(
                {"detail": "'cantidad' debe ser un entero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if cantidad < 1:
            return Response(
                {"detail": "'cantidad' debe ser mayor o igual a 1."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        variante = get_object_or_404(SizeVariant, id_size_variant=variante_id)

        carrito = CarritoService.obtener(request.user)

        cantidad_actual = (
            carrito.items
            .filter(variante=variante)
            .values_list("cantidad", flat=True)
            .first()
            or 0
        )

        if cantidad_actual + cantidad > variante.stock:
            return Response(
                {
                    "detail": (
                        f"Stock insuficiente. Disponible: {variante.stock}, "
                        f"en tu carrito: {cantidad_actual}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        item = CarritoService.agregar(carrito, variante, cantidad)

        return Response(
            ItemCarritoSerializer(item).data,
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request):
        """Vacía el carrito completo."""

        CarritoService.vaciar(CarritoService.obtener(request.user))

        return Response(status=status.HTTP_204_NO_CONTENT)


class ItemCarritoDetalleView(APIView):

    permission_classes = [IsAuthenticated]

    def _get_item(self, request, id_item):
        return get_object_or_404(
            ItemCarrito.objects.select_related("variante"),
            id_item=id_item,
            carrito__usuario=request.user,
        )

    def put(self, request, id_item):

        item = self._get_item(request, id_item)

        cantidad = request.data.get("cantidad")

        if cantidad is None:

            return Response(
                {"detail": "Se requiere 'cantidad'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            cantidad = int(cantidad)

        except (TypeError, ValueError):

            return Response(
                {"detail": "'cantidad' debe ser un entero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if cantidad < 1:

            return Response(
                {"detail": "'cantidad' debe ser mayor o igual a 1."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if cantidad > item.variante.stock:

            return Response(
                {
                    "detail": (
                        f"Stock insuficiente. Disponible: {item.variante.stock}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.cantidad = cantidad

        item.save(update_fields=["cantidad"])

        return Response(ItemCarritoSerializer(item).data)

    def delete(self, request, id_item):

        item = self._get_item(request, id_item)

        item.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
