import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
    SlidersHorizontal,
    X,
    ChevronDown,
} from "lucide-react";

import ProductCard from "./ProductCard/ProductCard";
import Breadcrumb from "../../components/Breadcrumb/Breadcrumb";

import { getCategories, getProducts } from "../../services/adminService";
import { getOffers } from "../../services/clientService";

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

    const navigate = useNavigate();
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

    const [filtrosAbiertos, setFiltrosAbiertos] =
        useState(false);

    const [categoriasExpandidas, setCategoriasExpandidas] =
        useState(true);

    const [categoriasAcordeon, setCategoriasAcordeon] =
        useState({});


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

    const [tendencia, setTendencia] =
        useState(false);

    const highlightParam =
        searchParams.get("highlight") || "";


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
                        signal: controller.signal,
                        tendencia: tendencia
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

    }, [tendencia]);


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
                    c.slug === slug
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
       RESOLVER HIGHLIGHT DESDE HERO
    ========================================================= */

    useEffect(() => {

        if (loading || !highlightParam) return;

        const categoriasMap = {
            "family": ["Hombre", "Mujeres", "Niños", "Mascotas"],
            "toys": ["Tecnología", "Juguetes"],
            "accessories": ["Accesorios"]
        };

        const categoriasAHiglight = categoriasMap[highlightParam];

        if (!categoriasAHiglight) return;

        const categoriasIds = categorias
            .filter(cat => categoriasAHiglight.includes(cat.nombre))
            .map(cat => String(cat.id_categoria));

        if (categoriasIds.length > 0) {
            setCategoria(categoriasIds[0]);
        } else {
            // Si no se encuentran categorías por nombre, intentar por slug
            const slugMap = {
                "family": ["hombre", "mujeres", "ninos", "mascotas"],
                "toys": ["tecnologia", "juguetes"],
                "accessories": ["accesorios"]
            };
            const slugsToMatch = slugMap[highlightParam];
            if (slugsToMatch) {
                const matchedBySlug = categorias
                    .filter(cat => slugsToMatch.includes(cat.slug?.toLowerCase()))
                    .map(cat => String(cat.id_categoria));
                if (matchedBySlug.length > 0) {
                    setCategoria(matchedBySlug[0]);
                }
            }
        }

    }, [
        highlightParam,
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


    // Sincronizar filtros con URL en tiempo real
    useEffect(() => {

        const params = new URLSearchParams();

        if (busqueda.trim()) {
            params.set("q", busqueda.trim());
        }

        if (categoria) {
            params.set("categoria", categoria);
        }

        if (soloConDescuento) {
            params.set("oferta", "1");
        }

        if (tendencia) {
            params.set("tendencia", "1");
        }

        setSearchParams(params);

    }, [busqueda, categoria, soloConDescuento, tendencia]);


    /* =========================================================
       CATEGORÍAS PADRE
       - Solo las que no tienen padre.
       - Excluimos las archivadas para no mostrarlas en el sidebar.
    ========================================================= */

    const categoriasPadres = useMemo(() => {

        return (categorias || []).filter(
            (cat) =>
                !cat.categoria_padre_id &&
                !cat.categoria_padre &&
                cat.estado !== "archivado"
        );

    }, [categorias]);


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


            /* CATEGORIA
               - Si la categoría seleccionada es padre, también
                 mostramos los productos de sus subcategorías.
               - Si es hija, solo esa. */

            if (categoria) {

                const idCategoria =
                    Number(categoria);


                // IDs de la categoría seleccionada + sus descendientes
                const idsValidos = new Set([idCategoria]);

                categoriasPadres.forEach((padre) => {

                    if (padre.id_categoria === idCategoria) {

                        (padre.subcategorias || []).forEach((sub) => {

                            if (sub.estado !== "archivado") {

                                idsValidos.add(
                                    Number(sub.id_categoria)
                                );

                            }

                        });

                    }

                });


                lista =
                    lista.filter(
                        (producto) => {

                            const id =
                                Number(
                                    producto.categoria
                                        ?.id_categoria ??
                                    producto.categoria
                                );


                            return idsValidos.has(id);

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
            orden,
            categoriasPadres,
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


                <label className="discount-filter">

                    <input
                        type="checkbox"
                        checked={
                            tendencia
                        }
                        onChange={(e) =>
                            setTendencia(
                                e.target.checked
                            )
                        }
                    />

                    <span>
                        Tendencia
                    </span>

                </label>


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

            </div>


            <div className="sidebar-divider" />


            <div className="sidebar-section">

                <div className="sidebar-section-header">
                    <h3>
                        Categorías
                    </h3>

                    <button
                        type="button"
                        className="sidebar-toggle-categories"
                        onClick={() =>
                            setCategoriasExpandidas(
                                !categoriasExpandidas
                            )
                        }
                        aria-label={
                            categoriasExpandidas
                                ? "Ocultar categorías"
                                : "Mostrar categorías"
                        }
                    >
                        {categoriasExpandidas ? (
                            <ChevronDown size={16} />
                        ) : (
                            <ChevronDown
                                size={16}
                                style={{
                                    transform: "rotate(-90deg)"
                                }}
                            />
                        )}
                    </button>
                </div>


                {categoriasExpandidas && (

                    <>

                        <button
                            type="button"
                            className={
                                !categoria
                                    ? "category-item category-item--parent active"
                                    : "category-item category-item--parent"
                            }
                            onClick={() => {
                                setCategoria("");
                            }}
                        >
                            Todos
                        </button>


                        {categoriasPadres.map(
                            (padre) => {

                                const subcats =
                                    (padre.subcategorias ||
                                        []).filter(
                                            (s) =>
                                                s.estado !==
                                                "archivado"
                                        );

                                const isPadreActive =
                                    String(categoria) ===
                                    String(padre.id_categoria);

                                const isExpanded =
                                    categoriasAcordeon[padre.id_categoria] || false;

                                const hasSubcats = subcats.length > 0;

                                return (

                                    <div
                                        key={padre.id_categoria}
                                        className="category-group"
                                    >

                                        <button
                                            type="button"
                                            className={
                                                isPadreActive
                                                    ? "category-item category-item--parent active"
                                                    : "category-item category-item--parent"
                                            }
                                            onClick={() => {
                                                if (hasSubcats) {
                                                    setCategoriasAcordeon(prev => ({
                                                        ...prev,
                                                        [padre.id_categoria]: !isExpanded
                                                    }));
                                                }
                                                // Navegar por slug en lugar de solo setCategoria
                                                if (padre.slug) {
                                                    navigate(`/categoria/${padre.slug}`);
                                                } else {
                                                    setCategoria(
                                                        String(
                                                            padre.id_categoria
                                                        )
                                                    );
                                                }
                                            }}
                                        >

                                            <span className="category-item-text">
                                                {padre.nombre}
                                            </span>

                                            {hasSubcats && (
                                                <ChevronDown
                                                    size={14}
                                                    className={
                                                        isExpanded
                                                            ? "category-chevron category-chevron--expanded"
                                                            : "category-chevron"
                                                    }
                                                />
                                            )}

                                        </button>


                                        {hasSubcats && isExpanded && (

                                            <div className="category-sublist">

                                                {subcats.map(
                                                    (sub) => {

                                                        const isSubActive =
                                                            String(
                                                                categoria
                                                            ) ===
                                                            String(
                                                                sub.id_categoria
                                                            );

                                                        const subSubcats =
                                                            (sub.subcategorias ||
                                                                []).filter(
                                                                    (ss) =>
                                                                        ss.estado !==
                                                                        "archivado"
                                                                );

                                                        const hasSubSubcats = subSubcats.length > 0;

                                                        const isSubExpanded =
                                                            categoriasAcordeon[sub.id_categoria] || false;

                                                        return (

                                                            <div
                                                                key={sub.id_categoria}
                                                                className="category-subgroup"
                                                            >

                                                                <button
                                                                    key={
                                                                        sub.id_categoria
                                                                    }
                                                                    type="button"
                                                                    className={
                                                                        isSubActive
                                                                            ? "category-item category-item--sub active"
                                                                            : "category-item category-item--sub"
                                                                    }
                                                                    onClick={() => {
                                                                        if (hasSubSubcats) {
                                                                            setCategoriasAcordeon(prev => ({
                                                                                ...prev,
                                                                                [sub.id_categoria]: !isSubExpanded
                                                                            }));
                                                                        }
                                                                        // Navegar por slug en lugar de solo setCategoria
                                                                        if (sub.slug) {
                                                                            navigate(`/categoria/${sub.slug}`);
                                                                        } else {
                                                                            setCategoria(
                                                                                String(
                                                                                    sub.id_categoria
                                                                                )
                                                                            );
                                                                        }
                                                                    }}
                                                                >

                                                                    <span className="category-item-text">
                                                                        {sub.nombre}
                                                                    </span>

                                                                    {hasSubSubcats && (
                                                                        <ChevronDown
                                                                            size={12}
                                                                            className={
                                                                                isSubExpanded
                                                                                    ? "category-chevron category-chevron--expanded"
                                                                                    : "category-chevron"
                                                                            }
                                                                        />
                                                                    )}

                                                                </button>

                                                                {hasSubSubcats && isSubExpanded && (

                                                                    <div className="category-sublist category-sublist--nested">

                                                                        {subSubcats.map(
                                                                            (subSub) => {

                                                                                const isSubSubActive =
                                                                                    String(
                                                                                        categoria
                                                                                    ) ===
                                                                                    String(
                                                                                        subSub.id_categoria
                                                                                    );

                                                                                return (

                                                                                    <button
                                                                                        key={
                                                                                            subSub.id_categoria
                                                                                        }
                                                                                        type="button"
                                                                                        className={
                                                                                            isSubSubActive
                                                                                                ? "category-item category-item--subsub active"
                                                                                                : "category-item category-item--subsub"
                                                                                        }
                                                                                        onClick={() => {
                                                                                            // Navegar por slug en lugar de solo setCategoria
                                                                                            if (subSub.slug) {
                                                                                                navigate(`/categoria/${subSub.slug}`);
                                                                                            } else {
                                                                                                setCategoria(
                                                                                                    String(
                                                                                                        subSub.id_categoria
                                                                                                    )
                                                                                                );
                                                                                            }
                                                                                        }}
                                                                                    >

                                                                                        {subSub.nombre}

                                                                                    </button>

                                                                                );

                                                                            }
                                                                        )}

                                                                    </div>

                                                                )}

                                                            </div>

                                                        );

                                                    }
                                                )}

                                            </div>

                                        )}

                                    </div>

                                );

                            }
                        )}

                    </>
                )}

            </div>

        </aside>

    );


    /* =========================================================
       RENDER
    ========================================================= */

    /* =========================================================
       BREADCRUMB
    ========================================================= */

    const breadcrumbItems = useMemo(() => {

        const items = [
            {
                label: "Productos",
                to: "/products"
            }
        ];


        if (categoria) {

            const catActual =
                categorias.find(
                    (c) =>
                        String(
                            c.id_categoria
                        ) ===
                        String(categoria)
                );


            if (catActual) {

                if (
                    catActual.categoria_padre_id ||
                    catActual.categoria_padre
                ) {

                    const padre =
                        categorias.find(
                            (c) =>
                                String(
                                    c.id_categoria
                                ) ===
                                String(
                                    catActual.categoria_padre_id ||
                                    catActual.categoria_padre
                                )
                        );


                    if (padre) {

                        items.push({
                            label: padre.nombre,
                            to: `/categoria/${padre.slug}`
                        });

                    }

                }


                items.push({
                    label: catActual.nombre
                });

            }

        }


        if (query) {

            items.push({
                label: `Resultados: "${query}"`
            });

        }


        return items;

    }, [
        categorias,
        categoria,
        query
    ]);


    return (

        <main className="products-page">

            <div className="products-container">


                {/* =================================================
                    BREADCRUMB
                ================================================= */}

                <Breadcrumb items={breadcrumbItems} />


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
                                        onChange={(e) => {
                                            const valor = e.target.value;
                                            setOrden(valor);
                                            if (valor === "tendencia") {
                                                setTendencia(true);
                                            } else {
                                                setTendencia(false);
                                            }
                                        }}
                                    >

                                        <option value="relevancia">
                                            Relevancia
                                        </option>

                                        <option value="tendencia">
                                            Tendencia
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
                                        />

                                    )
                                )}

                            </div>

                        )}


                        {/*
                            PAGINACIÓN
                            — Deshabilitada temporalmente.
                            — El backend aún no pagina; cuando
                              lo haga se reactiva con la cantidad
                              real de páginas.
                        */}

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

        </main>

    );
}


export default Products;