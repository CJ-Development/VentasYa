import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
    Heart,
    Loader2,
    ShoppingCart,
    Truck,
    ShieldCheck,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Minus,
    Plus,
    Star,
    StarHalf,
} from "lucide-react";

import { getProduct } from "../../../services/adminService";

import { useCart } from "../../../hooks/useCart";

import { useAuth } from "../../../hooks/useAuth";

import ProductCard from "../ProductCard/ProductCard";

import {
    getMyFavorites,
    addFavorite,
    removeFavorite,
} from "../../../services/clientService";

import NoImage from "../../../assets/images/no-detail.png";
import { mediaUrl } from "../../../utils/mediaUrl";

import "./ProductDetail.css";


const formatearPesos = (valor) => {

    const numero = Number(valor);

    if (Number.isNaN(numero)) return "$0";

    return `$${numero.toLocaleString("es-CO")}`;

};


function ProductDetail({ productId }) {

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


    /* =====================================================
       CARGAR PRODUCTO
    ===================================================== */

    useEffect(() => {

        if (!productId) return;

        let cancelado = false;

        const cargar = async () => {

            setLoading(true);

            setError(null);

            try {

                const { data } = await getProduct(productId);

                if (!cancelado) {
                    setProducto(data);
                }

            } catch (err) {

                console.error(err);

                if (!cancelado) {
                    setError("No fue posible cargar el producto.");
                }

            } finally {

                if (!cancelado) {
                    setLoading(false);
                }

            }

        };

        cargar();

        return () => {
            cancelado = true;
        };

    }, [productId]);


    /* =====================================================
       GALERÍA
    ===================================================== */

    const galeria = useMemo(() => {

        if (!producto) return [];

        const todas = (producto.variantes || []).flatMap((v) =>
            (v.imagenes || []).map((img) => ({
                ...img,
                variante_id: v.id_variante,
            }))
        );

        return todas.sort((a, b) => {

            if (a.principal && !b.principal) return -1;

            if (!a.principal && b.principal) return 1;

            return (a.orden || 0) - (b.orden || 0);

        });

    }, [producto]);


    /* =====================================================
       COLORES
    ===================================================== */

    const colores = useMemo(() => {

        if (!producto) return [];

        const mapa = new Map();

        (producto.variantes || []).forEach((v) => {

            if (v.color && !mapa.has(v.color.id_color)) {

                mapa.set(
                    v.color.id_color,
                    v.color
                );

            }

        });

        return Array.from(mapa.values());

    }, [producto]);


    /* =====================================================
       TALLAS
    ===================================================== */

    const tallas = useMemo(() => {

        if (!producto) return [];

        const mapa = new Map();

        (producto.variantes || []).forEach((v) => {

            if (v.talla && !mapa.has(v.talla.id_talla)) {

                mapa.set(
                    v.talla.id_talla,
                    v.talla
                );

            }

        });

        return Array.from(mapa.values());

    }, [producto]);


    /* =====================================================
       RESETEAR SELECCIÓN
    ===================================================== */

    useEffect(() => {

        setImagenActiva(0);

        setColorSeleccionado(null);

        setTallaSeleccionada(null);

        setCantidad(1);

        setEsFavorito(false);

        setFavActual(null);

    }, [productId]);


    /* =====================================================
       CARGAR FAVORITOS
    ===================================================== */

    useEffect(() => {

        let cancelado = false;

        const cargar = async () => {

            if (!usuario?.id_usuario) {

                setFavoritos([]);

                return;

            }

            try {

                const { data } = await getMyFavorites(
                    usuario.id_usuario
                );

                if (cancelado) return;

                const arr = Array.isArray(data)
                    ? data
                    : [];

                setFavoritos(arr);

            } catch (err) {

                console.error(err);

            }

        };

        cargar();

        return () => {
            cancelado = true;
        };

    }, [usuario?.id_usuario]);


    /* =====================================================
       ESTADO FAVORITO
    ===================================================== */

    useEffect(() => {

        if (!producto) return;

        const f = favoritos.find((x) =>
            x.producto === producto.id_producto ||
            x.producto_detalle?.id_producto === producto.id_producto
        );

        if (f) {

            setEsFavorito(true);

            setFavActual(f);

        } else {

            setEsFavorito(false);

            setFavActual(null);

        }

    }, [favoritos, producto]);


    /* =====================================================
       IMAGEN ACTUAL
    ===================================================== */

    const imagenActual = mediaUrl(
        galeria[imagenActiva]?.imagen,
        NoImage
    );


    /* =====================================================
       RATING REAL DESDE API
    ===================================================== */

    const [rating, setRating] = useState({ promedio: 0, total: 0, distribucion: {5: 0, 4: 0, 3: 0, 2: 0, 1: 0} });
    const [ratingLoading, setRatingLoading] = useState(false);
    const [resenas, setResenas] = useState([]);
    const [resenasLoading, setResenasLoading] = useState(false);
    const [puedeResenar, setPuedeResenar] = useState({ puede: false, mensaje: "", id_compra: null });
    const [puedeResenarLoading, setPuedeResenarLoading] = useState(false);
    const [nuevaResena, setNuevaResena] = useState({ calificacion: 5, comentario: "" });
    const [enviandoResena, setEnviandoResena] = useState(false);
    const [recomendaciones, setRecomendaciones] = useState([]);
    const [recomendacionesLoading, setRecomendacionesLoading] = useState(false);

    useEffect(() => {

        if (!producto?.id_producto) return;

        const cargarRating = async () => {

            setRatingLoading(true);

            try {

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/reviews/producto/${producto.id_producto}/rating/`
                );

                if (response.ok) {

                    const data = await response.json();

                    setRating(data);

                }

            } catch (err) {

                console.error("Error cargando rating:", err);

            } finally {

                setRatingLoading(false);

            }

        };

        const cargarResenas = async () => {

            setResenasLoading(true);

            try {

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/reviews/producto/${producto.id_producto}/`
                );

                if (response.ok) {

                    const data = await response.json();

                    setResenas(data);

                }

            } catch (err) {

                console.error("Error cargando reseñas:", err);

            } finally {

                setResenasLoading(false);

            }

        };

        cargarRating();
        cargarResenas();

        const verificarPermiso = async () => {

            setPuedeResenarLoading(true);

            try {

                const params = new URLSearchParams();

                // Si hay usuario autenticado, enviar id_usuario
                // Si es invitado, no enviamos nada (el backend verificará por sesión/cookies)

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/reviews/producto/${producto.id_producto}/puede-resenar/?${params}`
                );

                if (response.ok) {

                    const data = await response.json();

                    setPuedeResenar(data);

                }

            } catch (err) {

                console.error("Error verificando permiso de reseña:", err);

            } finally {

                setPuedeResenarLoading(false);

            }

        };

        verificarPermiso();

        const cargarRecomendaciones = async () => {

            setRecomendacionesLoading(true);

            try {

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/products/${producto.id_producto}/recomendaciones/`
                );

                if (response.ok) {

                    const data = await response.json();

                    setRecomendaciones(data);

                }

            } catch (err) {

                console.error("Error cargando recomendaciones:", err);

            } finally {

                setRecomendacionesLoading(false);

            }

        };

        cargarRecomendaciones();

    }, [producto?.id_producto]);


    const handleEnviarResena = async () => {

        if (!nuevaResena.comentario.trim()) {

            alert("Por favor escribe un comentario para tu reseña.");

            return;

        }

        setEnviandoResena(true);

        try {

            const payload = {
                producto: producto.id_producto,
                calificacion: nuevaResena.calificacion,
                comentario: nuevaResena.comentario,
                compra: puedeResenar.id_compra,
            };

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/reviews/producto/${producto.id_producto}/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (response.ok) {

                // Recargar reseñas y rating
                const cargarResenas = async () => {

                    const res = await fetch(
                        `${import.meta.env.VITE_API_URL}/api/reviews/producto/${producto.id_producto}/`
                    );

                    if (res.ok) {

                        const data = await res.json();

                        setResenas(data);

                    }

                };

                const cargarRating = async () => {

                    const res = await fetch(
                        `${import.meta.env.VITE_API_URL}/api/reviews/producto/${producto.id_producto}/rating/`
                    );

                    if (res.ok) {

                        const data = await res.json();

                        setRating(data);

                    }

                };

                await cargarResenas();
                await cargarRating();

                // Resetear formulario y verificar permiso nuevamente
                setNuevaResena({ calificacion: 5, comentario: "" });
                setPuedeResenar({ puede: false, mensaje: "Ya has enviado tu reseña", id_compra: null });

                alert("¡Reseña enviada con éxito!");

            } else {

                const error = await response.json();

                alert(error.detail || "Error al enviar la reseña");

            }

        } catch (err) {

            console.error("Error enviando reseña:", err);

            alert("Error al enviar la reseña");

        } finally {

            setEnviandoResena(false);

        }

    };


    const ratingEstrellas = useMemo(() => {

        const p = rating.promedio;
        const llenas = Math.floor(p);
        const media = p - llenas >= 0.5;
        const vacias = 5 - llenas - (media ? 1 : 0);

        return { llenas, media, vacias };

    }, [rating.promedio]);


    /* =====================================================
       COLORES: nombre visible bajo el dot
    ===================================================== */

    const colorActivo = useMemo(
        () =>
            colores.find(
                (c) => c.id_color === colorSeleccionado
            ) || null,
        [colores, colorSeleccionado]
    );


    /* =====================================================
       TALLAS: stock por talla (con color actual)
    ===================================================== */

    const stockPorTalla = useMemo(() => {

        const mapa = new Map();

        tallas.forEach((t) => {

            const variante = (
                producto?.variantes || []
            ).find(
                (v) =>
                    v.talla?.id_talla === t.id_talla &&
                    (!colorSeleccionado ||
                        v.color?.id_color ===
                            colorSeleccionado)
            );

            mapa.set(
                t.id_talla,
                variante?.stock ?? 0
            );

        });

        return mapa;

    }, [tallas, producto, colorSeleccionado]);


    /* =====================================================
       VARIANTE SELECCIONADA (color + talla)
    ===================================================== */

    const varianteSeleccionada = useMemo(() => {

        if (!producto) return null;

        return (
            (producto.variantes || []).find(
                (v) =>
                    (!colorSeleccionado ||
                        v.color?.id_color ===
                            colorSeleccionado) &&
                    (!tallaSeleccionada ||
                        v.talla?.id_talla ===
                            tallaSeleccionada)
            ) ||
            (producto.variantes || []).find(
                (v) =>
                    !colorSeleccionado ||
                    v.color?.id_color === colorSeleccionado
            ) ||
            (producto.variantes || [])[0] ||
            null
        );

    }, [producto, colorSeleccionado, tallaSeleccionada]);


    /* =====================================================
       STOCK DE LA VARIANTE
    ===================================================== */

    const stockDisponible =
        varianteSeleccionada?.stock ?? 0;


    const estadoStock = useMemo(() => {

        if (stockDisponible <= 0) {
            return {
                clase: "out",
                texto: "Sin stock disponible",
            };
        }

        if (stockDisponible <= 5) {
            return {
                clase: "low",
                texto: `¡Solo ${stockDisponible} disponibles!`,
            };
        }

        return {
            clase: "ok",
            texto: "Stock disponible",
        };

    }, [stockDisponible]);


    /* =====================================================
       IMAGEN ACTIVA POR COLOR
    ===================================================== */

    useEffect(() => {

        if (!producto || !colorSeleccionado) return;

        const varianteDelColor = (
            producto.variantes || []
        ).find(
            (v) => v.color?.id_color === colorSeleccionado
        );

        if (!varianteDelColor) return;

        const idx = galeria.findIndex(
            (img) =>
                img.variante_id ===
                    varianteDelColor.id_variante
        );

        if (idx >= 0) {
            setImagenActiva(idx);
        }

    }, [colorSeleccionado, producto, galeria]);


    /* =====================================================
       RESETEAR CANTIDAD SI CAMBIA STOCK
    ===================================================== */

    useEffect(() => {

        if (cantidad > Math.max(1, stockDisponible)) {
            setCantidad(Math.max(1, stockDisponible));
        }

    }, [stockDisponible, cantidad]);


    /* =====================================================
       CAMBIAR COLOR
    ===================================================== */

    const handleSeleccionarColor = (idColor) => {

        setColorSeleccionado((prev) =>
            prev === idColor ? null : idColor
        );

    };


    /* =====================================================
       FAVORITOS
    ===================================================== */

    const handleFavorito = async () => {

        if (!usuario) {

            return;

        }


        if (esFavorito) {

            try {

                await removeFavorite(
                    favActual.id_favorito
                );

                setEsFavorito(false);

                setFavActual(null);

            } catch (err) {

                console.error(err);

            }

            return;

        }


        try {

            await addFavorite(
                usuario.id_usuario,
                producto.id_producto
            );


            const { data } = await getMyFavorites(
                usuario.id_usuario
            );


            const arr = Array.isArray(data)
                ? data
                : [];


            setFavoritos(arr);


            const f = arr.find((x) =>
                x.producto === producto.id_producto ||
                x.producto_detalle?.id_producto === producto.id_producto
            );


            if (f) {

                setEsFavorito(true);

                setFavActual(f);

            }

        } catch (err) {

            console.error(err);

        }

    };


    /* =====================================================
       AGREGAR AL CARRITO
    ===================================================== */

    const handleAgregarCarrito = async () => {

        if (!producto) return;

        const variante = varianteSeleccionada;

        if (!variante) {

            alert("No hay variantes disponibles para este producto.");

            return;

        }


        if (stockDisponible <= 0) {

            alert("Este producto no tiene stock disponible.");

            return;

        }


        const imagen =
            mediaUrl(
                (variante.imagenes || []).find(
                    (i) => i.principal
                )?.imagen,
                null
            ) ||
            mediaUrl(
                (variante.imagenes || [])[0]?.imagen,
                null
            ) ||
            null;


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
            return;
        }

        alert(
            "No se pudo agregar al carrito. Intenta de nuevo."
        );

    };


    /* =====================================================
       CAMBIAR IMAGEN
    ===================================================== */

    const imagenAnterior = () => {

        if (galeria.length === 0) return;

        setImagenActiva((prev) =>
            prev > 0
                ? prev - 1
                : galeria.length - 1
        );

    };


    const imagenSiguiente = () => {

        if (galeria.length === 0) return;

        setImagenActiva((prev) =>
            prev < galeria.length - 1
                ? prev + 1
                : 0
        );

    };


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <main className="product-detail">


            {/* =============================================
                LOADING
            ============================================= */}

            {loading && (

                <div className="product-detail-state">

                    <Loader2
                        size={34}
                        className="spin"
                    />

                    <p>
                        Cargando producto...
                    </p>

                </div>

            )}


            {/* =============================================
                ERROR
            ============================================= */}

            {!loading && error && (

                <div className="product-detail-state">

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        className="detail-back-button"
                        onClick={() => navigate(-1)}
                    >
                        Volver
                    </button>

                </div>

            )}


            {/* =============================================
                PRODUCTO
            ============================================= */}

            {!loading && !error && producto && (

                <div className="product-detail-wrapper">


                    {/* =========================================
                        BREADCRUMB
                    ========================================= */}

                    <nav className="product-breadcrumb">

                        <span
                            onClick={() => navigate("/")}
                        >
                            Inicio
                        </span>


                        <span className="breadcrumb-separator">
                            ›
                        </span>


                        <span
                            onClick={() =>
                                navigate("/productos")
                            }
                        >
                            Productos
                        </span>


                        <span className="breadcrumb-separator">
                            ›
                        </span>


                        <span>
                            {producto.categoria?.nombre ||
                                "Categoría"}
                        </span>


                        <span className="breadcrumb-separator">
                            ›
                        </span>


                        <strong>
                            {producto.nombre}
                        </strong>

                    </nav>


                    {/* =========================================
                        CONTENIDO PRINCIPAL
                    ========================================= */}

                    <section className="product-container">


                        {/* =====================================
                            GALERÍA
                        ===================================== */}

                        <section className="product-gallery">


                            {/* IMAGEN PRINCIPAL */}

                            <div className="gallery-main">

                                <img
                                    src={imagenActual}
                                    alt={producto.nombre}
                                    onError={(e) => {
                                        e.currentTarget.src = NoImage;
                                    }}
                                />

                            </div>


                            {/* MINIATURAS */}

                            <div className="gallery-thumbnail-wrapper">


                                {galeria.length > 4 && (

                                    <button
                                        type="button"
                                        className="gallery-arrow"
                                        onClick={imagenAnterior}
                                        aria-label="Imagen anterior"
                                    >

                                        <ChevronLeft size={22} />

                                    </button>

                                )}


                                <div className="gallery-thumbnails">


                                    {galeria.length === 0 ? (

                                        <button
                                            type="button"
                                            className="gallery-thumbnail active"
                                        >

                                            <img
                                                src={NoImage}
                                                alt="Sin imagen"
                                            />

                                        </button>

                                    ) : (

                                        galeria.map(
                                            (img, idx) => (

                                                <button
                                                    key={
                                                        img.id_imagen ||
                                                        idx
                                                    }
                                                    type="button"
                                                    className={
                                                        `gallery-thumbnail ${
                                                            idx === imagenActiva
                                                                ? "active"
                                                                : ""
                                                        }`
                                                    }
                                                    onClick={() =>
                                                        setImagenActiva(
                                                            idx
                                                        )
                                                    }
                                                >

                                                    <img
                                                        src={mediaUrl(
                                                            img.imagen,
                                                            NoImage
                                                        )}
                                                        alt={
                                                            `Vista ${
                                                                idx + 1
                                                            }`
                                                        }
                                                    />

                                                </button>

                                            )
                                        )

                                    )}

                                </div>


                                {galeria.length > 4 && (

                                    <button
                                        type="button"
                                        className="gallery-arrow"
                                        onClick={imagenSiguiente}
                                        aria-label="Imagen siguiente"
                                    >

                                        <ChevronRight size={22} />

                                    </button>

                                )}

                            </div>

                        </section>


                        {/* =====================================
                            INFORMACIÓN
                        ===================================== */}

                        <section className="product-info">


                            {/* NOMBRE */}

                            <h1>

                                {producto.nombre}

                            </h1>


                            {/* PRECIO */}

                            <div className="product-price">

                                {formatearPesos(
                                    producto.precio
                                )}

                            </div>


                            {/* CALIFICACIÓN */}

                            <div className="product-rating">

                                <div className="rating-stars">

                                    {Array.from({
                                        length:
                                            ratingEstrellas.llenas,
                                    }).map((_, i) => (

                                        <Star
                                            key={`f-${i}`}
                                            size={15}
                                            fill="currentColor"
                                        />

                                    ))}


                                    {ratingEstrellas.media && (

                                        <StarHalf
                                            key="half"
                                            size={15}
                                            fill="currentColor"
                                        />

                                    )}


                                    {Array.from({
                                        length:
                                            ratingEstrellas.vacias,
                                    }).map((_, i) => (

                                        <Star
                                            key={`e-${i}`}
                                            size={15}
                                            color="#d1d5db"
                                        />

                                    ))}

                                </div>


                                <span>

                                    {rating.total > 0 ? (
                                        <>
                                            <strong>
                                                {rating.promedio.toFixed(
                                                    1
                                                )}
                                            </strong>

                                            {" "}

                                            ({rating.total} reseñas)
                                        </>
                                    ) : (
                                        <span className="no-reviews">
                                            Aún no hay reseñas
                                        </span>
                                    )}

                                </span>

                            </div>


                            {/* DISTRIBUCIÓN DE ESTRELLAS */}

                            {rating.total > 0 && (

                                <div className="rating-distribution">

                                    {[5, 4, 3, 2, 1].map((estrellas) => {

                                        const cantidad = rating.distribucion[estrellas] || 0;
                                        const porcentaje = rating.total > 0 
                                            ? (cantidad / rating.total) * 100 
                                            : 0;

                                        return (
                                            <div key={estrellas} className="rating-bar-row">

                                                <span className="rating-bar-label">
                                                    {estrellas} ★
                                                </span>

                                                <div className="rating-bar-track">

                                                    <div
                                                        className="rating-bar-fill"
                                                        style={{ width: `${porcentaje}%` }}
                                                    />

                                                </div>

                                                <span className="rating-bar-count">
                                                    {cantidad}
                                                </span>

                                                <span className="rating-bar-percent">
                                                    {porcentaje.toFixed(0)}%
                                                </span>

                                            </div>
                                        );

                                    })}

                                </div>

                            )}


                            {/* STOCK */}

                            <div
                                className={`product-stock ${estadoStock.clase}`}
                            >

                                <span className="stock-dot" />

                                <span>
                                    {estadoStock.texto}
                                </span>

                            </div>


                            {/* =================================
                                PANEL: COLOR → FAVORITO
                            ================================= */}

                            <div className="product-info-panel">


                                {/* =================================
                                    COLOR + TALLA (lado a lado)
                                ================================= */}

                                {(colores.length > 0 || tallas.length > 0) && (

                                    <div className="product-options-row">

                                        {colores.length > 0 && (

                                            <div className="product-option-group">

                                                <h4>
                                                    Color:
                                                    <span>
                                                        {colorActivo?.nombre ||
                                                            "Selecciona"}
                                                    </span>
                                                </h4>


                                                <div className="colors">

                                                    {colores.map((c) => (

                                                        <div
                                                            key={c.id_color}
                                                            className="color-item"
                                                        >

                                                            <button
                                                                type="button"
                                                                className={
                                                                    `color-swatch ${
                                                                        colorSeleccionado ===
                                                                        c.id_color
                                                                            ? "color-swatch--active"
                                                                            : ""
                                                                    }`
                                                                }
                                                                title={c.nombre}
                                                                aria-label={`Color ${c.nombre}`}
                                                                onClick={() =>
                                                                    handleSeleccionarColor(
                                                                        c.id_color
                                                                    )
                                                                }
                                                            >

                                                                <span
                                                                    className="color-swatch__dot"
                                                                    style={{
                                                                        background:
                                                                            c.codigo_hex,
                                                                    }}
                                                                >

                                                                    <span className="color-sr">
                                                                        {c.nombre}
                                                                    </span>

                                                                </span>

                                                            </button>

                                                            <span className="color-swatch__name">
                                                                {c.nombre}
                                                            </span>

                                                        </div>

                                                    ))}

                                                </div>

                                            </div>

                                        )}


                                        {tallas.length > 0 && (

                                            <div className="product-option-group">

                                                <h4>
                                                    Talla:
                                                    <span>
                                                        {tallas.find(
                                                            (t) =>
                                                                t.id_talla ===
                                                                tallaSeleccionada
                                                        )?.nombre ||
                                                            "Selecciona"}
                                                    </span>
                                                </h4>


                                                <div className="sizes">

                                                    {tallas.map((t) => {

                                                        const stock =
                                                            stockPorTalla.get(
                                                                t.id_talla
                                                            ) ?? 0;

                                                        const sinStock =
                                                            stock <= 0;

                                                        return (

                                                            <button
                                                                key={t.id_talla}
                                                                type="button"
                                                                disabled={
                                                                    sinStock
                                                                }
                                                                className={
                                                                    `size-btn ${
                                                                        tallaSeleccionada ===
                                                                        t.id_talla
                                                                            ? "active"
                                                                            : ""
                                                                    } ${
                                                                        sinStock
                                                                            ? "size-btn--out"
                                                                            : ""
                                                                    }`
                                                                }
                                                                onClick={() =>
                                                                    setTallaSeleccionada(
                                                                        t.id_talla
                                                                    )
                                                                }
                                                            >

                                                                <span className="size-name">
                                                                    {t.nombre}
                                                                </span>

                                                            </button>

                                                        );

                                                    })}

                                                </div>

                                            </div>

                                        )}

                                    </div>

                                )}


                                {/* =================================
                                    DESCRIPCIÓN
                                ================================= */}

                                {producto.descripcion && (

                                    <div className="product-description">

                                        <h4>
                                            Descripción
                                        </h4>

                                        <p>
                                            {producto.descripcion}
                                        </p>

                                    </div>

                                )}


                                {/* =================================
                                    BENEFICIOS
                                ================================= */}

                                <div className="product-benefits">


                                    <div className="benefit-card">

                                        <div className="benefit-icon">

                                            <Truck size={21} />

                                        </div>


                                        <div>

                                            <strong>
                                                Envío gratis
                                            </strong>

                                            <span>
                                                En compras desde $99.900
                                            </span>

                                        </div>

                                    </div>


                                    <div className="benefit-card">

                                        <div className="benefit-icon">

                                            <RotateCcw size={20} />

                                        </div>


                                        <div>

                                            <strong>
                                                Devoluciones
                                            </strong>

                                            <span>
                                                Hasta 30 días
                                            </span>

                                        </div>

                                    </div>


                                    <div className="benefit-card">

                                        <div className="benefit-icon">

                                            <ShieldCheck size={21} />

                                        </div>


                                        <div>

                                            <strong>
                                                Pago seguro
                                            </strong>

                                            <span>
                                                Compra protegida
                                            </span>

                                        </div>

                                    </div>

                                </div>


                                {/* =================================
                                    RESEÑAS
                                ================================= */}

                                <div className="product-reviews-section">

                                    <h3>
                                        Opiniones de nuestros clientes
                                    </h3>


                                    {/* FORMULARIO DE RESEÑA (solo si puede reseñar) */}

                                    {!puedeResenarLoading && puedeResenar.puede && (

                                        <div className="review-form-container">

                                            <h4>
                                                Deja tu opinión
                                            </h4>

                                            <p className="review-form-message">
                                                {puedeResenar.mensaje}
                                            </p>


                                            <div className="rating-selector">

                                                <span>Calificación:</span>

                                                {[1, 2, 3, 4, 5].map((estrellas) => (

                                                    <button
                                                        key={estrellas}
                                                        type="button"
                                                        className={`rating-star-btn ${nuevaResena.calificacion === estrellas ? 'active' : ''}`}
                                                        onClick={() => setNuevaResena({ ...nuevaResena, calificacion: estrellas })}
                                                    >

                                                        <Star
                                                            size={20}
                                                            fill={nuevaResena.calificacion >= estrellas ? "currentColor" : "none"}
                                                        />

                                                    </button>

                                                ))}

                                            </div>


                                            <textarea
                                                className="review-textarea"
                                                placeholder="Escribe tu opinión sobre este producto..."
                                                value={nuevaResena.comentario}
                                                onChange={(e) => setNuevaResena({ ...nuevaResena, comentario: e.target.value })}
                                                rows={4}
                                            />


                                            <button
                                                className="review-submit-btn"
                                                onClick={handleEnviarResena}
                                                disabled={enviandoResena}
                                            >

                                                {enviandoResena ? "Enviando..." : "Enviar reseña"}

                                            </button>

                                        </div>

                                    )}


                                    {resenas.length > 0 ? (

                                        <div className="reviews-list">

                                            {resenas.map((resena) => (

                                                <div key={resena.id_resena} className="review-card">

                                                    <div className="review-header">

                                                        <div className="review-author">

                                                            <strong>
                                                                {resena.nombre_cliente_display}
                                                            </strong>

                                                            {resena.compra_verificada && (
                                                                <span className="verified-badge">
                                                                    ✓ Compra verificada
                                                                </span>
                                                            )}

                                                        </div>

                                                        <span className="review-date">
                                                            {resena.fecha_formateada}
                                                        </span>

                                                    </div>


                                                    <div className="review-stars">

                                                        {Array.from({ length: resena.calificacion }).map((_, i) => (

                                                            <Star
                                                                key={i}
                                                                size={14}
                                                                fill="currentColor"
                                                            />

                                                        ))}

                                                        {Array.from({ length: 5 - resena.calificacion }).map((_, i) => (

                                                            <Star
                                                                key={`e-${i}`}
                                                                size={14}
                                                                color="#d1d5db"
                                                            />

                                                        ))}

                                                    </div>


                                                    <p className="review-comment">
                                                        {resena.comentario}
                                                    </p>

                                                </div>

                                            ))}

                                        </div>

                                    ) : (

                                        <p className="no-reviews-message">
                                            Este producto aún no tiene reseñas. ¡Sé el primero en opinar!
                                        </p>

                                    )}

                                </div>


                                {/* =================================
                                    RECOMENDACIONES
                                ================================= */}

                                {recomendaciones.length > 0 && (

                                    <div className="product-recommendations-section">

                                        <h3>
                                            Te podría interesar
                                        </h3>


                                        <div className="recommendations-grid">

                                            {recomendaciones.map((prod) => (

                                                <ProductCard
                                                    key={prod.id_producto}
                                                    product={prod}
                                                />

                                            ))}

                                        </div>

                                    </div>

                                )}


                                {/* =================================
                                    ACCIONES DE COMPRA
                                ================================= */}

                                <div className="purchase-actions">


                                    {/* CANTIDAD */}

                                    <div className="quantity">

                                        <button
                                            type="button"
                                            aria-label="Disminuir cantidad"
                                            disabled={cantidad <= 1}
                                            onClick={() =>
                                                setCantidad((c) =>
                                                    Math.max(1, c - 1)
                                                )
                                            }
                                        >

                                            <Minus size={16} />

                                        </button>


                                        <span>
                                            {cantidad}
                                        </span>


                                        <button
                                            type="button"
                                            aria-label="Aumentar cantidad"
                                            disabled={
                                                cantidad >=
                                                Math.max(1, stockDisponible)
                                            }
                                            onClick={() =>
                                                setCantidad(
                                                    (c) => c + 1
                                                )
                                            }
                                        >

                                            <Plus size={16} />

                                        </button>

                                    </div>


                                    {/* AGREGAR CARRITO */}

                                    <button
                                        className="buy-button"
                                        type="button"
                                        disabled={
                                            stockDisponible <= 0
                                        }
                                        onClick={handleAgregarCarrito}
                                    >

                                        <ShoppingCart size={18} />

                                        <span>
                                            {stockDisponible <= 0
                                                ? "Sin stock"
                                                : "Agregar al carrito"}
                                        </span>

                                    </button>


                                    {/* FAVORITO */}

                                    <button
                                        className={
                                            `favorite ${
                                                esFavorito
                                                    ? "favorite-active"
                                                    : ""
                                            }`
                                        }
                                        type="button"
                                        title={
                                            usuario
                                                ? "Agregar o quitar de favoritos"
                                                : "Inicia sesión para guardar favoritos"
                                        }
                                        onClick={handleFavorito}
                                    >

                                        <Heart
                                            size={22}
                                            fill={
                                                esFavorito
                                                    ? "currentColor"
                                                    : "none"
                                            }
                                        />

                                    </button>

                                </div>

                            </div>

                        </section>

                    </section>

                </div>

            )}

        </main>

    );

}


export default ProductDetail;