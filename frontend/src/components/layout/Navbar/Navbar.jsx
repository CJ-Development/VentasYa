import "./Navbar.css";

import Logo from "./Logo";
import SearchBar from "./SearchBar";
import NavLinks from "./NavLinks";
import CartButton from "./CartButton";

import CartDrawer from "../../cart/CartDrawer/CartDrawer";

function Navbar() {
    return (
        <header className="navbar">

            <div className="navbar-top">

                <Logo />

                <SearchBar />

                <div className="navbar-actions">
                    <CartButton />
                </div>

            </div>

            <NavLinks />

            <CartDrawer />

        </header>
    );
}

export default Navbar;
