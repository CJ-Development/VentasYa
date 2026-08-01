from .models import Compra


class CompraService:

    @staticmethod
    def listar():

        return Compra.objects.all()

    @staticmethod
    def obtener(id_compra):

        return Compra.objects.get(
            id_compra=id_compra
        )

    @staticmethod
    def crear(data):

        return Compra.objects.create(
            **data
        )

    @staticmethod
    def eliminar(id_compra):

        Compra.objects.filter(
            id_compra=id_compra
        ).delete()