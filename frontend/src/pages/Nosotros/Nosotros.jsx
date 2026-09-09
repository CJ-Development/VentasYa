import "./Nosotros.css";

function Nosotros() {
    return (
        <main className="nosotros-page">
            <div className="nosotros-container">

                {/* =========================
                    HERO
                ========================= */}
                <section className="nosotros-hero">
                    <div className="nosotros-hero-content">
                        <span className="nosotros-eyebrow">
                            BAÚL MÁGICO SHOP
                        </span>

                        <h1>
                            Más que una tienda,
                            <span> una experiencia.</span>
                        </h1>

                        <p>
                            Conoce quiénes somos, qué nos inspira y hacia dónde
                            queremos llevar a Baúl Mágico.
                        </p>
                    </div>

                    <div className="nosotros-hero-decoration" aria-hidden="true">
                        <div className="decoration-circle decoration-circle-one" />
                        <div className="decoration-circle decoration-circle-two" />
                        <div className="decoration-circle decoration-circle-three" />
                    </div>
                </section>

                {/* =========================
                    QUIÉNES SOMOS
                ========================= */}
                <section className="nosotros-section nosotros-about">
                    <div className="nosotros-section-heading">
                        <span className="nosotros-section-number">01</span>

                        <div>
                            <span className="nosotros-section-label">
                                CONÓCENOS
                            </span>

                            <h2>¿Quiénes somos?</h2>
                        </div>
                    </div>

                    <div className="nosotros-content">
                        <p>
                            Baúl Mágico es una tienda virtual colombiana creada
                            para ofrecer una experiencia de compra fácil, segura
                            y cercana, poniendo a disposición de nuestros
                            clientes una variedad de productos para diferentes
                            gustos, necesidades y momentos.
                        </p>

                        <p>
                            Creemos que comprar en línea debe ser mucho más que
                            elegir un producto: debe ser una experiencia
                            práctica, confiable y agradable. Por eso trabajamos
                            para seleccionar productos de calidad, ofrecer una
                            atención personalizada y facilitar cada etapa del
                            proceso, desde la elección hasta la entrega.
                        </p>

                        <p>
                            Realizamos envíos a nivel nacional, buscando llegar
                            cada día a más hogares de Colombia y brindar a
                            nuestros clientes la confianza de comprar desde
                            cualquier lugar.
                        </p>

                        <p>
                            En Baúl Mágico, cada producto puede convertirse en
                            una pequeña sorpresa, una solución, un detalle
                            especial o simplemente en algo que hace más
                            agradable tu día.
                        </p>

                        <div className="nosotros-highlight">
                            <span className="highlight-line" />
                            <p>
                                Baúl Mágico: descubre un mundo de opciones,
                                directo a tu hogar, elige y disfruta.
                            </p>
                        </div>
                    </div>
                </section>

                {/* =========================
                    MISIÓN
                ========================= */}
                <section className="nosotros-section nosotros-mission">
                    <div className="nosotros-section-heading">
                        <span className="nosotros-section-number">02</span>

                        <div>
                            <span className="nosotros-section-label">
                                NUESTRO PROPÓSITO
                            </span>

                            <h2>Misión</h2>
                        </div>
                    </div>

                    <div className="nosotros-content">
                        <p>
                            En Baúl Mágico tenemos como misión ofrecer a
                            nuestros clientes una experiencia de compra virtual
                            fácil, segura, confiable y cercana, poniendo a su
                            alcance productos seleccionados que respondan a
                            diferentes necesidades, gustos y estilos de vida.
                        </p>

                        <p>
                            Nos comprometemos a brindar atención amable y
                            personalizada, procesos de compra sencillos,
                            información clara y entregas eficientes a nivel
                            nacional, construyendo relaciones basadas en la
                            confianza y la satisfacción de nuestros clientes.
                        </p>

                        <p>
                            Queremos que cada compra en Baúl Mágico sea una
                            experiencia positiva, desde el primer contacto hasta
                            recibir el producto en la puerta de su hogar.
                        </p>
                    </div>
                </section>

                {/* =========================
                    VISIÓN
                ========================= */}
                <section className="nosotros-section nosotros-vision">
                    <div className="nosotros-section-heading">
                        <span className="nosotros-section-number">03</span>

                        <div>
                            <span className="nosotros-section-label">
                                HACIA DÓNDE VAMOS
                            </span>

                            <h2>Visión</h2>
                        </div>
                    </div>

                    <div className="nosotros-content">
                        <p>
                            Para el año 2030, Baúl Mágico será reconocida como
                            una tienda virtual colombiana confiable, cercana e
                            innovadora, con cobertura nacional y una amplia
                            variedad de productos, destacándose por la calidad
                            de su servicio, la atención a sus clientes y la
                            responsabilidad en cada entrega.
                        </p>

                        <p>
                            Buscamos crecer de manera sostenible, fortalecer
                            nuestra presencia en el comercio electrónico y
                            construir una comunidad de clientes que encuentren
                            en Baúl Mágico un lugar donde comprar sea fácil,
                            seguro y siempre una experiencia especial.
                        </p>
                    </div>

                    <div className="nosotros-vision-footer">
                        <span>2030</span>
                        <p>
                            Crecer, innovar y seguir creando experiencias
                            especiales.
                        </p>
                    </div>
                </section>

                {/* =========================
                    CIERRE
                ========================= */}
                <section className="nosotros-closing">
                    <div className="nosotros-closing-line" />

                    <p>
                        Gracias por ser parte de{" "}
                        <strong>Baúl Mágico Shop</strong>.
                    </p>

                    <span>
                        Elegir • Comprar • Disfrutar
                    </span>
                </section>

            </div>
        </main>
    );
}

export default Nosotros;