from django.urls import path

from .views import (
    MetodosPagoView,
    PagosView,
    WompiMerchantView,
    WompiWidgetDataView,
    WompiStatusView,
    WompiWebhookView,
    WompiCleanupView,
    ConfirmarPagoView,
)

urlpatterns = [
    # Catálogo y listados
    path("metodos/", MetodosPagoView.as_view(), name="payments-metodos"),
    path("", PagosView.as_view(), name="payments"),

    # Wompi — flujo Widget embebido
    path("wompi/merchant/", WompiMerchantView.as_view(), name="payments-wompi-merchant"),
    path("wompi/widget-data/", WompiWidgetDataView.as_view(), name="payments-wompi-widget-data"),
    path("wompi/status/", WompiStatusView.as_view(), name="payments-wompi-status"),
    path("wompi/webhook/", WompiWebhookView.as_view(), name="payments-wompi-webhook"),
    path("wompi/cleanup/", WompiCleanupView.as_view(), name="payments-wompi-cleanup"),

    # Confirmar pagos no-Wompi (contra entrega, transferencia)
    path("confirmar/", ConfirmarPagoView.as_view(), name="payments-confirmar"),
]

app_name = "payments"
