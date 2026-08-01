from django.urls import path

from .views import (
    CategoriaView,
    CategoriaDetalleView
)

urlpatterns = [

    path(
        "",
        CategoriaView.as_view()
    ),

    path(
        "<int:id>/",
        CategoriaDetalleView.as_view()
    ),

]