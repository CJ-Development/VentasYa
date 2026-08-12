from decimal import Decimal

import pytest

from apps.orders.models import Compra
from apps.payments.models import Pago

pytestmark = pytest.mark.django_db


def _payload(direccion, metodo_pago, **extra):
    return {
        "direccion_id": direccion.id_direccion,
        "metodo_pago_id": metodo_pago.id_metodo_pago,
        **extra,
    }


def test_checkout_crea_compra_descuenta_stock_y_vacia_carrito(
    api_cliente, carrito_con_items, variante, direccion, metodo_pago
):
    resp = api_cliente.post(
        "/api/orders/checkout/",
        _payload(direccion, metodo_pago),
        format="json",
    )

    assert resp.status_code == 201

    variante.refresh_from_db()
    assert variante.stock == 8

    compra = Compra.objects.get(id_compra=resp.data["id_compra"])
    assert compra.usuario_id == carrito_con_items.usuario_id
    assert compra.total == Decimal("200000.00")
    assert compra.detalles.count() == 1

    assert Pago.objects.filter(compra=compra, estado="aprobado").exists()
    assert carrito_con_items.items.count() == 0


def test_checkout_usa_el_precio_con_oferta_vigente(
    api_cliente, carrito_con_items, direccion, metodo_pago, oferta_vigente
):
    resp = api_cliente.post(
        "/api/orders/checkout/",
        _payload(direccion, metodo_pago),
        format="json",
    )

    assert resp.status_code == 201

    compra = Compra.objects.get(id_compra=resp.data["id_compra"])

    # 100.000 con 20% de descuento = 80.000 x 2 unidades
    assert compra.total == Decimal("160000.00")


def test_checkout_rechaza_stock_insuficiente_sin_tocar_nada(
    api_cliente, carrito_con_items, variante, direccion, metodo_pago
):
    variante.stock = 1
    variante.save(update_fields=["stock"])

    resp = api_cliente.post(
        "/api/orders/checkout/",
        _payload(direccion, metodo_pago),
        format="json",
    )

    assert resp.status_code == 400
    assert Compra.objects.count() == 0

    variante.refresh_from_db()
    assert variante.stock == 1
    assert carrito_con_items.items.count() == 1


def test_checkout_es_idempotente(
    api_cliente, carrito_con_items, variante, direccion, metodo_pago
):
    payload = _payload(direccion, metodo_pago, idempotency_key="abc-123")

    primera = api_cliente.post("/api/orders/checkout/", payload, format="json")
    segunda = api_cliente.post("/api/orders/checkout/", payload, format="json")

    assert primera.status_code == 201
    assert segunda.status_code == 200
    assert primera.data["id_compra"] == segunda.data["id_compra"]

    assert Compra.objects.count() == 1

    variante.refresh_from_db()
    assert variante.stock == 8


def test_checkout_rechaza_direccion_de_otro_usuario(
    api_cliente, carrito_con_items, otro_cliente, metodo_pago
):
    from apps.users.models import Direccion

    ajena = Direccion.objects.create(
        usuario=otro_cliente,
        direccion="Calle falsa 123",
        ciudad="Cali",
        departamento="Valle",
    )

    resp = api_cliente.post(
        "/api/orders/checkout/",
        _payload(ajena, metodo_pago),
        format="json",
    )

    assert resp.status_code == 404
    assert Compra.objects.count() == 0


def test_checkout_exige_autenticacion(api, direccion, metodo_pago):
    resp = api.post(
        "/api/orders/checkout/",
        _payload(direccion, metodo_pago),
        format="json",
    )

    assert resp.status_code == 401


def test_carrito_no_permite_superar_el_stock(api_cliente, variante):
    resp = api_cliente.post(
        "/api/cart/",
        {"variante_id": variante.id_variante, "cantidad": variante.stock + 1},
        format="json",
    )

    assert resp.status_code == 400
