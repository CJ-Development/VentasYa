import axios from "axios";

/* =====================================================
   Cliente HTTP único del proyecto
   - Reemplaza la duplicación entre api/axios.js y este archivo.
   - Mantiene compatibilidad con imports existentes vía api/axios.js.
   - Agrega interceptor JWT con refresh automático
===================================================== */

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
    headers: {
        "Content-Type": "application/json",
    },
});

/* =====================================================
   INTERCEPTOR JWT
   - Añade Authorization header con access token
   - Refresca token automáticamente al recibir 401
===================================================== */

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("access");
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si es 401 y no hemos intentado refrescar todavía
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Si ya estamos refrescando, poner en cola
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem("refresh");

            if (!refreshToken) {
                processQueue(error, null);
                isRefreshing = false;
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(
                    "http://127.0.0.1:8000/api/users/token/refresh/",
                    { refresh: refreshToken }
                );

                const { access } = response.data;
                localStorage.setItem("access", access);

                processQueue(null, access);
                isRefreshing = false;

                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;
                
                // Limpiar tokens si el refresh falló
                localStorage.removeItem("access");
                localStorage.removeItem("refresh");
                
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

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