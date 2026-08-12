import { useState } from "react";
import { Link } from "react-router-dom";

import MegaMenu from "../../MegaMenu/MegaMenu";

function NavLinks() {
    const [showProducts, setShowProducts] = useState(false);
    const [showOffers, setShowOffers] = useState(false);

    return (
        <nav className="navbar-bottom">

            {/* ==================================================
                INICIO
            ================================================== */}

            <div className="nav-item nav-item-home">

                <Link
                    to="/"
                    className="nav-link"
                >
                    Inicio
                </Link>

            </div>


            {/* ==================================================
                PRODUCTOS
            ================================================== */}

            <div
                className="nav-item nav-item-products"
                onMouseEnter={() => setShowProducts(true)}
                onMouseLeave={() => setShowProducts(false)}
            >

                <Link
                    to="/products"
                    className="nav-link"
                >
                    Productos
                </Link>

                {showProducts && (
                    <MegaMenu variant="productos" />
                )}

            </div>


            {/* ==================================================
                OFERTAS
            ================================================== */}

            <div
                className="nav-item nav-item-offers"
                onMouseEnter={() => setShowOffers(true)}
                onMouseLeave={() => setShowOffers(false)}
            >

                <Link
                    to="/offers"
                    className="nav-link"
                >
                    Ofertas
                </Link>

                {showOffers && (
                    <MegaMenu variant="ofertas" />
                )}

            </div>


            {/* ==================================================
                NOVEDADES
            ================================================== */}

            <div className="nav-item">

                <Link
                    to="/new"
                    className="nav-link"
                >
                    Novedades
                </Link>

            </div>

        </nav>
    );
}

export default NavLinks;