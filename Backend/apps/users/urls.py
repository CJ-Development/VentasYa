from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
    CambiarPasswordView,
    DireccionDetalleView,
    DireccionView,
    LoginView,
    MeView,
    RegisterView,
    UserListView,
    UsuarioDetalleView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token-verify"),

    path("me/", MeView.as_view(), name="me"),
    path("me/cambiar-password/", CambiarPasswordView.as_view(), name="me-change-password"),

    path("direcciones/", DireccionView.as_view(), name="user-direcciones"),
    path("direcciones/<int:id>/", DireccionDetalleView.as_view(), name="user-direccion-detalle"),

    path("", UserListView.as_view(), name="users"),
    path("<int:id>/", UsuarioDetalleView.as_view(), name="user-detail"),
]

app_name = "users"
