from django.db import models


class Pago(models.Model):
    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("aprobado", "Aprobado"),
        ("rechazado", "Rechazado"),
    ]

    id_pago = models.AutoField(primary_key=True)
    compra = models.ForeignKey("orders.Compra", on_delete=models.CASCADE, db_column="id_compra")
    metodo_pago = models.ForeignKey("orders.MetodoPago", on_delete=models.PROTECT, db_column="id_metodo_pago")
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")
    referencia_transaccion = models.CharField(max_length=100, blank=True, null=True)
    fecha_pago = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "pagos"

    def __str__(self):
        return f"Pago {self.id_pago}"
