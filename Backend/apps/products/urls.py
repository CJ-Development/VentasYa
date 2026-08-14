from django.urls import path

from .views import (
    ProductoView,
    ProductoDetalleView,
    ProductoReactivarView,
    LowStockVariantesView,
    ColorListView,
    ColorDetalleView,
    ColorVariantListView,
    ColorVariantDetailView,
    SizeVariantListView,
    SizeVariantDetailView,
    ImagenesPorColorVariantView,
    ImagenDetalleView,
)

urlpatterns = [
    path(
        "",
        ProductoView.as_view()
    ),
    path(
        "<int:id>/",
        ProductoDetalleView.as_view()
    ),
    path(
        "<int:id>/reactivar/",
        ProductoReactivarView.as_view()
    ),
    path(
        "<int:id>/colores/",
        ColorVariantListView.as_view()
    ),
    path(
        "colores/<int:variante_id>/",
        ColorVariantDetailView.as_view()
    ),
    path(
        "colores/<int:color_variant_id>/tallas/",
        SizeVariantListView.as_view()
    ),
    path(
        "tallas/<int:size_variant_id>/",
        SizeVariantDetailView.as_view()
    ),
    path(
        "colores/<int:color_variant_id>/imagenes/",
        ImagenesPorColorVariantView.as_view()
    ),
    path(
        "imagenes/<int:imagen_id>/",
        ImagenDetalleView.as_view()
    ),
    path(
        "low-stock/",
        LowStockVariantesView.as_view()
    ),
    path(
        "colores-global/",
        ColorListView.as_view()
    ),
    path(
        "colores-global/<int:id>/",
        ColorDetalleView.as_view()
    ),
]

app_name = "products"
