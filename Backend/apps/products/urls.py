from django.urls import path

from .views import ProductoView

urlpatterns=[

    path(
        "",
        ProductoView.as_view()
    ),

]