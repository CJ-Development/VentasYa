import "./Sidebar.css";

import { useState, useEffect } from "react";

import {
    LayoutDashboard,
    Package,
    FolderTree,
    Percent,
    ShoppingCart,
    Users,
    Settings,
    LogOut,
    Menu,
    ChevronsLeft,
    ChevronsRight,
    Store
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import Logo from "../../assets/icons/Frame 1.png";


const STORAGE_KEY = "admin-sidebar-collapsed";


function Sidebar() {

    const { logout, usuario } = useAuth();

    const navigate = useNavigate();

    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === "true";
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, collapsed ? "true" : "false");
        } catch {
            /* ignore */
        }
    }, [collapsed]);

    const handleLogout = () => {

        logout();

        navigate("/");

    };

    const toggle = () => setCollapsed((c) => !c);


    return (

        <aside className={`admin-sidebar${collapsed ? " collapsed" : ""}`}>

            {/* HEADER: LOGO + TOGGLE */}

            <div className="sidebar-header">

                {!collapsed && (
                    <img
                        src={Logo}
                        alt="VentasYa"
                        className="sidebar-logo-image"
                    />
                )}

                <button
                    type="button"
                    className="sidebar-toggle"
                    onClick={toggle}
                    aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
                    title={collapsed ? "Expandir" : "Colapsar"}
                >

                    {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}

                </button>

            </div>


            {!collapsed && (
                <span className="sidebar-role">
                    Panel administrativo
                </span>
            )}


            {/* MENÚ */}

            <nav className="sidebar-nav">

                <NavLink
                    to="/admin"
                    end
                    title="Dashboard"
                >

                    <LayoutDashboard size={19} />

                    {!collapsed && <span>Dashboard</span>}

                </NavLink>


                <NavLink
                    to="/admin/products"
                    title="Productos"
                >

                    <Package size={19} />

                    {!collapsed && <span>Productos</span>}

                </NavLink>


                <NavLink
                    to="/admin/categories"
                    title="Categorías"
                >

                    <FolderTree size={19} />

                    {!collapsed && <span>Categorías</span>}

                </NavLink>


                <NavLink
                    to="/admin/offers"
                    title="Ofertas"
                >

                    <Percent size={19} />

                    {!collapsed && <span>Ofertas</span>}

                </NavLink>


                <NavLink
                    to="/admin/orders"
                    title="Pedidos"
                >

                    <ShoppingCart size={19} />

                    {!collapsed && <span>Pedidos</span>}

                </NavLink>


                <NavLink
                    to="/admin/users"
                    title="Usuarios"
                >

                    <Users size={19} />

                    {!collapsed && <span>Usuarios</span>}

                </NavLink>


                <div className="sidebar-separator"></div>


                <NavLink
                    to="/admin/configuracion"
                    title="Configuración"
                >

                    <Settings size={19} />

                    {!collapsed && <span>Configuración</span>}

                </NavLink>


                <NavLink
                    to="/"
                    title="Ir a la página principal"
                >

                    <Store size={19} />

                    {!collapsed && <span>Página principal</span>}

                </NavLink>

            </nav>


            {/* USUARIO */}

            <div className="sidebar-footer">

                <div
                    className="admin-user"
                    title={usuario?.nombres || "Administrador"}
                >

                    <div className="admin-avatar">

                        {usuario?.nombres?.charAt(0)?.toUpperCase() || "A"}

                    </div>


                    {!collapsed && (
                        <div className="admin-info">

                            <strong>
                                {usuario?.nombres || "Administrador"}
                            </strong>

                            <span>
                                Administrador
                            </span>

                        </div>
                    )}

                </div>


                <button
                    className="logout-button"
                    onClick={handleLogout}
                    type="button"
                    title="Cerrar sesión"
                >

                    <LogOut size={17} />

                    {!collapsed && <span>Cerrar sesión</span>}

                </button>

            </div>

        </aside>

    );

}


export default Sidebar;
