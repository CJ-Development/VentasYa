import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { Loader2, Tag } from "lucide-react";

import { getOffers } from "../../services/clientService";

import ProductDetail from "../Products/ProductDetail/ProductDetail";

import NoImage from "../../assets/images/no-image.png";

import "./Offers.css";

const formatearPesos = (valor) => {
    const numero = Number(valor);
    if (Number.isNaN(numero)) return "$0";
    return `$${numero.toLocaleString("es-CO")}`;
};

const formatearFecha = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};

function Offers() {

    const [ofertas, setOfertas] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [selectedProductId, setSelectedProductId] = useState(null);

    const cargarOfertas = async () => {

        try {
            setLoading(true);
            const { data } = await getOffers();
            const hoy = new Date().toISOString().split("T")[0];
            const activas = (data || []).filter((o) => {
                if (o.activa === false) return false;
                const inicio = o.fecha_inicio;
                const fin = o.fecha_fin;
                if (inicio && hoy < inicio) return false;
                if (fin && hoy > fin) return false;
                return true;
            });
            setOfertas(activas);
            setError(null);
        }
        catch (err) {
            console.error(err);
            setError("No fue posible cargar las ofertas.");
        }
        finally {
            setLoading(false);
        }

    };

    useEffect(() => {
        cargarOfertas();
    }, []);

    const calcularPrecio = (oferta) => {

        const producto = oferta.producto_detalle;

        if (!producto) return { original: null, nuevo: null };

        const original = Number(producto.precio);

        let nuevo = original;

        if (oferta.tipo_descuento === "porcentaje") {

            nuevo = original - (original * Number(oferta.valor)) / 100;

        }
        else {

            nuevo = original - Number(oferta.valor);

        }

        nuevo = Math.max(0, nuevo);

        return { original, nuevo };

    };

    const etiquetaDescuento = (oferta) => {

        if (oferta.tipo_descuento === "porcentaje") {

            return `-${Number(oferta.valor)}%`;

        }

        return `-${formatearPesos(oferta.valor)}`;

    };

    const imagenProducto = (oferta) => {

        const p = oferta.producto_detalle;

        if (!p) return NoImage;

        const principal = (p.variantes || [])

            .flatMap((v) => v.imagenes || [])

            .find((img) => img.principal);

        if (principal) return principal.imagen;

        const cualquiera = (p.variantes || [])

            .flatMap((v) => v.imagenes || [])

            .sort((a, b) => (a.orden || 0) - (b.orden || 0))[0];

        return cualquiera?.imagen || NoImage;

    };

    const ofertasVisibles = useMemo(() => ofertas, [ofertas]);

    return (
        <main className="offers-page">
            <div className="offers-container">

                <div className="offers-header">
                    <h1>Ofertas</h1>
                    <p>
                        Aprovecha los descuentos activos por tiempo limitado.
                    </p>
                </div>

                {loading ? (
                    <div className="offers-loading">
                        <Loader2 size={32} className="offers-spin" />
                        <p>Cargando ofertas...</p>
                    </div>
                ) : error ? (
                    <div className="offers-error">
                        <p>{error}</p>
                        <button onClick={cargarOfertas} className="offer-card-button">
                            Reintentar
                        </button>
                    </div>
                ) : ofertasVisibles.length === 0 ? (
                    <div className="offers-empty">
                        <Tag size={64} />
                        <h2>No hay ofertas activas</h2>
                        <p>Vuelve pronto para encontrar nuevos descuentos.</p>
                        <Link to="/" className="offer-card-button">
                            Ir al inicio
                        </Link>
                    </div>
                ) : (
                    <div className="offers-grid">
                        {ofertasVisibles.map((oferta) => {

                            const { original, nuevo } = calcularPrecio(oferta);

                            const producto = oferta.producto_detalle;

                            return (
                                <article
                                    key={oferta.id_oferta}
                                    className="offer-card"
                                    onClick={() => producto && setSelectedProductId(producto.id_producto)}
                                >

                                    <div className="offer-card-image">
                                        <img
                                            src={imagenProducto(oferta)}
                                            alt={producto?.nombre || oferta.nombre}
                                            onError={(e) => { e.currentTarget.src = NoImage; }}
                                        />
                                        <span className="offer-discount-badge">
                                            {etiquetaDescuento(oferta)}
                                        </span>
                                    </div>

                                    <div className="offer-card-content">
                                        <span className="offer-card-category">
                                            {producto?.categoria?.nombre || "Oferta"}
                                        </span>
                                        <h3>{producto?.nombre || oferta.nombre}</h3>
                                        <p className="offer-card-offer-name">
                                            {oferta.nombre}
                                            {oferta.fecha_fin ? ` · Hasta ${formatearFecha(oferta.fecha_fin)}` : ""}
                                        </p>

                                        {original !== null && nuevo !== null && (
                                            <div className="offer-card-prices">
                                                {original !== nuevo && (
                                                    <span className="offer-card-old-price">
                                                        {formatearPesos(original)}
                                                    </span>
                                                )}
                                                <span className="offer-card-new-price">
                                                    {formatearPesos(nuevo)}
                                                </span>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            className="offer-card-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (producto) setSelectedProductId(producto.id_producto);
                                            }}
                                        >
                                            Ver producto
                                        </button>
                                    </div>
                                </article>
                            );

                        })}
                    </div>
                )}

                {selectedProductId !== null && (
                    <ProductDetail
                        productId={selectedProductId}
                        onClose={() => setSelectedProductId(null)}
                    />
                )}

            </div>
        </main>
    );

}

export default Offers;
