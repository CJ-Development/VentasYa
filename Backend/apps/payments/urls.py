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

    # Wompi — stubs para que el frontend no reciba 404 al llamar a
    # /payments/wompi/crear/ y /payments/wompi/status/. La integración
    # real con Wompi queda pendiente; por ahora devolvemos payloads
    # coherentes para que el flujo checkout→success→orders funcione
    # en producción sin romperse.
    path("wompi/crear/", WompiCrearView.as_view(), name="payments-wompi-crear"),
    path("wompi/status/", WompiStatusView.as_view(), name="payments-wompi-status"),
]

app_name = "payments"
