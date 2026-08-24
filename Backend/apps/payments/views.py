import json
import urllib.request
import urllib.error
import hashlib

from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.orders.models import Compra, MetodoPago
from apps.products.models import Variante

from .serializers import (
    MetodoPagoCatalogoSerializer,
    PagoSerializer,
)
from .models import Pago


class MetodosPagoView(APIView):

    def get(self, request):

        metodos = (
            MetodoPago.objects
            .all()
            .order_by("tipo")
        )

        # Si no hay métodos de pago, crear los por defecto
        if not metodos.exists():
            metodos_default = [
                {
                    "tipo": "Wompi",
                    "detalle": "Pasarela de pagos segura con tarjetas de crédito/débito"
                },
                {
                    "tipo": "Contra entrega",
                    "detalle": "Pagar al recibir el pedido en efectivo"
                },
                {
                    "tipo": "Transferencia bancaria",
                    "detalle": "Transferencia directa a cuenta bancaria"
                }
            ]

            for metodo_data in metodos_default:
                MetodoPago.objects.get_or_create(
                    tipo=metodo_data["tipo"],
                    defaults={"detalle": metodo_data["detalle"]}
                )

            # Recargar después de crear
            metodos = (
                MetodoPago.objects
                .all()
                .order_by("tipo")
            )

        data = [
            MetodoPagoCatalogoSerializer.from_model(m)
            for m in metodos
        ]

        return Response(data)


class PagosView(APIView):

    def get(self, request):

        compra_id = request.query_params.get("compra_id")

        qs = (
            Pago.objects
            .select_related("metodo_pago", "compra")
            .all()
            .order_by("-fecha_pago")
        )

        if compra_id:
            qs = qs.filter(compra_id=compra_id)

        return Response(
            PagoSerializer(qs, many=True).data
        )


class WompiCrearView(APIView):

    """
    POST /api/payments/wompi/crear/

    Body:
    {
        "compra_id": 123
    }

    Crea una transacción de Wompi para el Web Checkout.
    Genera la firma de integridad SHA-256 requerida por Wompi.
    Evita múltiples intentos para el mismo pago.
    """

    def post(self, request):

        compra_id = request.data.get("compra_id")

        if not compra_id:

            return Response(
                {"detail": "Se requiere 'compra_id'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        compra = get_object_or_404(
            Compra,
            id_compra=compra_id
        )

        # Buscar pago pendiente más reciente
        pago = (
            Pago.objects
            .filter(
                compra=compra,
                estado="pendiente",
            )
            .order_by("-fecha_pago")
            .first()
        )

        if not pago:

            return Response(
                {
                    "detail": (
                        "No existe un pago pendiente "
                        "para esta compra."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validar aceptaciones legales
        if not pago.terminos_aceptados or not pago.datos_aceptados:

            return Response(
                {
                    "detail": (
                        "Se requieren las aceptaciones legales "
                        "(términos y política de datos) para procesar el pago."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Si el pago ya tiene wompi_transaction_id, devolver la información existente
        # para evitar múltiples intentos de la misma transacción
        if pago.wompi_transaction_id:

            # Regenerar la firma con los datos existentes
            referencia = pago.referencia_transaccion
            amount_in_cents = int(Decimal(compra.total) * 100)
            signature = self._generate_signature(
                referencia,
                amount_in_cents,
                "COP"
            )

            return Response(
                {
                    "ok": True,
                    "compra_id": compra.id_compra,
                    "pago_id": pago.id_pago,
                    "public_key": settings.WOMPI_PUBLIC_KEY,
                    "currency": "COP",
                    "amount_in_cents": amount_in_cents,
                    "reference": referencia,
                    "signature": {
                        "integrity": signature
                    },
                    "redirect_url": settings.WOMPI_REDIRECT_URL or "/checkout/confirm",
                    "existing_transaction": True,
                },
                status=status.HTTP_200_OK,
            )

        # Generar nueva referencia única
        referencia = (
            f"WMP-{compra.id_compra}-"
            f"{int(timezone.now().timestamp())}"
        )

        amount_in_cents = int(
            Decimal(compra.total) * 100
        )

        # --------------------------------------------------------
        # MODO SIMULACIÓN: si no hay credenciales de Wompi
        # configuradas, generamos una transacción simulada.
        # --------------------------------------------------------
        public_key = (
            settings.WOMPI_PUBLIC_KEY or ""
        ).strip()
        private_key = (
            settings.WOMPI_PRIVATE_KEY or ""
        ).strip()
        integrity_secret = (
            settings.WOMPI_INTEGRITY_SECRET or ""
        ).strip()

        if not public_key or not private_key or not integrity_secret:

            simulated_tx = (
                f"SIM-{int(timezone.now().timestamp())}"
            )

            pago.referencia_transaccion = referencia
            pago.wompi_transaction_id = simulated_tx
            pago.estado = "pendiente"
            pago.save(
                update_fields=[
                    "referencia_transaccion",
                    "wompi_transaction_id",
                    "estado",
                ]
            )

            # Generar firma simulada
            signature = self._generate_signature(
                referencia,
                amount_in_cents,
                "COP"
            )

            base_url = (
                settings.WOMPI_REDIRECT_URL
                or "/checkout/confirm"
            )

            separator = (
                "&" if "?" in base_url else "?"
            )
            checkout_url = (
                f"{base_url}{separator}"
                f"compra_id={compra.id_compra}"
                f"&simulated=1"
            )

            return Response(
                {
                    "ok": True,
                    "compra_id": compra.id_compra,
                    "pago_id": pago.id_pago,
                    "public_key": public_key or "simulated",
                    "currency": "COP",
                    "amount_in_cents": amount_in_cents,
                    "reference": referencia,
                    "signature": {
                        "integrity": signature
                    },
                    "redirect_url": checkout_url,
                    "simulated": True,
                    "transaction_id": simulated_tx,
                },
                status=status.HTTP_201_CREATED,
            )

        # --------------------------------------------------------
        # MODO REAL: Web Checkout de Wompi
        # No creamos la transacción en Wompi aquí.
        # Solo generamos los datos para el Web Checkout.
        # La transacción se creará cuando el usuario
        # complete el pago en Wompi.
        # --------------------------------------------------------

        # Guardar referencia en el pago
        pago.referencia_transaccion = referencia
        pago.estado = "pendiente"
        pago.save(
            update_fields=[
                "referencia_transaccion",
                "estado",
            ]
        )

        # Generar firma de integridad
        signature = self._generate_signature(
            referencia,
            amount_in_cents,
            "COP"
        )

        redirect_url = (
            settings.WOMPI_REDIRECT_URL
            or "/checkout/confirm"
        )

        return Response(
            {
                "ok": True,
                "compra_id": compra.id_compra,
                "pago_id": pago.id_pago,
                "public_key": public_key,
                "currency": "COP",
                "amount_in_cents": amount_in_cents,
                "reference": referencia,
                "signature": {
                    "integrity": signature
                },
                "redirect_url": redirect_url,
                "simulated": False,
            },
            status=status.HTTP_201_CREATED,
        )

    def _generate_signature(self, reference, amount_in_cents, currency):
        """
        Genera la firma de integridad SHA-256 según la documentación de Wompi.

        Firma = SHA256(reference + amount_in_cents + currency + integrity_secret)
        """
        integrity_secret = (
            settings.WOMPI_INTEGRITY_SECRET or ""
        ).strip()

        if not integrity_secret:
            # En modo simulación, devolver una firma falsa
            return "simulated_signature"

        signature_string = (
            f"{reference}{amount_in_cents}{currency}{integrity_secret}"
        )

        signature = hashlib.sha256(
            signature_string.encode("utf-8")
        ).hexdigest()

        return signature


class WompiStatusView(APIView):

    """
    GET /api/payments/wompi/status/?compra_id=123
    """

    def get(self, request):

        compra_id = request.query_params.get(
            "compra_id"
        )

        if not compra_id:

            return Response(
                {
                    "detail": (
                        "Se requiere 'compra_id'."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        compra = get_object_or_404(
            Compra,
            id_compra=compra_id
        )

        pago = (
            Pago.objects
            .filter(compra=compra)
            .order_by("-fecha_pago")
            .first()
        )

        if not pago:

            return Response(
                {
                    "ok": True,
                    "compra_id": compra.id_compra,
                    "estado": "pendiente",
                }
            )

        if not pago.wompi_transaction_id:

            return Response(
                {
                    "ok": True,
                    "compra_id": compra.id_compra,
                    "pago_id": pago.id_pago,
                    "estado": pago.estado,
                }
            )

        # --------------------------------------------------------
        # MODO SIMULACIÓN: solo permitido en DEBUG con transacciones
        # SIM-*. En producción, nunca aprobar automáticamente sin
        # credenciales de Wompi.
        # --------------------------------------------------------
        private_key = (
            settings.WOMPI_PRIVATE_KEY or ""
        ).strip()

        is_simulated = (
            pago.wompi_transaction_id.startswith("SIM-")
        )

        # Solo permitir simulación en modo DEBUG
        if is_simulated and settings.DEBUG:

            if pago.estado != "aprobado":

                pago.estado = "aprobado"
                pago.save(
                    update_fields=["estado"]
                )

            self._finalizar_compra(compra)

            return Response(
                {
                    "ok": True,
                    "compra_id": compra.id_compra,
                    "pago_id": pago.id_pago,
                    "estado": "aprobado",
                    "estado_wompi": "APPROVED",
                    "transaction_id": (
                        pago.wompi_transaction_id
                    ),
                    "referencia": (
                        pago.referencia_transaccion
                    ),
                    "monto": float(pago.monto),
                    "simulated": True,
                }
            )

        # En producción, si no hay credenciales, es un error
        if not private_key:

            return Response(
                {
                    "detail": (
                        "WOMPI_PRIVATE_KEY no configurada. "
                        "No se puede verificar el estado del pago."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Detectar ambiente según el prefijo de la clave
        # privada. Si empieza con prv_test_ -> sandbox, en
        # otro caso -> producción.
        if private_key.startswith("prv_test_"):
            wompi_base = "https://sandbox.wompi.co/v1"
        else:
            wompi_base = "https://production.wompi.co/v1"

        url = (
            f"{wompi_base}/transactions/"
            f"{pago.wompi_transaction_id}"
        )

        headers = {
            "Authorization": (
                f"Bearer {private_key}"
            ),
        }

        try:

            req = urllib.request.Request(
                url,
                headers=headers,
                method="GET",
            )

            with urllib.request.urlopen(
                req,
                timeout=30
            ) as response:

                response_data = response.read()

            data = json.loads(
                response_data.decode("utf-8")
            )

        except Exception as e:

            return Response(
                {
                    "detail": (
                        "Error consultando Wompi."
                    ),
                    "error": str(e),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        transaction_data = data.get(
            "data",
            {}
        )

        status_wompi = transaction_data.get(
            "status"
        )

        estado_map = {
            "PENDING": "pendiente",
            "APPROVED": "aprobado",
            "DECLINED": "rechazado",
            "ERROR": "rechazado",
        }

        estado = estado_map.get(
            status_wompi,
            "pendiente"
        )

        if estado != pago.estado:

            pago.estado = estado
            pago.save(
                update_fields=["estado"]
            )

        # Si el pago fue aprobado,
        # completar la compra.
        if estado == "aprobado":

            self._finalizar_compra(
                compra
            )

        elif estado == "rechazado":

            if compra.estado_compra == "pendiente":

                compra.estado_compra = "cancelado"
                compra.save(
                    update_fields=[
                        "estado_compra"
                    ]
                )

        return Response(
            {
                "ok": True,
                "compra_id": compra.id_compra,
                "pago_id": pago.id_pago,
                "estado": estado,
                "estado_wompi": status_wompi,
                "transaction_id": (
                    pago.wompi_transaction_id
                ),
                "referencia": (
                    pago.referencia_transaccion
                ),
                "monto": float(pago.monto),
            }
        )

    @staticmethod
    def _finalizar_compra(compra):

        if compra.estado_compra == "pagado":
            return

        with transaction.atomic():

            compra = (
                Compra.objects
                .select_for_update()
                .get(
                    id_compra=compra.id_compra
                )
            )

            if compra.estado_compra == "pagado":
                return

            for detalle in compra.detalles.select_related(
                "variante"
            ):

                variante = (
                    Variante.objects
                    .select_for_update()
                    .get(
                        id_variante=(
                            detalle.variante.id_variante
                        )
                    )
                )

                if variante.stock < detalle.cantidad:

                    raise ValueError(
                        (
                            "Stock insuficiente "
                            "al confirmar el pago."
                        )
                    )

                variante.stock -= detalle.cantidad
                variante.save(
                    update_fields=["stock"]
                )

            compra.estado_compra = "pagado"

            compra.save(
                update_fields=[
                    "estado_compra"
                ]
            )

            try:

                carrito = (
                    compra.usuario.carrito
                )

                carrito.items.all().delete()

            except Exception:
                pass


class WompiWebhookView(APIView):

    """
    POST /api/payments/wompi/webhook/

    Webhook de Wompi para recibir eventos de transacciones.
    Valida la firma del evento y actualiza el estado del pago.

    Evento esperado:
    {
        "event": "transaction.updated",
        "data": {
            "transaction": {
                "id": "transaction_id",
                "reference": "reference",
                "status": "APPROVED|DECLINED|ERROR|PENDING",
                "amount_in_cents": 10000,
                "currency": "COP"
            }
        },
        "signature": {
            "properties": "transaction_id reference status amount_in_cents currency",
            "checksum": "sha256_hash"
        },
        "timestamp": 1234567890
    }
    """

    def post(self, request):

        # Validar que el evento sea de transacción
        event = request.data.get("event")

        if event != "transaction.updated":

            return Response(
                {"detail": "Evento no soportado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validar firma del evento
        signature_data = request.data.get("signature", {})
        timestamp = request.data.get("timestamp")

        if not self._validate_webhook_signature(
            request.data,
            signature_data,
            timestamp
        ):

            return Response(
                {"detail": "Firma del webhook inválida."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Obtener datos de la transacción
        transaction_data = request.data.get("data", {}).get("transaction", {})

        transaction_id = transaction_data.get("id")
        reference = transaction_data.get("reference")
        status_wompi = transaction_data.get("status")

        if not transaction_id or not reference or not status_wompi:

            return Response(
                {"detail": "Datos de transacción incompletos."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Buscar el pago por referencia
        try:

            pago = Pago.objects.get(
                referencia_transaccion=reference
            )

        except Pago.DoesNotExist:

            return Response(
                {"detail": "Transacción no encontrada."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Mapear estados de Wompi a estados internos
        estado_map = {
            "PENDING": "pendiente",
            "APPROVED": "aprobado",
            "DECLINED": "rechazado",
            "ERROR": "rechazado",
        }

        nuevo_estado = estado_map.get(
            status_wompi,
            "pendiente"
        )

        # Actualizar el pago
        pago.wompi_transaction_id = str(transaction_id)
        pago.estado = nuevo_estado
        pago.save(
            update_fields=[
                "wompi_transaction_id",
                "estado",
            ]
        )

        # Si el pago fue aprobado, finalizar la compra
        if nuevo_estado == "aprobado":

            WompiStatusView._finalizar_compra(
                pago.compra
            )

        elif nuevo_estado == "rechazado":

            compra = pago.compra

            if compra.estado_compra == "pendiente":

                compra.estado_compra = "cancelado"
                compra.save(
                    update_fields=["estado_compra"]
                )

        return Response(
            {
                "ok": True,
                "transaction_id": transaction_id,
                "reference": reference,
                "status": status_wompi,
                "estado_interno": nuevo_estado,
            },
            status=status.HTTP_200_OK,
        )

    def _validate_webhook_signature(self, event_data, signature_data, timestamp):

        """
        Valida la firma del webhook según la documentación de Wompi.

        1. Lee las propiedades de signature.properties
        2. Extrae los valores del evento en ese orden
        3. Concatena: valores + timestamp + event_secret
        4. Calcula SHA-256
        5. Compara con signature.checksum
        """

        properties = signature_data.get("properties", "")
        received_checksum = signature_data.get("checksum", "")

        if not properties or not received_checksum or not timestamp:

            return False

        event_secret = settings.WOMPI_EVENT_ID

        if not event_secret:

            return False

        # Obtener los valores en el orden de las propiedades
        property_list = properties.split()

        values = []

        transaction_data = event_data.get("data", {}).get("transaction", {})

        for prop in property_list:

            # Las propiedades pueden estar anidadas (ej: transaction.id)
            if "." in prop:

                parts = prop.split(".")
                value = event_data

                for part in parts:

                    if isinstance(value, dict):

                        value = value.get(part)

                    else:

                        value = None
                        break

            else:

                value = transaction_data.get(prop)

            if value is not None:

                values.append(str(value))

        # Concatenar valores + timestamp + event_secret
        signature_string = "".join(values) + str(timestamp) + event_secret

        # Calcular SHA-256
        calculated_checksum = hashlib.sha256(
            signature_string.encode("utf-8")
        ).hexdigest()

        # Comparar checksums
        return calculated_checksum == received_checksum


class ConfirmarPagoView(APIView):

    """
    POST /api/payments/confirmar/

    Body:
    {
        "compra_id": 123
    }

    Aprueba un pago pendiente sin pasar por Wompi.
    Se usa para métodos de pago como "Contra entrega"
    o "Transferencia bancaria" que no requieren
    pasarela de pago en línea.

    ⚠️ NO permite confirmar pagos de Wompi manualmente.
    """

    def post(self, request):

        compra_id = request.data.get("compra_id")

        if not compra_id:

            return Response(
                {"detail": "Se requiere 'compra_id'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        compra = get_object_or_404(
            Compra,
            id_compra=compra_id
        )

        pago = (
            Pago.objects
            .filter(compra=compra)
            .select_related("metodo_pago")
            .order_by("-fecha_pago")
            .first()
        )

        if not pago:

            return Response(
                {
                    "detail": (
                        "No existe un pago para esta compra."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validar que el método de pago NO sea Wompi
        metodo_pago_tipo = pago.metodo_pago.tipo.lower() if pago.metodo_pago else ""

        if metodo_pago_tipo == "wompi":

            return Response(
                {
                    "detail": (
                        "Los pagos con Wompi deben confirmarse "
                        "a través de la pasarela de pagos. "
                        "No se permite confirmación manual."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if pago.estado != "aprobado":

            pago.estado = "aprobado"
            pago.save(update_fields=["estado"])

        WompiStatusView._finalizar_compra(compra)

        return Response(
            {
                "ok": True,
                "compra_id": compra.id_compra,
                "pago_id": pago.id_pago,
                "estado": "aprobado",
            }
        )
