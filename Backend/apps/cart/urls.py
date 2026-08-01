from django.urls import path

from .views import CarritoView

urlpatterns = [

    path(
        "",
        CarritoView.as_view()
    ),

]