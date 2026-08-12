import pytest

pytestmark = pytest.mark.django_db


def test_catalogo_de_productos_es_publico(api, producto):
    assert api.get("/api/products/").status_code == 200


def test_crear_producto_exige_admin(api_cliente, categoria):
    resp = api_cliente.post(
        "/api/products/",
        {
            "categoria_id": categoria.id_categoria,
            "nombre": "Pirata",
            "slug": "pirata",
            "descripcion": "x",
            "precio": "1000.00",
        },
        format="json",
    )

    assert resp.status_code == 403


def test_carrito_ajeno_no_es_accesible(api_cliente, otro_cliente, variante):
    from apps.cart.models import Carrito, ItemCarrito

    carrito_ajeno = Carrito.objects.create(usuario=otro_cliente)
    item = ItemCarrito.objects.create(
        carrito=carrito_ajeno, variante=variante, cantidad=1
    )

    resp = api_cliente.put(
        f"/api/cart/items/{item.id_item}/", {"cantidad": 5}, format="json"
    )

    assert resp.status_code == 404

    item.refresh_from_db()
    assert item.cantidad == 1


def test_mis_pedidos_solo_devuelve_los_propios(
    api_cliente, cliente, otro_cliente, direccion, metodo_pago
):
    from apps.orders.models import Compra

    Compra.objects.create(
        usuario=otro_cliente,
        direccion=direccion,
        metodo_pago=metodo_pago,
        total=1000,
    )

    resp = api_cliente.get("/api/orders/mis-pedidos/")

    assert resp.status_code == 200
    assert resp.data == []


def test_listado_global_de_compras_es_solo_admin(api_cliente):
    assert api_cliente.get("/api/orders/").status_code == 403


def test_pagos_solo_visibles_para_admin(api_cliente):
    assert api_cliente.get("/api/payments/").status_code == 403


def test_low_stock_solo_admin(api_cliente, admin, variante):
    assert api_cliente.get("/api/products/low-stock/").status_code == 403

    api_cliente.force_authenticate(user=admin)

    assert api_cliente.get("/api/products/low-stock/").status_code == 200
