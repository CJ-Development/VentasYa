from .models import Favorito


class FavoritoService:

    @staticmethod
    def listar(usuario):

        return (
            Favorito.objects
            .filter(usuario=usuario)
            .select_related("producto")
            .order_by("-fecha_agregado")
        )

    @staticmethod
    def agregar(usuario, producto):

        favorito, _ = Favorito.objects.get_or_create(
            usuario=usuario,
            producto=producto,
        )

        return favorito

    @staticmethod
    def eliminar(usuario, id_favorito):

        Favorito.objects.filter(
            id_favorito=id_favorito,
            usuario=usuario,
        ).delete()
