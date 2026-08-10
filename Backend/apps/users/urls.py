from django.urls import path

from .views import RegisterView, LoginView, UserListView, UsuarioDetalleView, CambiarPasswordView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("", UserListView.as_view(), name="users"),
    path("<int:id>/", UsuarioDetalleView.as_view(), name="user-detail"),
    path("<int:id>/cambiar-password/", CambiarPasswordView.as_view(), name="user-change-password"),
]

app_name = "users"
