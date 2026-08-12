from django.urls import path

from .views import MetodosPagoView, PagosView

urlpatterns = [
    path("metodos/", MetodosPagoView.as_view(), name="payments-metodos"),
    path("", PagosView.as_view(), name="payments"),
]

app_name = "payments"
