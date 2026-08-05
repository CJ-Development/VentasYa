import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

function AuthProvider({ children }) {

    const [usuario, setUsuario] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const usuarioGuardado = localStorage.getItem("usuario");

        if (usuarioGuardado) {

            setUsuario(JSON.parse(usuarioGuardado));

        }

        setLoading(false);

    }, []);

    const login = (data) => {

        localStorage.setItem(
            "usuario",
            JSON.stringify(data)
        );

        setUsuario(data);

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

                logout

            }}

        >

            {children}

        </AuthContext.Provider>

    );

}

export default AuthProvider;