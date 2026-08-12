import "./Sidebar.css";

import {
    LayoutDashboard,
    Package,
    FolderTree,
    Percent,
    ShoppingCart,
    Users,
    Settings,
    LogOut
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import Logo from "../../assets/icons/Frame 1.png";


function Sidebar() {

    const { logout, usuario } = useAuth();

    const navigate = useNavigate();

    const handleLogout = () => {

        logout();

        navigate("/");

    };


    return (

        <aside className="admin-sidebar">

            {/* LOGO */}

            <div className="sidebar-logo">

                <img
                    src={Logo}
                    alt="VentasYa"
                    className="sidebar-logo-image"
                />

                <span className="sidebar-role">
                    Panel administrativo
                </span>

            </div>


            {/* MENÚ */}

            <nav className="sidebar-nav">

                <NavLink
                    to="/admin"
                    end
                >
                    <LayoutDashboard size={19} />
                    <span>Dashboard</span>
                </NavLink>


                <NavLink to="/admin/products">

                    <Package size={19} />

                    <span>
                        Productos
                    </span>

                </NavLink>


                <NavLink to="/admin/categories">

                    <FolderTree size={19} />

                    <span>
                        Categorías
                    </span>

                </NavLink>


                <NavLink to="/admin/offers">

                    <Percent size={19} />

                    <span>
                        Ofertas
                    </span>

                </NavLink>


                <NavLink to="/admin/orders">

                    <ShoppingCart size={19} />

                    <span>
                        Pedidos
                    </span>

                </NavLink>


                <NavLink to="/admin/users">

                    <Users size={19} />

                    <span>
                        Usuarios
                    </span>

                </NavLink>


                <div className="sidebar-separator"></div>


                <NavLink to="/admin/configuracion">

                    <Settings size={19} />

                    <span>
                        Configuración
                    </span>

                </NavLink>

            </nav>


            {/* USUARIO */}

            <div className="sidebar-footer">

                <div className="admin-user">

                    <div className="admin-avatar">

                        {usuario?.nombres?.charAt(0)?.toUpperCase() || "A"}

                    </div>


                    <div className="admin-info">

                        <strong>
                            {usuario?.nombres || "Administrador"}
                        </strong>

                        <span>
                            Administrador
                        </span>

                    </div>

                </div>


                <button
                    className="logout-button"
                    onClick={handleLogout}
                    type="button"
                >

                    <LogOut size={17} />

                    <span>
                        Cerrar sesión
                    </span>

                </button>

            </div>

        </aside>

    );

}


export default Sidebar;