import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

function AuthProvider({ children }) {

    const [usuario, setUsuario] = useState(null);

    useEffect(() => {

        const usuarioGuardado = localStorage.getItem("usuario");

        if (usuarioGuardado) {

            setUsuario(JSON.parse(usuarioGuardado));

        }

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
                login,
                logout
            }}
        >

            {children}

        </AuthContext.Provider>

    );

}

export default AuthProvider;