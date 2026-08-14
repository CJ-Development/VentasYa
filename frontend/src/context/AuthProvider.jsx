import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

function AuthProvider({ children }) {

    const [usuario, setUsuario] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const usuarioGuardado = localStorage.getItem("usuario");
        const accessToken = localStorage.getItem("access");

        // Solo restaurar sesión si hay usuario Y token
        if (usuarioGuardado && accessToken) {

            setUsuario(JSON.parse(usuarioGuardado));

        }

        setLoading(false);

    }, []);

    const login = (data) => {
        // Guardar tokens JWT
        if (data.access) {
            localStorage.setItem("access", data.access);
        }
        if (data.refresh) {
            localStorage.setItem("refresh", data.refresh);
        }

        // Guardar datos del usuario
        const usuarioData = data.usuario || data;
        localStorage.setItem(
            "usuario",
            JSON.stringify(usuarioData)
        );

        setUsuario(usuarioData);

    };

    const updateUsuario = (data) => {
        const merged = { ...(usuario || {}), ...data };
        localStorage.setItem("usuario", JSON.stringify(merged));
        setUsuario(merged);
    };

    const logout = () => {

        localStorage.removeItem("usuario");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

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