import pytest

pytestmark = pytest.mark.django_db


def test_registro_devuelve_tokens_y_no_expone_password(api, rol_cliente):
    resp = api.post(
        "/api/users/register/",
        {
            "nombres": "Ana",
            "apellidos": "Pérez",
            "email": "nueva@ventasya.test",
            "password": "Clave-Segura-123",
        },
        format="json",
    )

    assert resp.status_code == 201
    assert "access" in resp.data and "refresh" in resp.data
    assert "password" not in resp.data["usuario"]


def test_login_con_email_inexistente_devuelve_401(api):
    resp = api.post(
        "/api/users/login/",
        {"email": "noexiste@ventasya.test", "password": "loquesea"},
        format="json",
    )

    assert resp.status_code == 401


def test_login_correcto_devuelve_tokens(api, cliente):
    resp = api.post(
        "/api/users/login/",
        {"email": cliente.email, "password": "Clave-Segura-123"},
        format="json",
    )

    assert resp.status_code == 200
    assert resp.data["access"]


def test_token_permite_acceder_a_me(api, cliente):
    login = api.post(
        "/api/users/login/",
        {"email": cliente.email, "password": "Clave-Segura-123"},
        format="json",
    )

    api.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

    resp = api.get("/api/users/me/")

    assert resp.status_code == 200
    assert resp.data["email"] == cliente.email


def test_listado_de_usuarios_es_privado(api):
    assert api.get("/api/users/").status_code == 401


def test_cliente_no_puede_listar_usuarios(api_cliente):
    assert api_cliente.get("/api/users/").status_code == 403


def test_admin_puede_listar_usuarios(api_admin):
    assert api_admin.get("/api/users/").status_code == 200


def test_cliente_no_puede_cambiar_su_rol(api_cliente, cliente, rol_admin):
    resp = api_cliente.put(
        f"/api/users/{cliente.id_usuario}/",
        {"rol": rol_admin.id_rol},
        format="json",
    )

    assert resp.status_code == 403

    cliente.refresh_from_db()
    assert cliente.rol.nombre_rol != rol_admin.nombre_rol


def test_cambiar_password_exige_la_actual(api_cliente):
    resp = api_cliente.post(
        "/api/users/me/cambiar-password/",
        {"password_actual": "incorrecta", "password_nuevo": "Otra-Clave-456"},
        format="json",
    )

    assert resp.status_code == 400
