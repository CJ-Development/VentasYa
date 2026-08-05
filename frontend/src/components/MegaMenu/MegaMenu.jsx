import "./MegaMenu.css";

function MegaMenu() {

    return (

        <div className="mega-menu">

            <div className="mega-column">

                <h3>Mujer</h3>

                <a href="#">Vestidos</a>
                <a href="#">Blusas</a>
                <a href="#">Jeans</a>
                <a href="#">Chaquetas</a>
                <a href="#">Zapatos</a>

            </div>

            <div className="mega-column">

                <h3>Hombre</h3>

                <a href="#">Camisas</a>
                <a href="#">Jeans</a>
                <a href="#">Chaquetas</a>
                <a href="#">Tenis</a>
                <a href="#">Sudaderas</a>

            </div>

            <div className="mega-column">

                <h3>Niños</h3>

                <a href="#">Niño</a>
                <a href="#">Niña</a>
                <a href="#">Bebés</a>

            </div>

            <div className="mega-column">

                <h3>Accesorios</h3>

                <a href="#">Bolsos</a>
                <a href="#">Gorras</a>
                <a href="#">Relojes</a>
                <a href="#">Cinturones</a>

            </div>

        </div>

    );

}

export default MegaMenu;