import api from "./api";


/* ===========================
   MÉTODOS DE PAGO (catálogo)
=========================== */

export const getMetodosPago = () =>
    api.get(`/payments/metodos/`);


/* ===========================
   CHECKOUT TRANSACCIONAL
=========================== */

export const checkout = (payload) =>
    api.post(`/orders/checkout/`, payload);


/* ===========================
   WOMPI
=========================== */

export const crearTransaccionWompi = (compraId) =>
    api.post(`/payments/wompi/crear/`, { compra_id: compraId });

export const consultarEstadoPago = (compraId) =>
    api.get(`/payments/wompi/status/`, { params: { compra_id: compraId } });

/* ===========================
   CONFIRMAR PAGO
   (para métodos distintos a Wompi: contra entrega,
   transferencia bancaria, o modo simulación)
=========================== */

export const confirmarPago = (compraId) =>
    api.post(`/payments/confirmar/`, { compra_id: compraId });
