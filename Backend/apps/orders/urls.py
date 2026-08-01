from django.urls import path

from .views import CompraView

urlpatterns=[

    path(
        "",
        CompraView.as_view()
    ),

]