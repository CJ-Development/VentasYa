# apps/payments

> **Estado:** Placeholder / módulo pendiente de implementación.

Esta aplicación está registrada en `INSTALLED_APPS` pero no contiene
modelos, vistas, serializers ni URLs definidos.

## TODO

- Definir el modelo de pago (ej. `Pago` con FK a `Compra`, monto, fecha,
  método, referencia de transacción, estado).
- Crear serializers y vistas para registrar pagos desde el checkout.
- Definir URLs y conectarlas en `confiig/urls.py`.
- Diseñar la integración con la pasarela de pago (Wompi, MercadoPago,
  Stripe, etc.) cuando se decida el proveedor.
