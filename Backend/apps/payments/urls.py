from django.urls import path

from .views import (
    MetodosPagoView,
    PagosView,
    WompiCrearView,
    WompiStatusView,
)

urlpatterns = [
    path("metodos/", MetodosPagoView.as_view(), name="payments-metodos"),
    path("", PagosView.as_view(), name="payments"),

    # Wompi — integración real con la pasarela de pagos
    path("wompi/crear/", WompiCrearView.as_view(), name="payments-wompi-crear"),
    path("wompi/status/", WompiStatusView.as_view(), name="payments-wompi-status"),
]

app_name = "payments"
