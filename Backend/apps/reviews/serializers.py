from rest_framework import serializers

from .models import Resena


class ResenaSerializer(serializers.ModelSerializer):

    usuario_nombre = serializers.SerializerMethodField()

    calificacion = serializers.IntegerField(min_value=1, max_value=5)

    class Meta:
        model = Resena
        fields = [
            "id_resena",
            "usuario",
            "usuario_nombre",
            "producto",
            "calificacion",
            "comentario",
            "fecha",
        ]
        read_only_fields = ["id_resena", "usuario", "producto", "fecha"]

    def get_usuario_nombre(self, obj):
        return f"{obj.usuario.nombres} {obj.usuario.apellidos[:1]}.".strip()
