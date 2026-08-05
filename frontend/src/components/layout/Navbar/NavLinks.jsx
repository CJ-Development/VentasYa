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
                {showProducts && <MegaMenu />}
            </div>
            <div className="nav-item" onMouseEnter={() => setShowOffers(true)} onMouseLeave={() => setShowOffers(false)}>
                <a href="/offers"> Ofertas </a>
                {showOffers && <MegaMenu />}
            </div>
            <a href="/new"> Novedades </a>
            <a href="/about"> Nosotros </a>
            <a href="/help"> Ayuda </a>
        </nav>

    );

}

export default NavLinks;