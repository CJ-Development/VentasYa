"""
Views de la app payments — integración con Wompi Widget embebido.

Flujo:
  1. POST /api/orders/checkout/   → crea Compra + Pago(pendiente) + ReservaStock
  2. GET  /api/payments/wompi/widget-data/?compra_id=  → datos para inyectar
                                                         el <script> del Widget
  3. Cliente paga en el modal del Widget
  4. Wompi redirige a /checkout/confirm?compra_id=X (opcional, UX)
  5. Wompi envía POST /api/payments/wompi/webhook/  → actualiza Pago y Compra
  6. Frontend hace polling a /api/payments/wompi/status/?compra_id=X

Notas de seguridad:
  - La private key, integrity secret y event secret NUNCA salen del backend.
  - El frontend solo recibe la public_key y la firma de integridad calculada
    en el servidor (SHA256 ref + amount_in_cents + currency + integrity_secret).
  - El webhook valida la firma criptográfica de Wompi con hmac.compare_digest.
"""

import json
import logging
import uuid
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

import hashlib
import hmac

from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.orders.models import Compra, MetodoPago
from apps.products.models import Variante

from .models import (
    Pago,
    ReservaStock,
    WompiWebhookEvent,
)
from .serializers import (
    PagoSerializer,
    MetodoPagoCatalogoSerializer,
)
from .wompi_client import (
    WompiError,
    base_url_for,
    wompi_request_with_retry,
)


logger = logging.getLogger(__name__)


# ============================================================
# HELPERS
# ============================================================

def _wompi_base_url():
    """
    Devuelve la URL base de Wompi según el tipo de public key.
    pub_test_* → sandbox, pub_prod_* → producción.
    """
    return base_url_for(settings.WOMPI_PUBLIC_KEY)


def _amount_in_cents(total):
    """
    Convierte un Decimal a centavos de COP de forma segura.
    Ej: Decimal('35000.00') → 3500000
    """
    return int(
        (Decimal(str(total)) * 100).quantize(
            Decimal("1"), rounding=ROUND_HALF_UP
        )
    )


def _generate_integrity_signature(reference, amount_in_cents, currency):
    """
    SHA256(reference + amount_in_cents + currency + integrity_secret)
    Documentación Wompi: este es el orden OBLIGATORIO.
    """
    integrity_secret = (settings.WOMPI_INTEGRITY_SECRET or "").strip()

    if not integrity_secret:
        if settings.DEBUG:
            # Solo en dev. En producción esto es un error crítico.
            return "simulated_signature"
        raise ValueError("WOMPI_INTEGRITY_SECRET no configurado.")

    signature_string = f"{reference}{amount_in_cents}{currency}{integrity_secret}"

    return hashlib.sha256(
        signature_string.encode("utf-8")
    ).hexdigest()


# ============================================================
# MERCHANT / ACCEPTANCE TOKENS
# ============================================================

class WompiMerchantView(APIView):
    """
    GET /api/payments/wompi/merchant/

    Trae info del merchant + tokens de aceptación legales.
    El frontend usa los permalinks para mostrar Términos y Habeas Data.
    """

    def get(self, request):

        public_key = (settings.WOMPI_PUBLIC_KEY or "").strip()

        if not public_key:
            return Response(
                {"detail": "WOMPI_PUBLIC_KEY no configurada."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        url = f"{_wompi_base_url()}/merchants/{public_key}"

        try:
            data = wompi_request_with_retry(
                "GET",
                url,
                context={"endpoint": "merchant"},
            )

        except WompiError as e:
            logger.warning(
                "Error merchant Wompi: type=%s status=%s",
                e.type, e.status,
            )
            # 401 = llave inválida → 500 (configuración del servidor).
            if e.is_auth_error:
                return Response(
                    {
                        "detail": (
                            "Llave pública de Wompi inválida. "
                            "Verifica WOMPI_PUBLIC_KEY."
                        )
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            # Errores transitorios agotados o 5xx.
            return Response(
                {"detail": "Error obteniendo merchant de Wompi."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        except Exception:
            logger.exception("Error inesperado conectando con Wompi (merchant).")
            return Response(
                {"detail": "Error conectando con Wompi."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        merchant = data.get("data", {})
        presigned_acceptance = merchant.get("presigned_acceptance", {})
        presigned_personal = merchant.get("presigned_personal_data_auth", {})

        return Response({
            "ok": True,
            "merchant": {
                "id": merchant.get("id"),
                "name": merchant.get("name"),
                "email": merchant.get("email"),
            },
            "acceptance_tokens": {
                "acceptance_token": presigned_acceptance.get("acceptance_token"),
                "acceptance_permalink": presigned_acceptance.get("permalink"),
                "personal_data_token": presigned_personal.get("acceptance_token"),
                "personal_data_permalink": presigned_personal.get("permalink"),
            },
        })


# ============================================================
# WIDGET DATA — payload para el <script> del Widget embebido
# ============================================================

class WompiWidgetDataView(APIView):
    """
    GET /api/payments/wompi/widget-data/?compra_id=123

    Devuelve los datos EXACTOS que el frontend necesita para
    inyectar el Widget de Wompi embebido en la página:

      <form>
        <script
          src="https://checkout.wompi.co/widget.js"
          data-render="button"
          data-public-key="..."
          data-currency="COP"
          data-amount-in-cents="..."
          data-reference="..."
          data-signature:integrity="..."
          data-customer-email="..."
        />
      </form>

    IMPORTANTE: este endpoint NO crea la transacción en Wompi.
    La transacción se crea cuando el usuario hace clic en el botón
    del Widget y Wompi procesa el pago.
    """

    def get(self, request):

        compra_id = request.query_params.get("compra_id")

        if not compra_id:
            return Response(
                {"detail": "Se requiere 'compra_id'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        compra = get_object_or_404(Compra, id_compra=compra_id)

        # La compra debe estar pendiente y pertenecer a un método Wompi.
        if compra.estado_compra != "pendiente":
            return Response(
                {
                    "detail": (
                        f"Esta compra está en estado '{compra.estado_compra}', "
                        "no se puede iniciar un pago."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (compra.metodo_pago.tipo or "").strip().lower() != "wompi":
            return Response(
                {"detail": "Esta compra no usa Wompi como método de pago."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pago = (
            Pago.objects
            .filter(compra=compra, estado="pendiente")
            .order_by("-fecha_pago")
            .first()
        )

        if not pago:
            return Response(
                {"detail": "No existe un pago pendiente para esta compra."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not (pago.terminos_aceptados and pago.datos_aceptados):
            return Response(
                {
                    "detail": (
                        "Se requieren las aceptaciones legales "
                        "para procesar el pago."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        public_key = (settings.WOMPI_PUBLIC_KEY or "").strip()

        if not public_key:
            return Response(
                {"detail": "Wompi no está configurado en este servidor."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        amount_in_cents = _amount_in_cents(compra.total)

        # Generar o reutilizar referencia única (idempotencia).
        referencia = pago.referencia_transaccion
        if not referencia:
            referencia = (
                f"VENTASYA-{compra.id_compra}-"
                f"{uuid.uuid4().hex[:12].upper()}"
            )
            pago.referencia_transaccion = referencia
            pago.customer_email = getattr(compra.usuario, "email", None)
            pago.save(update_fields=["referencia_transaccion", "customer_email"])

        signature = _generate_integrity_signature(
            referencia, amount_in_cents, "COP"
        )

        return Response({
            "ok": True,
            "compra_id": compra.id_compra,
            "pago_id": pago.id_pago,
            "widget": {
                "public_key": public_key,
                "currency": "COP",
                "amount_in_cents": amount_in_cents,
                "reference": referencia,
                "signature_integrity": signature,
                "customer_email": pago.customer_email or "",
                "redirect_url": (
                    f"{settings.WOMPI_REDIRECT_URL}"
                    f"?compra_id={compra.id_compra}"
                ),
            },
        })


# ============================================================
# STATUS — polling del frontend para saber cómo va el pago
# ============================================================

class WompiStatusView(APIView):
    """
    GET /api/payments/wompi/status/?compra_id=123

    El frontend hace polling aquí después de abrir el Widget.
    """

    def get(self, request):

        compra_id = request.query_params.get("compra_id")

        if not compra_id:
            return Response(
                {"detail": "Se requiere 'compra_id'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        compra = get_object_or_404(Compra, id_compra=compra_id)

        pago = (
            Pago.objects
            .filter(compra=compra)
            .order_by("-fecha_pago")
            .first()
        )

        if not pago:
            return Response({
                "ok": True,
                "compra_id": compra.id_compra,
                "estado": "pendiente",
            })

        # Si ya está aprobado localmente, respondemos inmediatamente.
        if pago.estado == "aprobado":
            return Response({
                "ok": True,
                "compra_id": compra.id_compra,
                "pago_id": pago.id_pago,
                "estado": "aprobado",
                "transaction_id": pago.wompi_transaction_id,
                "referencia": pago.referencia_transaccion,
                "monto": float(pago.monto),
            })

        # Si no tenemos transaction_id todavía, Wompi no ha procesado nada.
        if not pago.wompi_transaction_id:
            return Response({
                "ok": True,
                "compra_id": compra.id_compra,
                "pago_id": pago.id_pago,
                "estado": pago.estado,
            })

        private_key = (settings.WOMPI_PRIVATE_KEY or "").strip()

        if not private_key:
            return Response(
                {"detail": "WOMPI_PRIVATE_KEY no configurada."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        url = (
            f"{_wompi_base_url()}/transactions/"
            f"{pago.wompi_transaction_id}"
        )

        try:
            wompi_response = wompi_request_with_retry(
                "GET",
                url,
                headers={"Authorization": f"Bearer {private_key}"},
                context={
                    "endpoint": "transactions_get",
                    "transaction_id": pago.wompi_transaction_id,
                    "reference": pago.referencia_transaccion,
                },
            )

        except WompiError as e:
            logger.warning(
                "Error consultando transacción en Wompi: "
                "type=%s status=%s ref=%s",
                e.type, e.status, pago.referencia_transaccion,
            )
            if e.is_not_found:
                # La transacción no existe (o fue purgada). Mantenemos el
                # estado interno y devolvemos 502 para que el frontend
                # decida qué hacer.
                return Response(
                    {"detail": "Transacción no encontrada en Wompi."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            if e.is_auth_error:
                return Response(
                    {
                        "detail": (
                            "Llave privada de Wompi inválida. "
                            "Verifica WOMPI_PRIVATE_KEY."
                        )
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            return Response(
                {"detail": "Error consultando la transacción en Wompi."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        except Exception:
            logger.exception("Error inesperado consultando Wompi.")
            return Response(
                {"detail": "Error conectando con Wompi."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        tx = wompi_response.get("data", {})
        status_wompi = tx.get("status")

        estado_map = {
            "PENDING": "pendiente",
            "APPROVED": "aprobado",
            "DECLINED": "rechazado",
            "ERROR": "rechazado",
            "VOIDED": "rechazado",
        }
        nuevo_estado = estado_map.get(status_wompi, "pendiente")

        if nuevo_estado != pago.estado:
            pago.estado = nuevo_estado
            if nuevo_estado == "aprobado":
                pago.fecha_aprobacion = timezone.now()
            pago.save(update_fields=["estado", "fecha_aprobacion"])

        if nuevo_estado == "aprobado":
            self._finalizar_compra(compra)
        elif nuevo_estado == "rechazado":
            self._cancelar_compra(compra)

        return Response({
            "ok": True,
            "compra_id": compra.id_compra,
            "pago_id": pago.id_pago,
            "estado": nuevo_estado,
            "estado_wompi": status_wompi,
            "transaction_id": pago.wompi_transaction_id,
            "referencia": pago.referencia_transaccion,
            "monto": float(pago.monto),
        })

    # --------- helpers compartidos (también usados por webhook) ---------

    @staticmethod
    def _finalizar_compra(compra):
        """
        Confirma la compra: descuenta stock, marca reserva como confirmada,
        marca compra como 'pagado'.
        """
        if compra.estado_compra == "pagado":
            return

        with transaction.atomic():
            compra = (
                Compra.objects
                .select_for_update()
                .get(id_compra=compra.id_compra)
            )

            if compra.estado_compra == "pagado":
                return

            for detalle in compra.detalles.select_related("variante"):
                variante = (
                    Variante.objects
                    .select_for_update()
                    .get(id_variante=detalle.variante.id_variante)
                )

                if variante.stock < detalle.cantidad:
                    raise ValueError(
                        f"Stock insuficiente al confirmar "
                        f"variante {variante.sku}."
                    )

                variante.stock -= detalle.cantidad
                variante.save(update_fields=["stock"])

            compra.estado_compra = "pagado"
            compra.save(update_fields=["estado_compra"])

            # Marcar reserva como confirmada.
            ReservaStock.objects.filter(compra=compra).update(
                estado="confirmada",
                fecha_liberacion=None,
            )

    @staticmethod
    def _cancelar_compra(compra):
        """
        Cancela una compra porque el pago fue rechazado.
        Libera la reserva de stock (devuelve stock al inventario).
        """
        if compra.estado_compra in ("cancelado", "pagado"):
            return

        with transaction.atomic():
            _liberar_reserva_stock(compra)
            compra.estado_compra = "cancelado"
            compra.save(update_fields=["estado_compra"])


def _liberar_reserva_stock(compra):
    """
    Devuelve el stock reservado de una compra al inventario.

    Se usa cuando:
      - Pago rechazado
      - Pago expirado
      - Compra creada pero nunca pagada (job de limpieza)
    """
    reserva = (
        ReservaStock.objects
        .select_for_update()
        .filter(compra=compra, estado="activa")
        .first()
    )

    if not reserva:
        return

    for detalle in compra.detalles.select_related("variante"):
        variante = (
            Variante.objects
            .select_for_update()
            .get(id_variante=detalle.variante.id_variante)
        )
        variante.stock += detalle.cantidad
        variante.save(update_fields=["stock"])

    reserva.estado = "liberada"
    reserva.fecha_liberacion = timezone.now()
    reserva.save(update_fields=["estado", "fecha_liberacion"])


def _expirar_reservas_vencidas():
    """
    Job: libera stock de compras pendientes que nunca se pagaron.

    Llamar desde cron / management command / endpoint admin.
    Se ejecuta cada N minutos. Ventana por defecto: 30 minutos
    (alineada con la expiración del Widget de Wompi).
    """
    ahora = timezone.now()

    reservas_vencidas = (
        ReservaStock.objects
        .select_for_update(skip_locked=True)
        .filter(estado="activa", fecha_expiracion__lt=ahora)
    )

    expiradas = 0

    for reserva in reservas_vencidas:
        try:
            with transaction.atomic():
                compra = (
                    Compra.objects
                    .select_for_update()
                    .get(id_compra=reserva.compra_id)
                )

                if compra.estado_compra != "pendiente":
                    reserva.estado = "liberada"
                    reserva.fecha_liberacion = ahora
                    reserva.save(update_fields=["estado", "fecha_liberacion"])
                    continue

                _liberar_reserva_stock(compra)

                compra.estado_compra = "cancelado"
                compra.save(update_fields=["estado_compra"])

                Pago.objects.filter(
                    compra=compra, estado="pendiente"
                ).update(estado="expirado")

                expiradas += 1

        except Exception:
            logger.exception(
                "Error expirando reserva %s", reserva.id_reserva
            )

    return expiradas


# ============================================================
# WEBHOOK — Wompi notifica eventos del lado del servidor
# ============================================================

@method_decorator(csrf_exempt, name="dispatch")
class WompiWebhookView(APIView):
    """
    POST /api/payments/wompi/webhook/

    Validación criptográfica del checksum.

    Wompi envía en el header `X-Event-Checksum` (no en el body).
    La firma se construye concatenando:
      - los valores de las propiedades indicadas en
        signature.properties (en el orden dado)
      - + timestamp
      - + events_secret

    Documentación:
    https://docs.wompi.co/docs/eventos-de-transacciones
    """

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        body = request.data or {}
        event_type = body.get("event")

        # 1) Generar o recuperar event_id para idempotencia.
        #    Wompi no siempre lo manda; usamos un fallback hash.
        event_id = (
            body.get("event_id")
            or body.get("id")
            or hashlib.sha256(
                json.dumps(body, sort_keys=True).encode("utf-8")
            ).hexdigest()
        )

        tx_data = (body.get("data") or {}).get("transaction") or {}
        transaction_id = tx_data.get("id")
        reference = tx_data.get("reference")

        # 2) Guardar payload crudo SIEMPRE (auditoría).
        evento = WompiWebhookEvent.objects.create(
            event_id=event_id,
            event_type=event_type or "unknown",
            transaction_id=str(transaction_id) if transaction_id else None,
            reference=reference,
            payload=body,
            signature_valid=False,
            estado_procesamiento="recibido",
        )

        # 3) Validar firma criptográfica.
        signature_valid = self._validate_checksum(body, request.headers.get("X-Event-Checksum"))
        evento.signature_valid = signature_valid

        if not signature_valid:
            evento.estado_procesamiento = "error"
            evento.error_detalle = "Firma inválida"
            evento.processed_at = timezone.now()
            evento.save(update_fields=[
                "signature_valid", "estado_procesamiento",
                "error_detalle", "processed_at",
            ])
            logger.warning("Webhook Wompi: firma inválida (event=%s)", event_id)
            return Response(
                {"detail": "Firma inválida."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 4) Ignorar eventos que no nos interesan.
        if event_type != "transaction.updated":
            evento.estado_procesamiento = "ignorado"
            evento.processed_at = timezone.now()
            evento.save(update_fields=[
                "estado_procesamiento", "processed_at",
            ])
            return Response({
                "ok": True,
                "detail": "Evento ignorado.",
                "event": event_type,
            })

        if not (transaction_id and reference):
            evento.estado_procesamiento = "error"
            evento.error_detalle = "Datos incompletos"
            evento.processed_at = timezone.now()
            evento.save(update_fields=[
                "estado_procesamiento", "error_detalle", "processed_at",
            ])
            return Response(
                {"detail": "Datos de transacción incompletos."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 5) Aplicar el cambio de estado al Pago.
        status_wompi = tx_data.get("status")
        estado_map = {
            "PENDING": "pendiente",
            "APPROVED": "aprobado",
            "DECLINED": "rechazado",
            "ERROR": "rechazado",
            "VOIDED": "rechazado",
        }
        nuevo_estado = estado_map.get(status_wompi, "pendiente")

        try:
            with transaction.atomic():
                pago = (
                    Pago.objects
                    .select_for_update()
                    .select_related("compra")
                    .get(referencia_transaccion=reference)
                )

                # Idempotencia: si ya está aprobado, no hacer nada.
                if pago.estado == "aprobado":
                    evento.estado_procesamiento = "procesado"
                    evento.processed_at = timezone.now()
                    evento.save(update_fields=[
                        "estado_procesamiento", "processed_at",
                    ])
                    return Response({
                        "ok": True,
                        "detail": "Pago ya aprobado (idempotente).",
                    })

                pago.wompi_transaction_id = str(transaction_id)
                pago.estado = nuevo_estado
                if nuevo_estado == "aprobado":
                    pago.fecha_aprobacion = timezone.now()
                pago.save(update_fields=[
                    "wompi_transaction_id", "estado", "fecha_aprobacion",
                ])

                compra = pago.compra

            # 6) Side-effects según estado.
            if nuevo_estado == "aprobado":
                WompiStatusView._finalizar_compra(compra)
            elif nuevo_estado == "rechazado":
                WompiStatusView._cancelar_compra(compra)

            evento.estado_procesamiento = "procesado"
            evento.processed_at = timezone.now()
            evento.save(update_fields=[
                "estado_procesamiento", "processed_at",
            ])

            return Response({
                "ok": True,
                "transaction_id": str(transaction_id),
                "reference": reference,
                "status": status_wompi,
                "estado_interno": nuevo_estado,
            })

        except Pago.DoesNotExist:
            evento.estado_procesamiento = "ignorado"
            evento.error_detalle = f"Referencia {reference} no encontrada"
            evento.processed_at = timezone.now()
            evento.save(update_fields=[
                "estado_procesamiento", "error_detalle", "processed_at",
            ])
            # Devolvemos 200 para que Wompi NO reintente indefinidamente.
            return Response({
                "ok": True,
                "detail": "Referencia no encontrada.",
            })

        except ValueError as e:
            evento.estado_procesamiento = "error"
            evento.error_detalle = str(e)
            evento.processed_at = timezone.now()
            evento.save(update_fields=[
                "estado_procesamiento", "error_detalle", "processed_at",
            ])
            return Response(
                {"detail": str(e)},
                status=status.HTTP_409_CONFLICT,
            )

        except Exception as e:
            evento.estado_procesamiento = "error"
            evento.error_detalle = str(e)
            evento.processed_at = timezone.now()
            evento.save(update_fields=[
                "estado_procesamiento", "error_detalle", "processed_at",
            ])
            logger.exception("Error inesperado en webhook Wompi.")
            return Response(
                {"detail": "Error interno procesando webhook."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _validate_checksum(self, body, received_checksum):
        """
        Valida el X-Event-Checksum de Wompi.

        Regla oficial Wompi (docs/webhooks.md):
          checksum = SHA256(
              concat(valores de signature.properties en orden)
              + events_secret
          )

        NO se incluye timestamp en el cálculo. Solo values + events_secret.
        El timestamp SÍ viene en el payload para auditoría, pero NO
        participa del checksum.
        """
        if not received_checksum:
            return False

        events_secret = (
            getattr(settings, "WOMPI_EVENT_SECRET", None)
            or getattr(settings, "WOMPI_EVENT_ID", None)
            or ""
        ).strip()

        if not events_secret:
            return False

        signature_data = body.get("signature") or {}
        properties = signature_data.get("properties") or []

        if not properties:
            return False

        # Aceptar properties como lista o como string separado por espacios.
        if isinstance(properties, str):
            properties = properties.split()

        if not isinstance(properties, list):
            return False

        # Extraer cada valor recorriendo el body por la ruta dotted.
        values = []
        for prop in properties:
            prop = str(prop).strip()
            if not prop:
                return False

            value = body
            for part in prop.split("."):
                if not isinstance(value, dict) or part not in value:
                    return False
                value = value[part]

            if value is None:
                return False

            values.append(str(value))

        # Construir string de firma: SOLO values + events_secret.
        signature_string = "".join(values) + events_secret

        calculated = hashlib.sha256(
            signature_string.encode("utf-8")
        ).hexdigest()

        return hmac.compare_digest(calculated, str(received_checksum))


# ============================================================
# ADMIN / JOBS — endpoint interno para correr tareas de mantenimiento
# ============================================================

class WompiCleanupView(APIView):
    """
    POST /api/payments/wompi/cleanup/

    Libera reservas expiradas. Pensado para llamarse desde un cron
    externo (Vercel Cron, GitHub Actions, etc.) cada 5-10 minutos.

    En producción proteger con un secret en header.
    """

    authentication_classes = []
    permission_classes = []

    def post(self, request):

        secret_header = request.headers.get("X-Cleanup-Secret", "")
        expected = (getattr(settings, "CLEANUP_SECRET", "") or "").strip()

        if expected and secret_header != expected:
            return Response(
                {"detail": "No autorizado."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        expiradas = _expirar_reservas_vencidas()

        return Response({
            "ok": True,
            "reservas_expiradas": expiradas,
            "timestamp": timezone.now().isoformat(),
        })


# ============================================================
# CATÁLOGO Y CONSULTAS GENÉRICAS
# ============================================================

class MetodosPagoView(APIView):

    def get(self, request):

        metodos = MetodoPago.objects.all().order_by("tipo")

        if not metodos.exists():
            defaults = [
                {
                    "tipo": "Wompi",
                    "detalle": "Tarjeta crédito/débito, PSE, Nequi y más",
                },
                {
                    "tipo": "Contra entrega",
                    "detalle": "Pagas al recibir tu pedido",
                },
                {
                    "tipo": "Transferencia bancaria",
                    "detalle": "Transferencia directa a cuenta",
                },
            ]
            for d in defaults:
                MetodoPago.objects.get_or_create(
                    tipo=d["tipo"],
                    defaults={"detalle": d["detalle"]},
                )
            metodos = MetodoPago.objects.all().order_by("tipo")

        data = [
            MetodoPagoCatalogoSerializer.from_model(m) for m in metodos
        ]
        return Response(data)


class PagosView(APIView):

    def get(self, request):
        compra_id = request.query_params.get("compra_id")
        qs = (
            Pago.objects
            .select_related("metodo_pago", "compra")
            .order_by("-fecha_pago")
        )
        if compra_id:
            qs = qs.filter(compra_id=compra_id)
        return Response(PagoSerializer(qs, many=True).data)


class ConfirmarPagoView(APIView):
    """
    POST /api/payments/confirmar/
    Body: {"compra_id": 123}

    Solo para métodos distintos a Wompi (contra entrega, transferencia).
    """

    def post(self, request):

        compra_id = request.data.get("compra_id")

        if not compra_id:
            return Response(
                {"detail": "Se requiere 'compra_id'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        compra = get_object_or_404(Compra, id_compra=compra_id)

        pago = (
            Pago.objects
            .filter(compra=compra)
            .select_related("metodo_pago")
            .order_by("-fecha_pago")
            .first()
        )

        if not pago:
            return Response(
                {"detail": "No existe un pago para esta compra."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        metodo_tipo = (pago.metodo_pago.tipo or "").lower() if pago.metodo_pago else ""

        if metodo_tipo == "wompi":
            return Response(
                {
                    "detail": (
                        "Los pagos con Wompi deben confirmarse vía "
                        "la pasarela, no manualmente."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if pago.estado != "aprobado":
            pago.estado = "aprobado"
            pago.fecha_aprobacion = timezone.now()
            pago.save(update_fields=["estado", "fecha_aprobacion"])

        WompiStatusView._finalizar_compra(compra)

        return Response({
            "ok": True,
            "compra_id": compra.id_compra,
            "pago_id": pago.id_pago,
            "estado": "aprobado",
        })
