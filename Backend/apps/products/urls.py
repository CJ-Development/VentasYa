from django.urls import path

from .views import (
    ProductoView,
    ProductoDetalleView,
    ProductoReactivarView,
    ProductoCrearCompletoView,
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
    # Productos
    path(
        "crear-completo/",
        ProductoCrearCompletoView.as_view(),
        name="producto-crear-completo"
    ),

    path(
        "",
        ProductoView.as_view(),
        name="productos"
    ),

    path(
        "<int:id>/",
        ProductoDetalleView.as_view(),
        name="producto-detalle"
    ),

    path(
        "<int:id>/reactivar/",
        ProductoReactivarView.as_view(),
        name="producto-reactivar"
    ),

    # Variantes de color
    path(
        "<int:producto_id>/colores/",
        ColorVariantListView.as_view(),
        name="producto-colores"
    ),

    path(
        "colores/<int:variante_id>/",
        ColorVariantDetailView.as_view(),
        name="color-variante-detalle"
    ),

    # Tallas
    path(
        "colores/<int:color_variant_id>/tallas/",
        SizeVariantListView.as_view(),
        name="color-tallas"
    ),

    path(
        "tallas/<int:size_variant_id>/",
        SizeVariantDetailView.as_view(),
        name="talla-variante-detalle"
    ),

    # Imágenes
    path(
        "colores/<int:color_variant_id>/imagenes/",
        ImagenesPorColorVariantView.as_view(),
        name="color-imagenes"
    ),

    path(
        "imagenes/<int:imagen_id>/",
        ImagenDetalleView.as_view(),
        name="imagen-detalle"
    ),

    # Stock
    path(
        "low-stock/",
        LowStockVariantesView.as_view(),
        name="low-stock"
    ),

    # Catálogo de colores
    path(
        "colores-global/",
        ColorListView.as_view(),
        name="colores-global"
    ),

    path(
        "colores-global/<int:id>/",
        ColorDetalleView.as_view(),
        name="color-global-detalle"
    ),
]

app_name = "products"