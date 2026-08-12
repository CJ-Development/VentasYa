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
