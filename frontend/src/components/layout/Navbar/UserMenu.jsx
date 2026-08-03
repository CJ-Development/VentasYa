import {
    User,
    Heart,
    Package,
    LogOut,
    Settings
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";

function UserMenu() {

    const { usuario, logout } = useAuth();

    const navigate = useNavigate();

    const handleLogout = () => {

        logout();

        navigate("/");

    };

    // Usuario NO autenticado
    if (!usuario) {

        return (

            <Link
                to="/login"
                className="icon-button"
            >

                <User size={20} />

                <span>Iniciar sesión</span>

            </Link>

        );

    }

    // Usuario autenticado
    return (

        <div className="user-menu">

            <button
                type="button"
                className="icon-button"
            >

                <User size={20} />

                <span>{usuario.nombres}</span>

            </button>

            <div className="user-dropdown">

                <Link to="/profile">

                    <User size={18} />

                    Mi perfil

                </Link>

                <Link to="/orders">

                    <Package size={18} />

                    Mis pedidos

                </Link>

                <Link to="/favorites">

                    <Heart size={18} />

                    Favoritos

                </Link>

                <Link to="/settings">

                    <Settings size={18} />

                    Configuración

                </Link>

                <button
                    type="button"
                    onClick={handleLogout}
                >

                    <LogOut size={18} />

                    Cerrar sesión

                </button>

            </div>

        </div>

    );

}

export default UserMenu;