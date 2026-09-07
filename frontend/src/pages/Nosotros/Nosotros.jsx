import "./Nosotros.css";


function Nosotros() {

    return (

        <main className="nosotros-page">

            <div className="nosotros-container">

                {/* =================================================
                    HERO SECTION
                ================================================= */}

                <section className="nosotros-hero">

                    <h1>
                        Nosotros
                    </h1>

                    <p>
                        Conoce a Baúl Mágico Shop
                    </p>

                </section>


                {/* =================================================
                    QUIÉNES SOMOS
                ================================================= */}

                <section className="nosotros-section">

                    <h2>
                        ¿Quiénes somos?
                    </h2>

                    <div className="nosotros-content">

                        <p>
                            Baúl Mágico es una tienda virtual colombiana creada para ofrecer una experiencia de compra fácil, segura y cercana, poniendo a disposición de nuestros clientes una variedad de productos para diferentes gustos, necesidades y momentos.
                        </p>

                        <p>
                            Creemos que comprar en línea debe ser mucho más que elegir un producto: debe ser una experiencia práctica, confiable y agradable. Por eso trabajamos para seleccionar productos de calidad, ofrecer una atención personalizada y facilitar cada etapa del proceso, desde la elección hasta la entrega.
                        </p>

                        <p>
                            Realizamos envíos a nivel nacional, buscando llegar cada día a más hogares de Colombia y brindar a nuestros clientes la confianza de comprar desde cualquier lugar.
                        </p>

                        <p>
                            En Baúl Mágico, cada producto puede convertirse en una pequeña sorpresa, una solución, un detalle especial o simplemente en algo que hace más agradable tu día.
                        </p>

                        <p className="nosotros-highlight">
                            Baúl Mágico: descubre un mundo de opciones, directo a tu hogar, elige y disfruta.
                        </p>

                    </div>

                </section>


                {/* =================================================
                    MISIÓN
                ================================================= */}

                <section className="nosotros-section nosotros-mission">

                    <h2>
                        Misión
                    </h2>

                    <div className="nosotros-content">

                        <p>
                            En Baúl Mágico tenemos como misión ofrecer a nuestros clientes una experiencia de compra virtual fácil, segura, confiable y cercana, poniendo a su alcance productos seleccionados que respondan a diferentes necesidades, gustos y estilos de vida.
                        </p>

                        <p>
                            Nos comprometemos a brindar atención amable y personalizada, procesos de compra sencillos, información clara y entregas eficientes a nivel nacional, construyendo relaciones basadas en la confianza y la satisfacción de nuestros clientes.
                        </p>

                        <p>
                            Queremos que cada compra en Baúl Mágico sea una experiencia positiva, desde el primer contacto hasta recibir el producto en la puerta de su hogar.
                        </p>

                    </div>

                </section>

            </div>

        </main>

    );

}


export default Nosotros;
