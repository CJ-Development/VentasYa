import "./Sidebar.css";
import { LayoutDashboard, Package, FolderTree, Percent, ShoppingCart, Users, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
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
            <div className="sidebar-logo">

                <img src={Logo} alt="VentasYa" className="sidebar-logo-image" />
                <span className="sidebar-role">

                    Administrador

                </span>

            </div>

            <nav>

                <NavLink to="/admin">

                    <LayoutDashboard size={20}/>

                    Dashboard

                </NavLink>

                <NavLink to="/admin/products">

                    <Package size={20}/>

                    Productos

                </NavLink>

                <NavLink to="/admin/categories">

                    <FolderTree size={20}/>

                    Categorías

                </NavLink>

                <NavLink to="/admin/offers">

                    <Percent size={20}/>

                    Ofertas

                </NavLink>

                <NavLink to="/admin/orders">

                    <ShoppingCart size={20}/>

                    Pedidos

                </NavLink>

                <NavLink to="/admin/users">

                    <Users size={20}/>

                    Usuarios

                </NavLink>

                <NavLink to="/admin/configuracion">

                    <Settings size={20}/>

                    Configuración

                </NavLink>

            </nav>

            <div className="sidebar-footer">

            <div className="admin-user">

                <strong>

                    {usuario.nombres}

                </strong>

                <span>

                    Administrador

                </span>

            </div>

            <button
                className="logout-button"
                onClick={handleLogout}
            >

                <LogOut size={18} />

                Cerrar sesión

            </button>

        </div>
        </aside>

    );

}

export default Sidebar;