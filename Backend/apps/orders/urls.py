from django.urls import path

from .views import CheckoutView, CompraDetalleView, CompraView, MisPedidosView

urlpatterns = [
    path("", CompraView.as_view()),
    path("mis-pedidos/", MisPedidosView.as_view()),
    path("checkout/", CheckoutView.as_view()),
    path("<int:id>/", CompraDetalleView.as_view()),
]

app_name = "orders"
