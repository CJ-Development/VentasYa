from django.urls import path

from .views import (
    ResenaView,
    ResenaDetalleView
)

urlpatterns = [

    path(
        "producto/<int:id_producto>/",
        ResenaView.as_view()
    ),

    path(
        "<int:id>/",
        ResenaDetalleView.as_view()
    ),

]