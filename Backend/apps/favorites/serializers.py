from rest_framework import serializers

from .models import Favorito


class FavoritoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Favorito
        fields = "__all__"