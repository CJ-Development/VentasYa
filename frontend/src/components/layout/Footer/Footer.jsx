import "./Footer.css";
import logo from "../../../assets/icons/Frame 1.png";

function Footer() {
    return (
        <footer className="footer">

            <div className="footer-container">

                <div className="footer-grid">

                    <div className="footer-brand">

                        <img src={logo} alt="VentasYa" className="footer-logo" />

                        <p>
                            En VentasYa encontrarás productos de calidad para tu hogar,
                            tecnología, moda y mucho más, con envíos rápidos a toda Colombia.
                        </p>

                    </div>

                    <div className="footer-column">
                        <h3>Comprar</h3>

                        <a href="#">Productos</a>
                        <a href="#">Ofertas</a>
                        <a href="#">Novedades</a>
                        <a href="#">Categorías</a>
                    </div>

                    <div className="footer-column">
                        <h3>Empresa</h3>

                        <a href="#">Nosotros</a>
                        <a href="#">Trabaja con nosotros</a>
                        <a href="#">Política de privacidad</a>
                        <a href="#">Términos y condiciones</a>
                    </div>

                    <div className="footer-column">
                        <h3>Ayuda</h3>

                        <a href="#">Centro de ayuda</a>
                        <a href="#">Envíos</a>
                        <a href="#">Cambios y devoluciones</a>
                        <a href="#">Preguntas frecuentes</a>
                    </div>

                    <div className="footer-column">
                        <h3>Contacto</h3>

                        <p>📞 +57 300 123 4567</p>
                        <p>✉ contacto@ventasya.com</p>
                        <p>📍 Colombia</p>

                    </div>

                </div>

                <div className="footer-divider"></div>

                <div className="footer-bottom">

                    <p>
                        © 2026 VentasYa. Todos los derechos reservados.
                    </p>

                    <div className="footer-payments">

                        <span>Visa</span>
                        <span>Mastercard</span>
                        <span>PSE</span>
                        <span>Nequi</span>

                    </div>

                </div>

            </div>

        </footer>
    );
}

export default Footer;