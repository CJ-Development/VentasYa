import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
    SlidersHorizontal,
    X,
    ChevronDown,
    ChevronRight,
} from "lucide-react";

import ProductCard from "./ProductCard/ProductCard";
import ProductDetail from "./ProductDetail/ProductDetail";

import { getCategories, getProducts } from "../../services/adminService";
import { getOffers } from "../../services/clientService";
import { slugify } from "../../utils/slugify";

import "./Products.css";


const prettifySlug = (s) => {
    if (!s) return "";

    return s
        .split("-")
        .map((w) =>
            w
                ? w[0].toUpperCase() + w.slice(1)
                : w
        )
        .join(" ");
};


function Products() {

    const params = useParams();

    const [searchParams, setSearchParams] =
        useSearchParams();

    const query =
        searchParams.get("q") || "";

    const categoriaParam =
        searchParams.get("categoria") || "";

    const soloOfertas =
        searchParams.get("oferta") === "1";

    const slug =
        params.slug || "";


    /* =========================================================
       ESTADOS
    ========================================================= */

    const [productos, setProductos] =
        useState([]);

    const [categorias, setCategorias] =
        useState([]);

    const [ofertas, setOfertas] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [unknownSlug, setUnknownSlug] =
        useState(false);

    const [selectedProductId, setSelectedProductId] =
        useState(null);

    const [filtrosAbiertos, setFiltrosAbiertos] =
        useState(false);


    /* =========================================================
       FILTROS
    ========================================================= */

    const [busqueda, setBusqueda] =
        useState(query);

    const [categoria, setCategoria] =
        useState(categoriaParam);

    const [precioMin, setPrecioMin] =
        useState("");

    const [precioMax, setPrecioMax] =
        useState("");

    const [soloConDescuento, setSoloConDescuento] =
        useState(soloOfertas);

    const [orden, setOrden] =
        useState("relevancia");


    /* =========================================================
       CARGAR PRODUCTOS
    ========================================================= */

    useEffect(() => {

        const controller =
            new AbortController();

        const cargar = async () => {

            try {

                setLoading(true);

                const [
                    prodRes,
                    catRes,
                    ofRes
                ] = await Promise.all([

                    getProducts({
                        signal: controller.signal
                    }),

                    getCategories({
                        signal: controller.signal
                    }),

                    getOffers({
                        signal: controller.signal
                    }).catch(() => ({
                        data: []
                    })),

                ]);


                const productosData =
                    prodRes?.data || [];

                const categoriasData =
                    catRes?.data || [];

                const ofertasData =
                    ofRes?.data || [];


                setProductos(
                    Array.isArray(productosData)
                        ? productosData.filter(
                            (p) =>
                                p.estado === "activo"
                        )
                        : []
                );


                setCategorias(
                    Array.isArray(categoriasData)
                        ? categoriasData
                        : []
                );


                setOfertas(
                    Array.isArray(ofertasData)
                        ? ofertasData
                        : []
                );

            } catch (error) {

                if (
                    error?.name !== "CanceledError" &&
                    error?.code !== "ERR_CANCELED"
                ) {

                    console.error(
                        "Error cargando productos:",
                        error
                    );

                }

            } finally {

                setLoading(false);

            }

        };


        cargar();


        return () => {
            controller.abort();
        };

    }, []);


    /* =========================================================
       RESOLVER SLUG
    ========================================================= */

    useEffect(() => {

        if (loading) return;

        if (!slug) {

            setUnknownSlug(false);

            return;
        }


        const match =
            categorias.find(
                (c) =>
                    slugify(c.nombre) === slug
            );


        if (match) {

            setCategoria(
                String(match.id_categoria)
            );

            setUnknownSlug(false);

        } else {

            setCategoria("");

            setUnknownSlug(true);

        }

    }, [
        slug,
        categorias,
        loading
    ]);


    /* =========================================================
       SINCRONIZAR URL
    ========================================================= */

    useEffect(() => {

        setBusqueda(query);

    }, [query]);


    useEffect(() => {

        if (slug) return;

        setCategoria(categoriaParam);

    }, [
        categoriaParam,
        slug
    ]);


    useEffect(() => {

        setSoloConDescuento(
            soloOfertas
        );

    }, [soloOfertas]);


    /* =========================================================
       PRODUCTOS EN OFERTA
    ========================================================= */

    const productosEnOferta =
        useMemo(() => {

            const ids = new Set();

            (ofertas || []).forEach((oferta) => {

                const id =
                    oferta.producto?.id_producto ||
                    oferta.producto_detalle?.id_producto ||
                    oferta.id_producto ||
                    oferta.producto_id ||
                    null;


                if (id) {
                    ids.add(id);
                }

            });


            return ids;

        }, [ofertas]);


    /* =========================================================
       DESCUENTO
    ========================================================= */

    const descuentoPorProducto =
        useMemo(() => {

            const map = new Map();


            (ofertas || []).forEach((oferta) => {

                const id =
                    oferta.producto?.id_producto ||
                    oferta.producto_detalle?.id_producto ||
                    oferta.id_producto ||
                    oferta.producto_id ||
                    null;


                if (!id) return;


                const porcentaje =
                    Number(
                        oferta.porcentaje ||
                        oferta.descuento ||
                        0
                    );


                if (porcentaje > 0) {

                    map.set(
                        id,
                        porcentaje
                    );

                }

            });


            return map;

        }, [ofertas]);


    /* =========================================================
       FILTRAR PRODUCTOS
    ========================================================= */

    const productosFiltrados =
        useMemo(() => {

            let lista =
                [...productos];


            /* BUSQUEDA */

            if (busqueda.trim()) {

                const texto =
                    busqueda
                        .toLowerCase()
                        .trim();


                lista =
                    lista.filter(
                        (producto) =>
                            (
                                producto.nombre ||
                                ""
                            )
                                .toLowerCase()
                                .includes(texto)
                    );

            }


            /* CATEGORIA */

            if (categoria) {

                const idCategoria =
                    Number(categoria);


                lista =
                    lista.filter(
                        (producto) => {

                            const id =
                                producto.categoria
                                    ?.id_categoria ??
                                producto.categoria;


                            return (
                                Number(id) ===
                                idCategoria
                            );

                        }
                    );

            }


            /* PRECIO MINIMO */

            if (
                precioMin !== "" &&
                !Number.isNaN(
                    Number(precioMin)
                )
            ) {

                lista =
                    lista.filter(
                        (producto) =>
                            Number(
                                producto.precio
                            ) >=
                            Number(precioMin)
                    );

            }


            /* PRECIO MAXIMO */

            if (
                precioMax !== "" &&
                !Number.isNaN(
                    Number(precioMax)
                )
            ) {

                lista =
                    lista.filter(
                        (producto) =>
                            Number(
                                producto.precio
                            ) <=
                            Number(precioMax)
                    );

            }


            /* OFERTAS */

            if (soloConDescuento) {

                lista =
                    lista.filter(
                        (producto) =>
                            productosEnOferta.has(
                                producto.id_producto
                            ) ||
                            (
                                producto.descuento &&
                                Number(
                                    producto.descuento
                                ) > 0
                            )
                    );

            }


            /* ORDEN */

            switch (orden) {

                case "precio-asc":

                    lista.sort(
                        (a, b) =>
                            Number(a.precio) -
                            Number(b.precio)
                    );

                    break;


                case "precio-desc":

                    lista.sort(
                        (a, b) =>
                            Number(b.precio) -
                            Number(a.precio)
                    );

                    break;


                case "nombre":

                    lista.sort(
                        (a, b) =>
                            (
                                a.nombre || ""
                            ).localeCompare(
                                b.nombre || ""
                            )
                    );

                    break;


                default:
                    break;

            }


            return lista;

        }, [
            productos,
            busqueda,
            categoria,
            precioMin,
            precioMax,
            soloConDescuento,
            productosEnOferta,
            orden
        ]);


    /* =========================================================
       FILTROS
    ========================================================= */

    const aplicarFiltros = () => {

        const params =
            new URLSearchParams();


        if (busqueda.trim()) {

            params.set(
                "q",
                busqueda.trim()
            );

        }


        if (categoria) {

            params.set(
                "categoria",
                categoria
            );

        }


        if (soloConDescuento) {

            params.set(
                "oferta",
                "1"
            );

        }


        setSearchParams(params);

        setFiltrosAbiertos(false);

    };


    const limpiarFiltros = () => {

        setBusqueda("");

        setCategoria("");

        setPrecioMin("");

        setPrecioMax("");

        setSoloConDescuento(false);

        setOrden("relevancia");

        setSearchParams({});

        setFiltrosAbiertos(false);

    };


    const hayFiltrosActivos =
        Boolean(
            busqueda ||
            categoria ||
            precioMin ||
            precioMax ||
            soloConDescuento ||
            orden !== "relevancia"
        );


    /* =========================================================
       TITULO
    ========================================================= */

    const tituloProductos =
        query
            ? `Resultados para "${query}"`
            : categoria
                ? (
                    categorias.find(
                        (c) =>
                            String(
                                c.id_categoria
                            ) ===
                            String(categoria)
                    )?.nombre ||
                    "Productos"
                )
                : "Todos los productos";


    /* =========================================================
       PANEL DE FILTROS
    ========================================================= */

    const panelFiltros = (

        <aside className="products-sidebar">

            <div className="sidebar-section">

                <h3>
                    Categorías
                </h3>


                <button
                    type="button"
                    className={
                        !categoria
                            ? "category-item active"
                            : "category-item"
                    }
                    onClick={() => {
                        setCategoria("");
                    }}
                >
                    Todos
                </button>


                {categorias.map(
                    (cat) => {

                        const active =
                            String(
                                categoria
                            ) ===
                            String(
                                cat.id_categoria
                            );


                        return (

                            <button
                                key={
                                    cat.id_categoria
                                }
                                type="button"
                                className={
                                    active
                                        ? "category-item active"
                                        : "category-item"
                                }
                                onClick={() => {

                                    setCategoria(
                                        String(
                                            cat.id_categoria
                                        )
                                    );

                                }}
                            >

                                {cat.nombre}

                            </button>

                        );

                    }
                )}

            </div>


            <div className="sidebar-divider" />


            <div className="sidebar-section">

                <div className="sidebar-title-row">

                    <h3>
                        Filtros
                    </h3>


                    {hayFiltrosActivos && (

                        <button
                            type="button"
                            className="sidebar-clear"
                            onClick={
                                limpiarFiltros
                            }
                        >
                            Limpiar
                        </button>

                    )}

                </div>


                <div className="filter-block">

                    <span className="filter-label">
                        Precio
                    </span>


                    <div className="price-label">
                        <span>
                            $
                            {precioMin
                                ? Number(
                                    precioMin
                                ).toLocaleString(
                                    "es-CO"
                                )
                                : "0"}
                        </span>

                        <span>
                            $
                            {precioMax
                                ? Number(
                                    precioMax
                                ).toLocaleString(
                                    "es-CO"
                                )
                                : "1.000.000"}
                        </span>
                    </div>


                    <div className="price-inputs">

                        <input
                            type="number"
                            min="0"
                            placeholder="Mínimo"
                            value={
                                precioMin
                            }
                            onChange={(e) =>
                                setPrecioMin(
                                    e.target.value
                                )
                            }
                        />

                        <input
                            type="number"
                            min="0"
                            placeholder="Máximo"
                            value={
                                precioMax
                            }
                            onChange={(e) =>
                                setPrecioMax(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                </div>


                <div className="filter-block">

                    <span className="filter-label">
                        Buscar
                    </span>


                    <input
                        className="sidebar-input"
                        type="text"
                        placeholder="¿Qué buscas?"
                        value={busqueda}
                        onChange={(e) =>
                            setBusqueda(
                                e.target.value
                            )
                        }
                    />

                </div>


                <label className="discount-filter">

                    <input
                        type="checkbox"
                        checked={
                            soloConDescuento
                        }
                        onChange={(e) =>
                            setSoloConDescuento(
                                e.target.checked
                            )
                        }
                    />

                    <span>
                        Solo con descuento
                    </span>

                </label>


                <button
                    type="button"
                    className="apply-filters-button"
                    onClick={
                        aplicarFiltros
                    }
                >
                    Aplicar filtros
                </button>

            </div>

        </aside>

    );


    /* =========================================================
       RENDER
    ========================================================= */

    return (

        <main className="products-page">

            <div className="products-container">


                {/* =================================================
                    CONTENIDO PRINCIPAL
                ================================================= */}

                <div className="products-layout">


                    {panelFiltros}


                    <section className="products-content">


                        {/* =========================================
                            HEADER
                        ========================================= */}

                        <header className="products-header">

                            <div className="products-heading">

                                <h1>
                                    {tituloProductos}
                                </h1>


                                <p>
                                    Explora nuestro
                                    catálogo completo
                                    y encuentra lo
                                    que buscas.
                                </p>

                            </div>


                            <div className="products-toolbar">


                                <button
                                    type="button"
                                    className="mobile-filter-button"
                                    onClick={() =>
                                        setFiltrosAbiertos(
                                            true
                                        )
                                    }
                                >

                                    <SlidersHorizontal
                                        size={17}
                                    />

                                    Filtros

                                </button>


                                <div className="products-count">

                                    Mostrando{" "}
                                    <strong>
                                        {productosFiltrados.length}
                                    </strong>{" "}
                                    de{" "}
                                    <strong>
                                        {productos.length}
                                    </strong>{" "}
                                    productos

                                </div>


                                <div className="products-sort">

                                    <span>
                                        Ordenar
                                    </span>

                                    <select
                                        value={orden}
                                        onChange={(e) =>
                                            setOrden(
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="relevancia">
                                            Más vendidos
                                        </option>

                                        <option value="precio-asc">
                                            Precio menor
                                        </option>

                                        <option value="precio-desc">
                                            Precio mayor
                                        </option>

                                        <option value="nombre">
                                            Nombre A-Z
                                        </option>

                                    </select>

                                    <ChevronDown
                                        size={15}
                                    />

                                </div>

                            </div>

                        </header>


                        {/* =========================================
                            PRODUCTOS
                        ========================================= */}

                        {loading ? (

                            <div className="products-message">

                                <div className="loading-spinner" />

                                <p>
                                    Cargando productos...
                                </p>

                            </div>

                        ) : unknownSlug ? (

                            <div className="products-empty">

                                <h3>
                                    No encontramos{" "}
                                    "{prettifySlug(slug)}"
                                </h3>

                                <p>
                                    La categoría que
                                    buscas no existe
                                    o ya no está
                                    disponible.
                                </p>

                                <Link
                                    to="/products"
                                    className="empty-action"
                                >
                                    Ver todos los productos
                                </Link>

                            </div>

                        ) : productosFiltrados.length === 0 ? (

                            <div className="products-empty">

                                <h3>
                                    No encontramos
                                    productos
                                </h3>

                                <p>
                                    Prueba ajustando
                                    los filtros o
                                    usando otras
                                    palabras clave.
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        limpiarFiltros
                                    }
                                    className="empty-action"
                                >
                                    Limpiar filtros
                                </button>

                            </div>

                        ) : (

                            <div className="products-grid">

                                {productosFiltrados.map(
                                    (producto) => (

                                        <ProductCard
                                            key={
                                                producto.id_producto
                                            }

                                            product={{
                                                ...producto,

                                                descuento:
                                                    descuentoPorProducto.get(
                                                        producto.id_producto
                                                    ) ||
                                                    producto.descuento ||
                                                    0
                                            }}

                                            onSelect={
                                                setSelectedProductId
                                            }
                                        />

                                    )
                                )}

                            </div>

                        )}


                        {/* =========================================
                            PAGINACIÓN VISUAL
                        ========================================= */}

                        {!loading &&
                            !unknownSlug &&
                            productosFiltrados.length > 0 && (

                                <div className="products-pagination">

                                    <button
                                        type="button"
                                        className="pagination-number active"
                                    >
                                        1
                                    </button>

                                    <button
                                        type="button"
                                        className="pagination-number"
                                    >
                                        2
                                    </button>

                                    <button
                                        type="button"
                                        className="pagination-number"
                                    >
                                        3
                                    </button>

                                    <button
                                        type="button"
                                        className="pagination-number"
                                    >
                                        4
                                    </button>

                                    <button
                                        type="button"
                                        className="pagination-number"
                                    >
                                        5
                                    </button>

                                    <span className="pagination-dots">
                                        ...
                                    </span>

                                    <button
                                        type="button"
                                        className="pagination-number"
                                    >
                                        10
                                    </button>

                                    <button
                                        type="button"
                                        className="pagination-next"
                                    >
                                        <ChevronRight
                                            size={17}
                                        />
                                    </button>

                                </div>

                            )}

                    </section>

                </div>

            </div>


            {/* =====================================================
                MODAL FILTROS MOBILE
            ===================================================== */}

            {filtrosAbiertos && (

                <div
                    className="filters-modal"
                    onClick={() =>
                        setFiltrosAbiertos(false)
                    }
                >

                    <div
                        className="filters-modal-inner"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="filters-modal-head">

                            <h3>
                                Filtros
                            </h3>

                            <button
                                type="button"
                                onClick={() =>
                                    setFiltrosAbiertos(
                                        false
                                    )
                                }
                                aria-label="Cerrar filtros"
                            >
                                <X size={21} />
                            </button>

                        </div>


                        {panelFiltros}

                    </div>

                </div>

            )}


            {/* =====================================================
                DETALLE PRODUCTO
            ===================================================== */}

            {selectedProductId !== null && (

                <ProductDetail
                    productId={
                        selectedProductId
                    }
                    onClose={() =>
                        setSelectedProductId(
                            null
                        )
                    }
                />

            )}

        </main>

    );
}


export default Products;