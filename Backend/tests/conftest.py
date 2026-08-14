from datetime import date, timedelta
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.cart.models import Carrito, ItemCarrito
from apps.categories.models import Categoria
from apps.offers.models import Oferta
from apps.orders.models import MetodoPago
from apps.products.models import Color, Producto, Talla, Variante
from apps.users.models import ROL_ADMIN, ROL_CLIENTE, Direccion, Rol, Usuario


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def rol_cliente(db):
    return Rol.objects.create(nombre_rol=ROL_CLIENTE)


@pytest.fixture
def rol_admin(db):
    return Rol.objects.create(nombre_rol=ROL_ADMIN)


@pytest.fixture
def cliente(db, rol_cliente):
    return Usuario.objects.create_user(
        email="cliente@ventasya.test",
        password="Clave-Segura-123",
        nombres="Ana",
        apellidos="Pérez",
        rol=rol_cliente,
    )


@pytest.fixture
def otro_cliente(db, rol_cliente):
    return Usuario.objects.create_user(
        email="otro@ventasya.test",
        password="Clave-Segura-123",
        nombres="Luis",
        apellidos="Gómez",
        rol=rol_cliente,
    )


@pytest.fixture
def admin(db, rol_admin):
    return Usuario.objects.create_user(
        email="admin@ventasya.test",
        password="Clave-Segura-123",
        nombres="Admin",
        apellidos="VentasYa",
        rol=rol_admin,
    )


@pytest.fixture
def api_cliente(api, cliente):
    api.force_authenticate(user=cliente)
    return api


@pytest.fixture
def api_admin(api, admin):
    api.force_authenticate(user=admin)
    return api


@pytest.fixture
def categoria(db):
    return Categoria.objects.create(nombre="Camisas")


@pytest.fixture
def producto(db, categoria):
    return Producto.objects.create(
        categoria=categoria,
        nombre="Camisa Oxford",
        slug="camisa-oxford",
        descripcion="Camisa de algodón",
        precio=Decimal("100000.00"),
    )


@pytest.fixture
def variante(db, producto):
    color = Color.objects.create(nombre="Azul", codigo_hex="#0000ff")
    talla = Talla.objects.create(nombre="M")

    return Variante.objects.create(
        producto=producto,
        color=color,
        talla=talla,
        sku="CAM-OX-AZ-M",
        stock=10,
    )


@pytest.fixture
def direccion(db, cliente):
    return Direccion.objects.create(
        usuario=cliente,
        direccion="Calle 1 # 2-3",
        ciudad="Bogotá",
        departamento="Cundinamarca",
        predeterminada=True,
    )


@pytest.fixture
def metodo_pago(db):
    return MetodoPago.objects.create(tipo="Contraentrega")


@pytest.fixture
def carrito_con_items(db, cliente, variante):
    carrito = Carrito.objects.create(usuario=cliente)

    ItemCarrito.objects.create(carrito=carrito, variante=variante, cantidad=2)

    return carrito


@pytest.fixture
def oferta_vigente(db, producto):
    hoy = date.today()

    return Oferta.objects.create(
        nombre="20% de descuento",
        producto=producto,
        tipo_descuento="porcentaje",
        valor=Decimal("20"),
        fecha_inicio=hoy - timedelta(days=1),
        fecha_fin=hoy + timedelta(days=1),
        activa=True,
    )
