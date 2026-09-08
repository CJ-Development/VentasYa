import "./Navbar.css";

import Logo from "./Logo";
import SearchBar from "./SearchBar";
import NavLinks from "./NavLinks";
import CartButton from "./CartButton";

import CartDrawer from "../../cart/CartDrawer/CartDrawer";

import { useAuth } from "../../../hooks/useAuth";
import { esAdmin } from "../../../utils/esAdmin";
import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

function Navbar() {
    const { usuario } = useAuth();
    const isAdmin = esAdmin(usuario);

    return (
        <header className="navbar">

            <div className="navbar-top">

                <Logo />

                <SearchBar />

                <div className="navbar-actions">
                    {isAdmin && (
                        <Link
                            to="/admin"
                            className="admin-panel-link"
                            title="Panel administrativo"
                        >
                            <LayoutDashboard size={18} />
                            <span>Panel admin</span>
                        </Link>
                    )}
                    <CartButton />
                </div>

            </div>

            <NavLinks />

            <CartDrawer />

        </header>
    );
}

export default Navbar;
