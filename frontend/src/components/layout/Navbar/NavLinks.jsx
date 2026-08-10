import { useState } from "react";

import MegaMenu from "../../MegaMenu/MegaMenu";

function NavLinks() {

    const [showProducts, setShowProducts] = useState(false);

    const [showOffers, setShowOffers] = useState(false);

    return (

        <nav className="navbar-bottom">

            <a href="/">Inicio</a>
            <div className="nav-item" onMouseEnter={() => setShowProducts(true)} onMouseLeave={() => setShowProducts(false)} >
                <a href="/products"> Productos </a>
                {showProducts && <MegaMenu variant="productos" />}
            </div>
            <div className="nav-item" onMouseEnter={() => setShowOffers(true)} onMouseLeave={() => setShowOffers(false)}>
                <a href="/offers"> Ofertas </a>
                {showOffers && <MegaMenu variant="ofertas" />}
            </div>
            <a href="/new"> Novedades </a>
        </nav>

    );

}

export default NavLinks;