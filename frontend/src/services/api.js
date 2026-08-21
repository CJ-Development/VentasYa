import axios from "axios";

/*
=====================================================
 CLIENTE HTTP ÚNICO
=====================================================
- Usa la URL de VITE_API_URL en producción.
- Usa localhost en desarrollo.
- Envía cookies de sesión Django.
- Envía automáticamente CSRF.
- Mantiene compatibilidad con endpoints existentes.
=====================================================
*/

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000/api/";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,

    xsrfCookieName: "csrftoken",
    xsrfHeaderName: "X-CSRFToken",
});

/*
=====================================================
 LEER COOKIE
=====================================================
*/

function readCookie(name) {
    if (
        typeof document === "undefined" ||
        !document.cookie
    ) {
        return null;
    }

    const cookies = document.cookie.split(";");

    for (const cookie of cookies) {
        const [key, ...valueParts] = cookie.trim().split("=");

        if (key === name) {
            return decodeURIComponent(valueParts.join("="));
        }
    }

    return null;
}

/*
=====================================================
 REQUEST INTERCEPTOR
=====================================================
*/

api.interceptors.request.use(
    (config) => {

        const method =
            (config.method || "get").toLowerCase();

        /*
        ---------------------------------------------
        CSRF
        ---------------------------------------------
        */

    if (
        ["post", "put", "patch", "delete"].includes(method)
    ) {
        // Leer el token CSRF directamente de la cookie
        const csrfToken = readCookie("csrftoken");

        if (csrfToken) {
            config.headers =
                config.headers || {};

            if (!config.headers["X-CSRFToken"]) {
                config.headers["X-CSRFToken"] = csrfToken;
            }
        }
    }
        /*
        ---------------------------------------------
        USUARIO_ID: eliminado.

        Los endpoints admin se autentican por sesión Django
        (request.user.is_staff), NO por ?usuario_id. Mete el
        id_usuario como query param solo si el endpoint lo pide
        explícitamente en su llamada (ej. /api/cart/?usuario_id=…).
        ---------------------------------------------
        */

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);

/*
=====================================================
 RESPONSE INTERCEPTOR
=====================================================
*/

api.interceptors.response.use(

    (response) => response,

    (error) => {

        const response = error?.response;

        if (response) {

            const status = response.status;
            const data = response.data;

            if (status === 401) {

                console.warn(
                    "[api] 401 - Usuario no autenticado",
                    {
                        url: error.config?.url,
                    }
                );
            }

            if (status === 403) {

                console.warn(
                    "[api] 403 - Sin permisos / CSRF",
                    {
                        url: error.config?.url,
                        detail:
                            data?.detail ||
                            data?.error ||
                            "Sin detalle",
                    }
                );
            }
        }

        return Promise.reject(error);
    }
);

/*
=====================================================
 AUTENTICACIÓN
=====================================================
*/

export const register = (data) => {
    return api.post(
        "users/register/",
        data
    );
};

export const login = (data) => {
    return api.post(
        "users/login/",
        data
    );
};

export const logout = () => {
    return api.post(
        "users/logout/"
    );
};

export const me = () => {
    return api.get(
        "users/me/"
    );
};

/*
=====================================================
 USUARIOS
=====================================================
*/

export const getUsers = () => {
    return api.get(
        "users/"
    );
};

export const getUser = (id) => {
    return api.get(
        `users/${id}/`
    );
};

export const updateUser = (id, data) => {
    return api.put(
        `users/${id}/`,
        data
    );
};

export const deleteUser = (id) => {
    return api.delete(
        `users/${id}/`
    );
};

/*
=====================================================
 DASHBOARD
=====================================================
*/

export const getLowStockVariants = () => {
    return api.get(
        "products/low-stock/"
    );
};

/*
=====================================================
 CSRF TOKEN
=====================================================
Obtiene el token CSRF del backend. Es necesario llamar
esto antes de hacer peticiones POST/PUT/DELETE para
asegurarse de tener el token válido.
=====================================================
*/
export const getCsrfToken = async () => {
    const response = await api.get("users/csrf/");

    const token = response.data?.csrfToken;

    if (!token) {
        throw new Error("El backend no devolvió el token CSRF");
    }

    api.defaults.headers.common["X-CSRFToken"] = token;

    return response;
};

export default api;