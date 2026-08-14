import api from "./api";

/* ===========================
   CARRITO
=========================== */

export const getMyCart = () =>
    api.get(`/cart/`);

export const addToCart = (varianteId, cantidad = 1) =>
    api.post(`/cart/`, {
        variante_id: varianteId,
        cantidad,
    });

export const updateCartItem = (itemId, cantidad) =>
    api.put(`/cart/items/${itemId}/`, { cantidad });

export const removeFromCart = (itemId) =>
    api.delete(`/cart/items/${itemId}/`);


/* ===========================
   PEDIDOS (cliente)
=========================== */

export const getMyOrders = () =>
    api.get(`/orders/mis-pedidos/`);

export const getOrderDetail = (id) =>
    api.get(`/orders/${id}/`);


/* ===========================
   OFERTAS
=========================== */

export const getOffers = () =>
    api.get(`/offers/`);


/* ===========================
   FAVORITOS
=========================== */

export const getMyFavorites = () =>
    api.get(`/favorites/`);

export const addFavorite = (productoId) =>
    api.post(`/favorites/`, { producto_id: productoId });

export const removeFavorite = (idFavorito) =>
    api.delete(`/favorites/${idFavorito}/`);


/* ===========================
   USUARIO (perfil / settings)
=========================== */

export const getMyProfile = () =>
    api.get(`/users/me/`);

export const updateMyProfile = (data) =>
    api.put(`/users/me/`, data);

export const changePassword = (data) =>
    api.post(`/users/me/cambiar-password/`, data);
