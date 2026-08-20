import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import {
    Heart,
    Loader2,
    PackageSearch,
    ShoppingBag,
    Trash2,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";

import {
    getMyFavorites,
    removeFavorite,
    addFavorite,
} from "../../services/clientService";

import ProductDetail from "../Products/ProductDetail/ProductDetail";
import Breadcrumb from "../../components/Breadcrumb/Breadcrumb";

import NoImage from "../../assets/images/no-image.png";
import { mediaUrl } from "../../utils/mediaUrl";

import "./Favorites.css";

const formatearPesos = (valor) => {

    const numero = Number(valor);

    if (Number.isNaN(numero)) return "$0";

    return `$${numero.toLocaleString("es-CO")}`;

};

function Favorites() {

    const { usuario } = useAuth();
    const navigate = useNavigate();

    const [favoritos, setFavoritos] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [selectedProductId, setSelectedProductId] = useState(null);

    const [eliminandoId, setEliminandoId] = useState(null);

    const cargarFavoritos = async () => {

        if (!usuario?.id_usuario) {

            setLoading(false);

            return;

        }

        try {

            setLoading(true);

            const { data } = await getMyFavorites(usuario.id_usuario);

            setFavoritos(Array.isArray(data) ? data : []);

            setError(null);

        }
        catch (err) {

            console.error(err);

            setError("No fue posible cargar tus favoritos.");

        }
        finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        cargarFavoritos();

    }, [usuario?.id_usuario]);

    const quitarFavorito = async (fav) => {

        try {

            setEliminandoId(fav.id_favorito);

            await removeFavorite(fav.id_favorito);

            setFavoritos((prev) =>
                prev.filter((f) => f.id_favorito !== fav.id_favorito)
            );

        } catch (err) {

            console.error(err);

            alert("No se pudo quitar el favorito.");

        } finally {

            setEliminandoId(null);

        }

    };

    const toggleFavorito = async (productoId) => {

        if (!usuario) {

            return;

        }

        const existente = favoritos.find(
            (f) => f.producto === productoId || f.producto_detalle?.id_producto === productoId
        );

        if (existente) {

            await quitarFavorito(existente);

        } else {

            try {

                await addFavorite(usuario.id_usuario, productoId);

                await cargarFavoritos();

            } catch (err) {

                console.error(err);

            }

        }

    };

    const imagenProducto = (fav) => {

        const p = fav.producto_detalle;

        if (!p) return NoImage;

        const principal = (p.variantes || [])

            .flatMap((v) => v.imagenes || [])

            .find((img) => img.principal);

        if (principal) return mediaUrl(principal.imagen, NoImage);

        const primera = (p.variantes || [])

            .flatMap((v) => v.imagenes || [])

            .sort((a, b) => (a.orden || 0) - (b.orden || 0))[0];

        return mediaUrl(primera?.imagen, NoImage);

    };

    const visibles = useMemo(() => favoritos, [favoritos]);

    if (!usuario) {

        return (

            <main className="favorites-page">

                <div className="favorites-container">

                    <header className="favorites-header">

                        <h1>
                            <Heart size={26} />
                            Mis favoritos
                        </h1>

                        <p>
                            Aquí verás los productos que guardes para comprar más tarde.
                        </p>

                    </header>

                    <div className="favorites-empty">

                        <Heart size={64} />

                        <h2>Guarda tus productos favoritos</h2>

                        <p>
                            Para empezar a guardar productos necesitas iniciar sesión.
                        </p>

                        <Link to="/login" className="favorites-cta">

                            Iniciar sesión

                        </Link>

                        <Link to="/register" className="favorites-secondary">

                            Crear cuenta nueva

                        </Link>

                    </div>

                </div>

            </main>

        );

    }

    return (

        <main className="favorites-page">

            <div className="favorites-container">

                <Breadcrumb
                    items={[
                        { label: "Mis favoritos" }
                    ]}
                />

                <header className="favorites-header">

                    <h1>
                        <Heart size={26} />
                        Mis favoritos
                    </h1>

                    <p>
                        {visibles.length > 0
                            ? `${visibles.length} producto${visibles.length === 1 ? "" : "s"} guardado${visibles.length === 1 ? "" : "s"}.`
                            : "Aquí verás los productos que guardes para comprar más tarde."}
                    </p>

                </header>

                {loading ? (

                    <div className="favorites-loading">

                        <Loader2 size={32} className="favorites-spin" />

                        <p>Cargando tus favoritos...</p>

                    </div>

                ) : error ? (

                    <div className="favorites-error">

                        <p>{error}</p>

                        <button onClick={cargarFavoritos} className="favorites-cta">

                            Reintentar

                        </button>

                    </div>

                ) : visibles.length === 0 ? (

                    <div className="favorites-empty">

                        <PackageSearch size={64} />

                        <h2>Aún no tienes favoritos</h2>

                        <p>
                            Explora el catálogo y toca el corazón en cualquier
                            producto para guardarlo aquí.
                        </p>

                        <Link to="/" className="favorites-cta">

                            Explorar productos

                        </Link>

                    </div>

                ) : (

                    <div className="favorites-grid">

                        {visibles.map((fav) => {

                            const producto = fav.producto_detalle;

                            if (!producto) return null;

                            return (

                                <article
                                    key={fav.id_favorito}
                                    className="favorite-card"
                                    onClick={() => {
                                        if (producto?.slug) {
                                            navigate(`/producto/${producto.slug}`);
                                        }
                                    }}
                                >

                                    <div className="favorite-card-image">

                                        <img
                                            src={imagenProducto(fav)}
                                            alt={producto.nombre}
                                            onError={(e) => { e.currentTarget.src = NoImage; }}
                                        />

                                        <span className="favorite-card-category">

                                            {producto.categoria?.nombre || "Producto"}

                                        </span>

                                    </div>

                                    <div className="favorite-card-content">

                                        <h3>{producto.nombre}</h3>

                                        <p className="favorite-card-sku">

                                            Ref. #{producto.id_producto}

                                        </p>

                                        <div className="favorite-card-price">

                                            {formatearPesos(producto.precio)}

                                        </div>

                                        <div className="favorite-card-actions">

                                            <button
                                                type="button"
                                                className="favorite-card-buy"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (producto?.slug) {
                                                        navigate(`/producto/${producto.slug}`);
                                                    }
                                                }}
                                            >
                                                <ShoppingBag size={14} />
                                                Ver producto
                                            </button>

                                            <button
                                                type="button"
                                                className="favorite-card-remove"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    quitarFavorito(fav);
                                                }}
                                                disabled={eliminandoId === fav.id_favorito}
                                                title="Quitar de favoritos"
                                            >
                                                <Trash2 size={14} />
                                                Quitar
                                            </button>

                                        </div>

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

export default Favorites;
