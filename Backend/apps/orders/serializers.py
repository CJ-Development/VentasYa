from rest_framework import serializers

from .models import *


class MetodoPagoSerializer(serializers.ModelSerializer):

    class Meta:

        model=MetodoPago

        fields="__all__"


class DetalleCompraSerializer(serializers.ModelSerializer):

    class Meta:

        model=DetalleCompra

        fields="__all__"


class CompraSerializer(serializers.ModelSerializer):

    detalles=DetalleCompraSerializer(
        many=True,
        read_only=True
    )

    class Meta:

        model=Compra

        fields="__all__"