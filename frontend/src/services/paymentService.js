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
   WOMPI — Widget embebido
=========================== */

export const getWompiMerchant = () =>
    api.get(`/payments/wompi/merchant/`);

export const getWompiWidgetData = (compraId) =>
    api.get(`/payments/wompi/widget-data/`, {
        params: { compra_id: compraId },
    });

export const consultarEstadoPago = (compraId) =>
    api.get(`/payments/wompi/status/`, {
        params: { compra_id: compraId },
    });

/* ===========================
   CONFIRMAR PAGO
   Solo métodos distintos a Wompi.
=========================== */

export const confirmarPago = (compraId) =>
    api.post(`/payments/confirmar/`, { compra_id: compraId });
