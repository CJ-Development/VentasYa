from django.db import models


class Pago(models.Model):
    """
    Pago asociado a una Compra.

    El flujo es:
      1. Compra se crea en estado 'pendiente' (POST /orders/checkout/).
      2. Si el método es Wompi, el frontend abre el Widget embebido con
         los datos servidos por /payments/wompi/widget-data/.
      3. Wompi notifica vía webhook → estado pasa a 'aprobado'/'rechazado'.
      4. ConfirmarPagoView cubre métodos no-Wompi (contra entrega, etc.).
    """

    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("aprobado", "Aprobado"),
        ("rechazado", "Rechazado"),
        ("reembolsado", "Reembolsado"),
        ("expirado", "Expirado"),
    ]

    id_pago = models.AutoField(primary_key=True)

    compra = models.ForeignKey(
        "orders.Compra",
        on_delete=models.CASCADE,
        db_column="id_compra",
        related_name="pagos",
    )

    metodo_pago = models.ForeignKey(
        "orders.MetodoPago",
        on_delete=models.PROTECT,
        db_column="id_metodo_pago",
    )

    monto = models.DecimalField(max_digits=10, decimal_places=2)

    # Referencia única que se envía a Wompi (idempotencia).
    referencia_transaccion = models.CharField(
        max_length=120,
        blank=True,
        null=True,
        db_index=True,
    )

    # ID real de la transacción generado por Wompi (lo devuelve el webhook).
    wompi_transaction_id = models.CharField(
        max_length=120,
        blank=True,
        null=True,
        db_index=True,
    )

    # Tokens de aceptación de Wompi que se enviaron al Widget.
    # Se guardan para auditoría/legal (Habeas Data).
    acceptance_token_usado = models.CharField(
        max_length=200,
        blank=True,
        null=True,
    )
    personal_data_auth_token_usado = models.CharField(
        max_length=200,
        blank=True,
        null=True,
    )

    # Email del cliente enviado al Widget (antifraude).
    customer_email = models.EmailField(blank=True, null=True)

    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default="pendiente",
    )

    fecha_pago = models.DateTimeField(auto_now_add=True)

    fecha_aprobacion = models.DateTimeField(null=True, blank=True)

    # Aceptaciones legales de VentasYa
    terminos_aceptados = models.BooleanField(default=False)
    datos_aceptados = models.BooleanField(default=False)
    fecha_aceptacion = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "pagos"

    def __str__(self):
        return f"Pago #{self.id_pago} - {self.estado}"


class ReservaStock(models.Model):
    """
    Reserva temporal de stock mientras el cliente paga con Wompi.

    Se crea al momento de crear la Compra (estado 'pendiente') y se
    libera automáticamente si el pago se rechaza, expira o nunca llega.

    La reserva descuenta el stock visualmente pero se 'revierte' si
    el pago falla. Esto evita overselling durante la ventana del Widget.
    """

    ESTADOS = [
        ("activa", "Activa"),
        ("confirmada", "Confirmada"),  # stock ya descontado definitivamente
        ("liberada", "Liberada"),       # stock devuelto por rechazo/expiración
    ]

    id_reserva = models.AutoField(primary_key=True)

    compra = models.OneToOneField(
        "orders.Compra",
        on_delete=models.CASCADE,
        db_column="id_compra",
        related_name="reserva_stock",
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default="activa",
    )

    fecha_creacion = models.DateTimeField(auto_now_add=True)

    fecha_expiracion = models.DateTimeField()

    fecha_liberacion = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "reservas_stock"
        indexes = [
            models.Index(
                fields=["estado", "fecha_expiracion"],
                name="idx_reserva_estado_exp",
            ),
        ]

    def __str__(self):
        return f"Reserva #{self.id_reserva} - {self.estado}"


class WompiWebhookEvent(models.Model):
    """
    Auditoría cruda de todos los eventos recibidos de Wompi.

    Se usa para:
      - Debug cuando un pago no concuerda.
      - Detectar reintentos de Wompi (idempotencia por event_id).
      - Cumplimiento de auditoría (Habeas Data, trazabilidad).
    """

    ESTADOS_PROCESAMIENTO = [
        ("recibido", "Recibido"),
        ("procesado", "Procesado"),
        ("ignorado", "Ignorado"),
        ("error", "Error"),
    ]

    id_evento = models.AutoField(primary_key=True)

    event_id = models.CharField(
        max_length=120,
        unique=True,
        db_index=True,
    )

    event_type = models.CharField(max_length=80, db_index=True)

    transaction_id = models.CharField(
        max_length=120,
        blank=True,
        null=True,
        db_index=True,
    )

    reference = models.CharField(
        max_length=120,
        blank=True,
        null=True,
        db_index=True,
    )

    payload = models.JSONField()

    signature_valid = models.BooleanField(default=False)

    estado_procesamiento = models.CharField(
        max_length=20,
        choices=ESTADOS_PROCESAMIENTO,
        default="recibido",
    )

    error_detalle = models.TextField(blank=True, null=True)

    received_at = models.DateTimeField(auto_now_add=True)

    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "wompi_webhook_events"
        ordering = ["-received_at"]

    def __str__(self):
        return f"WompiEvent #{self.id_evento} - {self.event_type}"
