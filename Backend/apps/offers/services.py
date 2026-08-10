from .models import Oferta


class OfertaService:

    @staticmethod
    def listar():
        return Oferta.objects.select_related("producto").order_by("-fecha_inicio")

    @staticmethod
    def obtener(id_oferta):
        return OfertaService.listar().get(id_oferta=id_oferta)

    @staticmethod
    def crear(data):
        return Oferta.objects.create(**data)

    @staticmethod
    def actualizar(id_oferta, data):
        oferta = Oferta.objects.get(id_oferta=id_oferta)

        for campo, valor in data.items():
            setattr(oferta, campo, valor)

        oferta.save()
        return oferta

    @staticmethod
    def eliminar(id_oferta):
        Oferta.objects.filter(id_oferta=id_oferta).delete()
