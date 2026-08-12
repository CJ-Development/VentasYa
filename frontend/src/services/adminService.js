import api from "./api";

/* ===========================
   PRODUCTOS
=========================== */

export const getProducts = (params = {}) => {
    const { signal, ...filters } = params || {};
    const config = {};
    if (Object.keys(filters).length > 0) {
        config.params = filters;
    }
    if (signal) {
        config.signal = signal;
    }
    return api.get("/products/", config);
};

export const getProduct = (id) => api.get(`/products/${id}/`);

export const createProduct = (data) => api.post("/products/", data);

export const updateProduct = (id, data) => api.put(`/products/${id}/`, data);

export const archiveProduct = (id) => api.delete(`/products/${id}/`);

export const reactivateProduct = (id) =>
    api.post(`/products/${id}/reactivar/`);

export const reactivateProductById = reactivateProduct;

/* Variantes */

export const getVariants = (productId) =>
    api.get(`/products/${productId}/variantes/`);

export const createVariant = (productId, data) =>
    api.post(`/products/${productId}/variantes/`, data);

export const updateVariant = (variantId, data) =>
    api.put(`/products/variantes/${variantId}/`, data);

export const deleteVariant = (variantId) =>
    api.delete(`/products/variantes/${variantId}/`);

/* Imágenes de variante (URL) */

export const addVariantImage = (variantId, data) =>
    api.post(`/products/variantes/${variantId}/imagenes/`, data);

export const updateVariantImage = (imageId, data) =>
    api.put(`/products/imagenes/${imageId}/`, data);

export const deleteVariantImage = (imageId) =>
    api.delete(`/products/imagenes/${imageId}/`);

/* Subida de imagen con archivo (multipart/form-data). */

export const uploadVariantImage = (variantId, formData) =>
    api.post(
        `/products/variantes/${variantId}/imagenes/`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        },
    );

/* Colores y tallas */

export const getColors = () => api.get("/products/colores/");

export const createColor = (data) =>
    api.post("/products/colores/", data);

export const updateColor = (id, data) =>
    api.put(`/products/colores/${id}/`, data);

export const deleteColor = (id) =>
    api.delete(`/products/colores/${id}/`);

export const getTallas = () => api.get("/products/tallas/");

export const createTalla = (data) =>
    api.post("/products/tallas/", data);

export const updateTalla = (id, data) =>
    api.put(`/products/tallas/${id}/`, data);

export const deleteTalla = (id) =>
    api.delete(`/products/tallas/${id}/`);


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

export const deleteOrder = (id) =>
    api.delete(`/orders/${id}/`);


/* ===========================
   USUARIOS
=========================== */

export const getUsers = () => api.get("/users/");

export const getUser = (id) => api.get(`/users/${id}/`);

export const updateUser = (id, data) => api.put(`/users/${id}/`, data);

export const deleteUser = (id) => api.delete(`/users/${id}/`);