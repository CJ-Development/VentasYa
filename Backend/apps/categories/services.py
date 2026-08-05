from .models import Categoria


class CategoriaService:

    @staticmethod
    def listar():

        return Categoria.objects.all()

    @staticmethod
    def obtener(id_categoria):

        return Categoria.objects.get(
            id_categoria=id_categoria
        )

    @staticmethod
    def crear(data):

        return Categoria.objects.create(
            **data
        )

    @staticmethod
    def actualizar(id_categoria, data):

        categoria = Categoria.objects.get(
            id_categoria=id_categoria
        )

        categoria.nombre = data["nombre"]
        categoria.descripcion = data["descripcion"]
        categoria.estado = data["estado"]

        categoria.save()

        return categoria

    @staticmethod
    def eliminar(id_categoria):

        categoria = Categoria.objects.get(
            id_categoria=id_categoria
        )

        categoria.delete()