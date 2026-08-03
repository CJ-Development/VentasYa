import api from "./api";

/* ===========================
   PRODUCTOS
=========================== */

export const getProducts = () => api.get("/products/");

export const createProduct = (data) => api.post("/products/", data);

export const updateProduct = (id, data) => api.put(`/products/${id}/`, data);

export const deleteProduct = (id) => api.delete(`/products/${id}/`);


/* ===========================
   CATEGORIAS
=========================== */

export const getCategories = () => api.get("/categories/");

export const createCategory = (data) => api.post("/categories/", data);

export const updateCategory = (id, data) => api.put(`/categories/${id}/`, data);

export const deleteCategory = (id) => api.delete(`/categories/${id}/`);


/* ===========================
   OFERTAS
=========================== */

export const getOffers = () => api.get("/offers/");

export const createOffer = (data) => api.post("/offers/", data);

export const updateOffer = (id, data) => api.put(`/offers/${id}/`, data);

export const deleteOffer = (id) => api.delete(`/offers/${id}/`);


/* ===========================
   PEDIDOS
=========================== */

export const getOrders = () => api.get("/orders/");

export const updateOrderStatus = (id, data) =>
    api.put(`/orders/${id}/`, data);


/* ===========================
   USUARIOS
=========================== */

export const getUsers = () => api.get("/users/");