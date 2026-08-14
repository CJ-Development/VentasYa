from .models import Resena


class ResenaService:

    @staticmethod
    def listar_producto(id_producto):

        return (
            Resena.objects
            .filter(producto_id=id_producto)
            .select_related("usuario")
            .order_by("-fecha")
        )

    @staticmethod
    def crear_o_actualizar(*, usuario, producto, calificacion, comentario):
        """
        Un usuario tiene como máximo una reseña por producto
        (`unique_together`), así que volver a publicar la actualiza.
        """

        resena, _ = Resena.objects.update_or_create(
            usuario=usuario,
            producto=producto,
            defaults={
                "calificacion": calificacion,
                "comentario": comentario,
            },
        )

        return resena

    @staticmethod
    def eliminar(id_resena):

        Resena.objects.filter(
            id_resena=id_resena
        ).delete()
