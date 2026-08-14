import api from "./api";

/* =========================================================
   PRODUCTOS
========================================================= */

export const getProducts = (params = {}) => {
    const { signal, ...filters } = params;

    const config = {};

    if (Object.keys(filters).length) {
        config.params = filters;
    }

    if (signal) {
        config.signal = signal;
    }

    return api.get("/products/", config);
};

export const getProduct = (id) =>
    api.get(`/products/${id}/`);

export const createProduct = (data) =>
    api.post("/products/", data);

export const crearProductoCompleto = (formData) =>
    api.post(
        "/products/crear-completo/",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

export const updateProduct = (id, data) =>
    api.put(`/products/${id}/`, data);

export const archiveProduct = (id) =>
    api.delete(`/products/${id}/`);

export const reactivateProduct = (id) =>
    api.post(`/products/${id}/reactivar/`);


/* =========================================================
   VARIANTES DE COLOR
========================================================= */

export const getVariants = (productId) =>
    api.get(`/products/${productId}/colores/`);

export const createVariant = (productId, data) =>
    api.post(`/products/${productId}/colores/`, data);

export const updateVariant = (variantId, data) =>
    api.put(`/products/colores/${variantId}/`, data);

export const deleteVariant = (variantId) =>
    api.delete(`/products/colores/${variantId}/`);


/* =========================================================
   TALLAS
========================================================= */

export const getSizeVariants = (colorVariantId) =>
    api.get(`/products/colores/${colorVariantId}/tallas/`);

export const createSizeVariant = (colorVariantId, data) =>
    api.post(
        `/products/colores/${colorVariantId}/tallas/`,
        data
    );

export const updateSizeVariant = (sizeVariantId, data) =>
    api.put(
        `/products/tallas/${sizeVariantId}/`,
        data
    );

export const deleteSizeVariant = (sizeVariantId) =>
    api.delete(
        `/products/tallas/${sizeVariantId}/`
    );


/* =========================================================
   IMÁGENES
========================================================= */

export const getVariantImages = (colorVariantId) =>
    api.get(
        `/products/colores/${colorVariantId}/imagenes/`
    );

export const uploadVariantImage = (
    colorVariantId,
    formData
) =>
    api.post(
        `/products/colores/${colorVariantId}/imagenes/`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }
    );

export const updateVariantImage = (
    imageId,
    data
) =>
    api.put(
        `/products/imagenes/${imageId}/`,
        data
    );

export const deleteVariantImage = (imageId) =>
    api.delete(
        `/products/imagenes/${imageId}/`
    );


/* =========================================================
   COLORES
========================================================= */

export const getColors = () =>
    api.get("/products/colores-global/");

export const createColor = (data) =>
    api.post(
        "/products/colores-global/",
        data
    );

export const updateColor = (id, data) =>
    api.put(
        `/products/colores-global/${id}/`,
        data
    );

export const deleteColor = (id) =>
    api.delete(
        `/products/colores-global/${id}/`
    );


/* =========================================================
   TALLAS DISPONIBLES
========================================================= */

export const getTallas = async () => ({
    data: [
        { id: "XS", nombre: "XS" },
        { id: "S", nombre: "S" },
        { id: "M", nombre: "M" },
        { id: "L", nombre: "L" },
        { id: "XL", nombre: "XL" },
        { id: "XXL", nombre: "XXL" },
        { id: "XXXL", nombre: "XXXL" },
        { id: "26", nombre: "26" },
        { id: "28", nombre: "28" },
        { id: "30", nombre: "30" },
        { id: "32", nombre: "32" },
        { id: "34", nombre: "34" },
        { id: "36", nombre: "36" },
        { id: "38", nombre: "38" },
        { id: "40", nombre: "40" },
        { id: "42", nombre: "42" },
        { id: "44", nombre: "44" },
        { id: "46", nombre: "46" },
        { id: "UNICA", nombre: "Única" },
    ],
});


/* =========================================================
   STOCK BAJO
========================================================= */

export const getLowStockVariants = () =>
    api.get("/products/low-stock/");


/* =========================================================
   CATEGORÍAS
========================================================= */

export const getCategories = () =>
    api.get("/categories/");

export const createCategory = (data) =>
    api.post("/categories/", data);

export const updateCategory = (id, data) =>
    api.put(`/categories/${id}/`, data);

export const deleteCategory = (id) =>
    api.delete(`/categories/${id}/`);


/* =========================================================
   OFERTAS
========================================================= */

export const getOffers = () =>
    api.get("/offers/");

export const createOffer = (data) =>
    api.post("/offers/", data);

export const updateOffer = (id, data) =>
    api.put(`/offers/${id}/`, data);

export const deleteOffer = (id) =>
    api.delete(`/offers/${id}/`);


/* =========================================================
   PEDIDOS
========================================================= */

export const getOrders = () =>
    api.get("/orders/");

export const updateOrderStatus = (id, data) =>
    api.put(`/orders/${id}/`, data);

export const deleteOrder = (id) =>
    api.delete(`/orders/${id}/`);


/* =========================================================
   USUARIOS
========================================================= */

export const getUsers = () =>
    api.get("/users/");

export const getUser = (id) =>
    api.get(`/users/${id}/`);

export const updateUser = (id, data) =>
    api.put(`/users/${id}/`, data);

export const deleteUser = (id) =>
    api.delete(`/users/${id}/`);