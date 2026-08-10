import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
    Heart,
    Loader2,
    ShoppingCart,
    Truck,
    ShieldCheck,
    RotateCcw,
    X,
} from "lucide-react";

import { getProduct } from "../../../services/adminService";

import { useCart } from "../../../hooks/useCart";

import { useAuth } from "../../../hooks/useAuth";

import {
    getMyFavorites,
    addFavorite,
    removeFavorite,
} from "../../../services/clientService";

import NoImage from "../../../assets/images/no-detail.png";

import "./ProductDetail.css";

const formatearPesos = (valor) => {

    const numero = Number(valor);

    if (Number.isNaN(numero)) return "$0";

    return `$${numero.toLocaleString("es-CO")}`;

};

function ProductDetail({ productId, onClose }) {

    const { addItem } = useCart();

    const { usuario } = useAuth();

    const navigate = useNavigate();

    const [producto, setProducto] = useState(null);

    const [esFavorito, setEsFavorito] = useState(false);

    const [favActual, setFavActual] = useState(null);

    const [favoritos, setFavoritos] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [imagenActiva, setImagenActiva] = useState(0);

    const [colorSeleccionado, setColorSeleccionado] = useState(null);

    const [tallaSeleccionada, setTallaSeleccionada] = useState(null);

    const [cantidad, setCantidad] = useState(1);

    useEffect(() => {

        if (!productId) return;

        let cancelado = false;

        const cargar = async () => {

            setLoading(true);

            setError(null);

            try {

                const { data } = await getProduct(productId);

                if (!cancelado) setProducto(data);

            }

            catch (err) {

                console.error(err);

                if (!cancelado) {

                    setError("No fue posible cargar el producto.");

                }

            }

            finally {

                if (!cancelado) setLoading(false);

            }

        };

        cargar();

        return () => { cancelado = true; };

    }, [productId]);

    // ====== Datos derivados ======

    const galeria = useMemo(() => {

        if (!producto) return [];

        const todas = (producto.variantes || []).flatMap((v) =>

            (v.imagenes || []).map((img) => ({ ...img, variante_id: v.id_variante }))
        );

        return todas.sort((a, b) => {

            if (a.principal && !b.principal) return -1;

            if (!a.principal && b.principal) return 1;

            return (a.orden || 0) - (b.orden || 0);

        });

    }, [producto]);

    const colores = useMemo(() => {

        if (!producto) return [];

        const mapa = new Map();

        (producto.variantes || []).forEach((v) => {

            if (v.color && !mapa.has(v.color.id_color)) {

                mapa.set(v.color.id_color, v.color);

            }

        });

        return Array.from(mapa.values());

    }, [producto]);

    const tallas = useMemo(() => {

        if (!producto) return [];

        const mapa = new Map();

        (producto.variantes || []).forEach((v) => {

            if (v.talla && !mapa.has(v.talla.id_talla)) {

                mapa.set(v.talla.id_talla, v.talla);

            }

        });

        return Array.from(mapa.values());

    }, [producto]);

    // Resetear selección al cambiar producto

    useEffect(() => {

        setImagenActiva(0);

        setColorSeleccionado(null);

        setTallaSeleccionada(null);

        setCantidad(1);

        setEsFavorito(false);

        setFavActual(null);

    }, [productId]);

    // Cargar favoritos cuando hay usuario logueado
    useEffect(() => {

        let cancelado = false;

        const cargar = async () => {

            if (!usuario?.id_usuario) {

                setFavoritos([]);

                return;

            }

            try {

                const { data } = await getMyFavorites(usuario.id_usuario);

                if (cancelado) return;

                const arr = Array.isArray(data) ? data : [];

                setFavoritos(arr);

            } catch (err) {

                console.error(err);

            }

        };

        cargar();

        return () => { cancelado = true; };

    }, [usuario?.id_usuario]);

    // Actualizar estado de favorito cuando cargan los favoritos y el producto
    useEffect(() => {

        if (!producto) return;

        const f = favoritos.find((x) =>
            (x.producto === producto.id_producto) ||
            (x.producto_detalle?.id_producto === producto.id_producto)
        );

        if (f) {

            setEsFavorito(true);

            setFavActual(f);

        } else {

            setEsFavorito(false);

            setFavActual(null);

        }

    }, [favoritos, producto]);

    // ====== Render ======

    const imagenActual = galeria[imagenActiva]?.imagen || NoImage;

    const handleAgregarCarrito = async () => {

        if (!producto) return;

        // Resolver la variante seleccionada segun color + talla
        const variante = (producto.variantes || []).find((v) =>
            (!colorSeleccionado || v.color?.id_color === colorSeleccionado) &&
            (!tallaSeleccionada || v.talla?.id_talla === tallaSeleccionada)
        ) || (producto.variantes || [])[0];

        if (!variante) {

            alert("No hay variantes disponibles para este producto.");

            return;

        }

        // Buscar imagen representativa
        const imagen = (variante.imagenes || []).find((i) => i.principal)?.imagen
            || (variante.imagenes || [])[0]?.imagen
            || null;

        const payload = {
            variante_id: variante.id_variante,
            sku: variante.sku,
            stock: variante.stock,
            producto_id: producto.id_producto,
            producto_nombre: producto.nombre,
            producto_slug: producto.slug,
            producto_precio: producto.precio,
            color: variante.color?.nombre || "",
            talla: variante.talla?.nombre || "",
            imagen,
            cantidad,
        };

        const result = await addItem(payload);

        if (result?.ok) {
            // El provider abre el drawer automaticamente
            return;
        }

        alert("No se pudo agregar al carrito. Intenta de nuevo.");

    };

    return (

        <div

            className="product-detail product-detail--modal"

            onClick={onClose}

        >

            {loading && (

                <div className="product-detail-loading" onClick={(e) => e.stopPropagation()}>

                    <Loader2 size={32} className="spin" />

                    <p>Cargando producto...</p>

                </div>

            )}

            {!loading && error && (

                <div className="product-detail-loading" onClick={(e) => e.stopPropagation()}>

                    <p>{error}</p>

                    <button className="buy-button" onClick={onClose}>Cerrar</button>

                </div>

            )}

            {!loading && !error && producto && (

                <section

                    className="product-container"

                    onClick={(e) => e.stopPropagation()}

                >

                    <button

                        type="button"

                        className="product-detail-close"

                        onClick={onClose}

                        title="Cerrar"

                    >

                        <X size={20} />

                    </button>

                    <section className="product-gallery">

                        <aside className="gallery-thumbnails">

                            {galeria.length === 0 ? (

                                <img src={NoImage} alt="Sin imagen" />

                            ) : (

                                galeria.map((img, idx) => (

                                    <img

                                        key={img.id_imagen || idx}

                                        src={img.imagen}

                                        alt={`Vista ${idx + 1}`}

                                        className={idx === imagenActiva ? "active" : ""}

                                        onClick={() => setImagenActiva(idx)}

                                    />

                                ))

                            )}

                        </aside>

                        <div className="gallery-main">

                            <img

                                src={imagenActual}

                                alt={producto.nombre}

                                onError={(e) => { e.currentTarget.src = NoImage; }}

                            />

                        </div>

                    </section>

                    <section className="product-info">

                        <span className="product-category">

                            {producto.categoria?.nombre || "Producto"}

                        </span>

                        <h1>{producto.nombre}</h1>

                        <p className="product-reference">

                            Referencia #{producto.id_producto}

                        </p>

                        <div className="product-price">

                            {formatearPesos(producto.precio)}

                        </div>

                        {producto.descripcion && (

                            <div className="product-description">

                                {producto.descripcion}

                            </div>

                        )}

                        {colores.length > 0 && (

                            <>

                                <h4 className="option-title">COLOR DISPONIBLE</h4>

                                <div className="colors">

                                    {colores.map((c) => (

                                        <button

                                            key={c.id_color}

                                            type="button"

                                            className={
                                                "color-option"
                                                + (colorSeleccionado === c.id_color ? " color-option--active" : "")
                                            }

                                            style={{ background: c.codigo_hex }}

                                            title={c.nombre}

                                            onClick={() => setColorSeleccionado(c.id_color)}

                                        />

                                    ))}

                                </div>

                            </>

                        )}

                        {tallas.length > 0 && (

                            <>

                                <h4 className="option-title">TALLA</h4>

                                <div className="sizes">

                                    {tallas.map((t) => (

                                        <button

                                            key={t.id_talla}

                                            type="button"

                                            className={
                                                tallaSeleccionada === t.id_talla ? "active" : ""
                                            }

                                            onClick={() => setTallaSeleccionada(t.id_talla)}

                                        >

                                            {t.nombre}

                                        </button>

                                    ))}

                                </div>

                            </>

                        )}

                        <h4 className="option-title">CANTIDAD</h4>

                        <div className="quantity">

                            <button

                                type="button"

                                onClick={() => setCantidad((c) => Math.max(1, c - 1))}

                            >-</button>

                            <span>{cantidad}</span>

                            <button

                                type="button"

                                onClick={() => setCantidad((c) => c + 1)}

                            >+</button>

                        </div>

                        <div className="services">

                            <span><Truck size={16} /> Envíos</span>

                            <span><RotateCcw size={16} /> 30 días</span>

                            <span><ShieldCheck size={16} /> Compra segura</span>

                        </div>

                        <div className="buttons">

                            <button

                                className="buy-button"

                                type="button"

                                onClick={handleAgregarCarrito}

                            >

                                <ShoppingCart size={18} />

                                Agregar al carrito

                            </button>

                            <button
                                className="favorite"
                                type="button"
                                title={usuario ? "Quitar de favoritos" : "Inicia sesión para guardar favoritos"}
                                onClick={async () => {

                                    if (!usuario) {

                                        navigate("/login?from=/");

                                        return;

                                    }

                                    if (esFavorito) {

                                        await removeFavorite(favActual.id_favorito);

                                        setEsFavorito(false);

                                        setFavActual(null);

                                    } else {

                                        try {

                                            await addFavorite(usuario.id_usuario, producto.id_producto);

                                            // Recargar favoritos para tener el id real

                                            const { data } = await getMyFavorites(usuario.id_usuario);

                                            const arr = Array.isArray(data) ? data : [];

                                            setFavoritos(arr);

                                            const f = arr.find((x) =>
                                                (x.producto === producto.id_producto) ||
                                                (x.producto_detalle?.id_producto === producto.id_producto)
                                            );

                                            if (f) {

                                                setEsFavorito(true);

                                                setFavActual(f);

                                            }

                                        } catch (err) {

                                            console.error(err);

                                        }

                                    }

                                }}
                            >

                                <Heart
                                    size={20}
                                    fill={esFavorito ? "currentColor" : "none"}
                                    color={esFavorito ? "#dc2626" : "currentColor"}
                                />

                            </button>

                        </div>

                    </section>

                </section>

            )}

        </div>

    );

}

export default ProductDetail;