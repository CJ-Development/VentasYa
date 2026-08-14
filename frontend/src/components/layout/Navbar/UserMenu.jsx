import {
    User,
    Heart,
    Package,
    LogOut,
    Settings,
    LayoutDashboard,
    Users,
    Boxes,
    Store
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

    /* ==========================================
       USUARIO NO AUTENTICADO
    ========================================== */

    if (!usuario) {
        return (
            <div className="user-menu">
                <Link
                    to="/login"
                    className="icon-button user-login"
                >
                    <User size={18} />
                    <span>Iniciar sesión</span>
                </Link>
            </div>
        );
    }

    const esAdmin = usuario.es_administrador;

    /* ==========================================
       USUARIO AUTENTICADO — ADMIN (rol === 2)
    ========================================== */

    if (esAdmin) {
        return (
            <div className="user-menu">

                <button
                    type="button"
                    className="icon-button user-login"
                >
                    <User size={18} />
                    <span>{usuario.nombres}</span>
                </button>

                <div className="user-dropdown">

                    <Link to="/admin">
                        <LayoutDashboard size={18} />
                        <span>Panel administrador</span>
                    </Link>

                    <Link to="/admin/products">
                        <Boxes size={18} />
                        <span>Gestionar productos</span>
                    </Link>

                    <Link to="/admin/users">
                        <Users size={18} />
                        <span>Gestionar usuarios</span>
                    </Link>

                    <Link to="/">
                        <Store size={18} />
                        <span>Volver a la tienda</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        <span>Cerrar sesión</span>
                    </button>

                </div>

            </div>
        );
    }

    /* ==========================================
       USUARIO AUTENTICADO — CLIENTE
    ========================================== */

    return (
        <div className="user-menu">

            <button
                type="button"
                className="icon-button user-login"
            >
                <User size={18} />
                <span>{usuario.nombres}</span>
            </button>

            <div className="user-dropdown">

                <Link to="/profile">
                    <User size={18} />
                    <span>Mi perfil</span>
                </Link>

                <Link to="/orders">
                    <Package size={18} />
                    <span>Mis pedidos</span>
                </Link>

                <Link to="/favorites">
                    <Heart size={18} />
                    <span>Favoritos</span>
                </Link>

                <Link to="/settings">
                    <Settings size={18} />
                    <span>Configuración</span>
                </Link>

                <button
                    type="button"
                    onClick={handleLogout}
                >
                    <LogOut size={18} />
                    <span>Cerrar sesión</span>
                </button>

            </div>

        </div>
    );
}

export default UserMenu;