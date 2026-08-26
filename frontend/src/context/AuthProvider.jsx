import { createContext, useEffect, useState } from "react";

import { getCsrfToken } from "../services/api";

export const AuthContext = createContext();

function AuthProvider({ children }) {

    const [usuario, setUsuario] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const usuarioGuardado = localStorage.getItem("usuario");

        if (usuarioGuardado) {

            setUsuario(JSON.parse(usuarioGuardado));

        }

        // Refrescamos CSRF al montar. La cookie csrftoken es
        // HTTP-only de sesión: tras un reload el frontend no la
        // tiene garantizada hasta hacer un GET que la emita.
        // Si el primer POST tras reload es contra un endpoint
        // protegido, axios lee la cookie antes de que exista y
        // el backend responde 403.
        getCsrfToken().catch((err) => {
            console.warn(
                "[AuthProvider] No se pudo refrescar CSRF al montar:",
                err
            );
        });

        setLoading(false);

    }, []);

    const login = (data) => {

        localStorage.setItem(
            "usuario",
            JSON.stringify(data)
        );

        setUsuario(data);

    };

    const updateUsuario = (data) => {
        const merged = { ...(usuario || {}), ...data };
        localStorage.setItem("usuario", JSON.stringify(merged));
        setUsuario(merged);
    };

    const logout = () => {

        localStorage.removeItem("usuario");

        setUsuario(null);

    };

    return (

        <AuthContext.Provider

            value={{

                usuario,

                loading,

                login,

                logout,

                updateUsuario,

            }}

        >

            {children}

        </AuthContext.Provider>

    );

}

export default AuthProvider;