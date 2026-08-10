from django.urls import path

from .views import OfertaView, OfertaDetalleView

urlpatterns = [
    path("", OfertaView.as_view()),
    path("<int:id>/", OfertaDetalleView.as_view()),
]

app_name = "offers"
