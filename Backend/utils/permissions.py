from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdministrador(BasePermission):
    """Solo usuarios autenticados con rol administrador."""

    message = "Se requieren permisos de administrador."

    def has_permission(self, request, view):
        usuario = request.user

        return bool(
            usuario
            and usuario.is_authenticated
            and getattr(usuario, "es_administrador", False)
        )


class IsAdministradorOrReadOnly(BasePermission):
    """Lectura pública; escritura solo para administradores."""

    message = "Se requieren permisos de administrador para modificar este recurso."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        return IsAdministrador().has_permission(request, view)


class IsOwnerOrAdmin(BasePermission):
    """
    Permiso a nivel de objeto: el dueño del recurso o un administrador.

    El objeto debe exponer el dueño en `usuario` o ser el propio Usuario.
    """

    message = "No tienes permiso sobre este recurso."

    def has_object_permission(self, request, view, obj):
        usuario = request.user

        if not (usuario and usuario.is_authenticated):
            return False

        if getattr(usuario, "es_administrador", False):
            return True

        dueno = getattr(obj, "usuario", obj)

        return getattr(dueno, "pk", None) == usuario.pk
