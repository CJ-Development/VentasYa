from rest_framework.pagination import PageNumberPagination


class OptionalPageNumberPagination(PageNumberPagination):
    """
    Paginación opt-in.

    Se activa solo si la petición trae `?page` o `?page_size`, de modo que
    los clientes existentes que esperan una lista plana siguen funcionando
    mientras que las vistas nuevas pueden pedir páginas.
    """

    page_size_query_param = "page_size"
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        if not (
            self.page_query_param in request.query_params
            or self.page_size_query_param in request.query_params
        ):
            return None

        return super().paginate_queryset(queryset, request, view)
