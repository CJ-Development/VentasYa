import {
    ShoppingBag,
    Tag,
    Star,
    Grid2X2,
    Users,
    BriefcaseBusiness,
    ShieldCheck,
    FileText,
    CircleHelp,
    Truck,
    RotateCcw,
    MessagesSquare,
    Phone,
    Mail,
    MapPin
} from "lucide-react";


import "./Footer.css";

import logo from "../../../assets/icons/Frame 1.png";


function Footer() {

    return (

        <footer className="site-footer">
            {/* =====================================================
            FONDO NAVY (empieza justo debajo de la onda, no antes)
            ===================================================== */}

            <div
            className="footer-bg"
            aria-hidden="true"
            ></div>


            {/* =====================================================
            ONDAS SUPERIORES
            ===================================================== */}

            <div
            className="footer-waves"
            aria-hidden="true"
            >

            <svg
                viewBox="0 0 1440 200"
                preserveAspectRatio="none"
                width="100%"
                height="100%"
            >

                <path
                    d="M0,60 C300,130 400,-20 720,30 C1040,80 1140,130 1440,70 L1440,200 L0,200 Z"
                    fill="#0EA5B5"
                />

                <path
                    d="M0,90 C300,160 400,10 720,60 C1040,110 1140,160 1440,100 L1440,200 L0,200 Z"
                    fill="#102A3A"
                />

            </svg>

            </div>
            {/* =====================================================
                CONTENIDO PRINCIPAL
            ===================================================== */}

            <div className="footer-container">


                {/* =================================================
                    MARCA
                ================================================= */}

                <div className="footer-brand">

                    <div className="footer-logo">

                        <img
                            src={logo}
                            alt="VentasYa"
                        />

                    </div>


                    <p className="footer-description">

                        En VentasYa encontrarás productos de
                        calidad para tu hogar, tecnología, moda
                        y mucho más, con envíos rápidos a
                        toda Colombia.

                    </p>


                    {/* =================================================
                        REDES SOCIALES
                    ================================================= */}

                    <div className="footer-socials">

                        <a
                            href="#"
                            className="footer-social"
                            aria-label="Facebook"
                        >
                        </a>


                        <a
                            href="#"
                            className="footer-social"
                            aria-label="Instagram"
                        >
                        </a>


                        <a
                            href="#"
                            className="footer-social"
                            aria-label="WhatsApp"
                        >
                        </a>


                        <a
                            href="#"
                            className="footer-social"
                            aria-label="TikTok"
                        >
                        </a>

                    </div>

                </div>


                {/* =================================================
                    COMPRAR
                ================================================= */}

                <div className="footer-column">

                    <h3>
                        Comprar
                    </h3>

                    <span className="footer-title-line"></span>


                    <a href="/products">

                        <ShoppingBag />

                        <span>
                            Productos
                        </span>

                    </a>


                    <a href="/ofertas">

                        <Tag />

                        <span>
                            Ofertas
                        </span>

                    </a>


                    <a href="/new">

                        <Star />

                        <span>
                            Novedades
                        </span>

                    </a>


                </div>


                {/* =================================================
                    EMPRESA
                ================================================= */}

                <div className="footer-column">

                    <h3>
                        Empresa
                    </h3>

                    <span className="footer-title-line"></span>


                    <a href="/nosotros">

                        <Users />

                        <span>
                            Nosotros
                        </span>

                    </a>



                    <a href="/politica-privacidad">

                        <ShieldCheck />

                        <span>
                            Política de privacidad
                        </span>

                    </a>


                    <a href="/terminos">

                        <FileText />

                        <span>
                            Términos y condiciones
                        </span>

                    </a>

                </div>


                {/* =================================================
                    AYUDA
                ================================================= */}

                <div className="footer-column">

                    <h3>
                        Ayuda
                    </h3>

                    <span className="footer-title-line"></span>


                    <a href="/ayuda">

                        <CircleHelp />

                        <span>
                            Centro de ayuda
                        </span>

                    </a>


                    <a href="/envios">

                        <Truck />

                        <span>
                            Envíos
                        </span>

                    </a>


                    <a href="/cambios">

                        <RotateCcw />

                        <span>
                            Cambios y devoluciones
                        </span>

                    </a>


                </div>


                {/* =================================================
                    CONTACTO
                ================================================= */}

                <div className="footer-column footer-contact">

                    <h3>
                        Contacto
                    </h3>

                    <span className="footer-title-line"></span>


                    <a href="tel:+573001234567">

                        <Phone />

                        <span>
                            +57 XXX XXX XXXX
                        </span>

                    </a>


                    <a href="mailto:ventasya@gmail.com">

                        <Mail />

                        <span>
                            ventasya@gmail.com
                        </span>

                    </a>


                </div>

            </div>


            {/* =====================================================
                PARTE INFERIOR
            ===================================================== */}

            <div className="footer-bottom">

                <div className="footer-bottom-container">


                    {/* COPYRIGHT */}

                    <p>
                        © 2026 VentasYa. Todos los derechos reservados.
                    </p>


                </div>

            </div>

        </footer>

    );

}

export default Footer;