import axios from "axios";

/* =====================================================
   Cliente HTTP único del proyecto
   - Reemplaza la duplicación entre api/axios.js y este archivo.
   - Mantiene compatibilidad con imports existentes vía api/axios.js.

   Autenticación:
   - withCredentials=true para que el navegador envíe la cookie
     de sesión Django (sessionid) en cada request.
   - xsrfCookieName / xsrfHeaderName: axios lee la cookie csrftoken
     automáticamente y la envía como X-CSRFToken en POST/PUT/DELETE.
   - Fallback manual: si por algún motivo axios no encuentra la
     cookie (cookie con HttpOnly, dominio cross-site, etc.), el
     interceptor de request la lee de document.cookie y la agrega
     como header `X-CSRFToken`. Esto cubre el caso visto en Vercel
     donde DRF responde 403 "CSRF Failed" tras registrarse, porque
     la cookie csrftoken aún no estaba presente en el documento.

   URL del backend:
   - Producción: VITE_API_URL (inyectada por Vercel al build).
   - Desarrollo: fallback a http://127.0.0.1:8000/api/.
===================================================== */

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
    xsrfCookieName: "csrftoken",
    xsrfHeaderName: "X-CSRFToken",
});

/* Lee una cookie por nombre. Devuelve null si document.cookie
 * está vacío (servidor SSR / entorno sin DOM). */
function readCookie(name) {
    if (typeof document === "undefined" || !document.cookie) return null;
    const match = document.cookie.match(
        new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"),
    );
    return match ? decodeURIComponent(match[1]) : null;
}

// Interceptor de request:
// 1. Para POST/PUT/DELETE/PATCH agrega ?usuario_id=<id> si existe en
//    localStorage. Esto evita depender sólo de la cookie de sesión,
//    que en cross-host dev o en SameSite=Lax puede no llegar.
// 2. Asegura que el header X-CSRFToken viaje en métodos inseguros,
//    incluso si axios no detectó la cookie csrftoken por sí mismo.
api.interceptors.request.use((config) => {
    const method = (config.method || "get").toLowerCase();

    if (["post", "put", "delete", "patch"].includes(method)) {
        // a) usuario_id desde localStorage (compatibilidad con
        //    endpoints admin que ya no dependen de DRF auth).
        try {
            const raw = localStorage.getItem("usuario");
            if (raw) {
                const usuario = JSON.parse(raw);
                const id = usuario?.id_usuario || usuario?.id;
                if (id && !config.params?.usuario_id) {
                    config.params = {
                        ...(config.params || {}),
                        usuario_id: id,
                    };
                }
            }
        } catch (e) {
            // sin localStorage usable: la request sale sin usuario_id
            // y el backend exigirá sesión.
        }

        // b) CSRF token: si axios no lo inyectó, lo leemos a mano.
        if (!config.headers?.["X-CSRFToken"]) {
            const token = readCookie("csrftoken");
            if (token) {
                config.headers = config.headers || {};
                config.headers["X-CSRFToken"] = token;
            }
        }
    }

    return config;
});

// Interceptor: maneja 401/403 a nivel global y agrega logging útil
// para diagnosticar problemas de CSRF o permisos en desarrollo.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response) {
            const { status, data } = error.response;

            if (status === 403) {
                // DRF devuelve tres 403 comunes:
                //   - "detail": "Authentication credentials were not provided." → falta sesión
                //   - "detail": "You do not have permission to perform this action." → falta is_staff
                //   - "detail": "CSRF Failed: ..." → falta X-CSRFToken
                const detail = data?.detail || "Sin detalle del servidor";
                console.warn("[api] 403:", detail, { url: error.config?.url });
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

/* Devuelve el estado de la sesión actual según el backend
 * (autenticado, is_staff, email, etc.). Útil para diagnosticar
 * problemas de permisos sin tener que abrir el admin de Django. */
export const me = () => {
    return api.get("users/me/");
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