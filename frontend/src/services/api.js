import axios from "axios";

/* =====================================================
   Cliente HTTP único del proyecto
   - Reemplaza la duplicación entre api/axios.js y este archivo.
   - Mantiene compatibilidad con imports existentes vía api/axios.js.
===================================================== */

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;

/* ==========================
   AUTENTICACIÓN
========================== */

export const register = (data) => {
    return api.post("users/register/", data);
};

export const login = (data) => {
    return api.post("users/login/", data);
};

/* ==========================
   USUARIOS
========================== */

export const getUsers = () => {
    return api.get("users/");
};

export const getUser = (id) => {
    return api.get(`users/${id}/`);
};

export const updateUser = (id, data) => {
    return api.put(`users/${id}/`, data);
};

export const deleteUser = (id) => {
    return api.delete(`users/${id}/`);
};

/* ==========================
   DASHBOARD / RESUMEN
========================== */

export const getLowStockVariants = () => {
    return api.get("products/low-stock/");
};