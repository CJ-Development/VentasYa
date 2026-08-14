from django.urls import path

from .views import (
    ProductoView,
    ProductoDetalleView,
    ProductoCompletoView,
    ProductoReactivarView,
    LowStockVariantesView,
    ColorListView,
    ColorDetalleView,
    TallaListView,
    TallaDetalleView,
    VariantesPorProductoView,
    VarianteDetalleView,
    ImagenesPorVarianteView,
    ImagenDetalleView,
)

urlpatterns = [
    path("", ProductoView.as_view()),
    path("completo/", ProductoCompletoView.as_view()),
    path("<int:id>/", ProductoDetalleView.as_view()),
    path("<int:id>/completo/", ProductoCompletoView.as_view()),
    path("<int:id>/reactivar/", ProductoReactivarView.as_view()),
    path("<int:id>/variantes/", VariantesPorProductoView.as_view()),
    path("variantes/<int:variante_id>/", VarianteDetalleView.as_view()),
    path("variantes/<int:variante_id>/imagenes/", ImagenesPorVarianteView.as_view()),
    path("imagenes/<int:imagen_id>/", ImagenDetalleView.as_view()),
    path("low-stock/", LowStockVariantesView.as_view()),
    path("colores/", ColorListView.as_view()),
    path("colores/<int:id>/", ColorDetalleView.as_view()),
    path("tallas/", TallaListView.as_view()),
    path("tallas/<int:id>/", TallaDetalleView.as_view()),
]

app_name = "products"
