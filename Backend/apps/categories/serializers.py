from rest_framework import serializers

from .models import Categoria


class CategoriaSerializer(serializers.ModelSerializer):
    """
    Serializer principal de categorías.

    Expone:
      · categoria_padre_id  → PK de la categoría padre (writable).
      · categoria_padre     → objeto anidado de solo lectura.
      · subcategorias       → lista anidada de solo lectura.
    """

    categoria_padre_id = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        source="id_categoria_padre",
        required=False,
        allow_null=True,
    )

    categoria_padre = serializers.SerializerMethodField()

    subcategorias = serializers.SerializerMethodField()

    class Meta:
        model = Categoria
        fields = [
            "id_categoria",
            "nombre",
            "descripcion",
            "estado",
            "orden",
            "categoria_padre_id",
            "categoria_padre",
            "subcategorias",
        ]

    def get_categoria_padre(self, obj):
        padre = obj.id_categoria_padre
        if not padre:
            return None
        return {
            "id_categoria": padre.id_categoria,
            "nombre": padre.nombre,
        }

    def get_subcategorias(self, obj):
        # Solo devolvemos las subcategorías si fueron precargadas
        # (caso del listado jerárquico). Si no, lista vacía.
        qs = getattr(obj, "subcategorias", None)
        if qs is None:
            return []
        return [
            {
                "id_categoria": sub.id_categoria,
                "nombre": sub.nombre,
                "estado": sub.estado,
                "orden": sub.orden,
            }
            for sub in qs.all()
        ]

    def validate(self, attrs):
        instancia = self.instance
        nuevo_padre = attrs.get("id_categoria_padre")

        # Si es creación y no llega categoria_padre_id, no hay padre.
        if instancia is None:
            return attrs

        if nuevo_padre is None:
            return attrs

        if nuevo_padre.id_categoria == instancia.id_categoria:
            raise serializers.ValidationError(
                {"categoria_padre_id": "Una categoría no puede ser su propia padre."}
            )

        if instancia.es_descendiente_de(nuevo_padre):
            raise serializers.ValidationError(
                {"categoria_padre_id": "La categoría padre seleccionada crearía un ciclo."}
            )

        return attrs
