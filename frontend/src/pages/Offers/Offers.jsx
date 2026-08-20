import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    SlidersHorizontal,
    X,
    ChevronDown,
    ChevronRight,
} from "lucide-react";

import OfferCard from "./OfferCard/OfferCard";
import ProductDetail from "../Products/ProductDetail/ProductDetail";
import Breadcrumb from "../../components/Breadcrumb/Breadcrumb";

import { getCategories } from "../../services/adminService";
import { getOffers } from "../../services/clientService";

import "./Offers.css";


function Offers() {

    /* =========================================================
       ESTADOS
    ========================================================= */

    const [ofertas, setOfertas] = useState([]);
    const [categorias, setCategorias] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedProductId, setSelectedProductId] = useState(null);
    const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);


    /* =========================================================
       FILTROS
    ========================================================= */

    const [busqueda, setBusqueda] = useState("");
    const [categoria, setCategoria] = useState("");
    const [precioMin, setPrecioMin] = useState("");
    const [precioMax, setPrecioMax] = useState("");
    const [orden, setOrden] = useState("relevancia");


    /* =========================================================
       CARGAR OFERTAS + CATEGORÍAS
    ========================================================= */

    useEffect(() => {

        const controller = new AbortController();

        const cargar = async () => {

            try {

                setLoading(true);

                const [ofRes, catRes] = await Promise.all([

                    getOffers({
                        signal: controller.signal,
                    }),

                    getCategories({
                        signal: controller.signal,
                    }),

                ]);

                const ofertasData = ofRes?.data || [];
                const categoriasData = catRes?.data || [];


                /*
                 * Filtramos las ofertas por vigencia:
                 * - Que estén activas.
                 * - Que la fecha actual esté dentro de la ventana
                 *   fecha_inicio / fecha_fin (si están definidas).
                 *
                 * Comparamos contra timestamps para que las fechas
                 * ISO datetime no descarten ofertas por una
                 * comparación de strings frágil.
                 */

                const ahora = Date.now();

                const activas = (Array.isArray(ofertasData) ? ofertasData : []).filter((o) => {

                    if (o.activa === false) return false;

                    const tsInicio = o.fecha_inicio
                        ? new Date(o.fecha_inicio).getTime()
                        : null;
                    const tsFin = o.fecha_fin
                        ? new Date(o.fecha_fin).getTime()
                        : null;

                    if (tsInicio !== null && Number.isNaN(tsInicio)) return false;
                    if (tsFin !== null && Number.isNaN(tsFin)) return false;

                    if (tsInicio !== null && ahora < tsInicio) return false;
                    if (tsFin !== null && ahora > tsFin) return false;

                    return true;

                });

                setOfertas(activas);
                setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
                setError(null);

            } catch (err) {

                if (
                    err?.name !== "CanceledError" &&
                    err?.code !== "ERR_CANCELED"
                ) {
                    console.error("Error cargando ofertas:", err);
                    setError("No fue posible cargar las ofertas.");
                }

            } finally {

                setLoading(false);

            }

        };

        cargar();

        return () => controller.abort();

    }, []);


    /* =========================================================
       CATEGORÍAS PADRE
       - Solo las que no tienen padre.
       - Excluimos las archivadas.
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
       CÁLCULOS POR OFERTA
       Calculamos el porcentaje equivalente (cuando el descuento
       es fijo) para mostrar un badge consistente -X%.
    ========================================================= */

    const descuentoPorOferta = useMemo(() => {

        const map = new Map();

        (ofertas || []).forEach((oferta) => {

            const producto = oferta.producto_detalle;
            const original = Number(producto?.precio);

            if (!Number.isFinite(original) || original <= 0) return;

            const valor = Number(oferta.valor);
            if (!Number.isFinite(valor) || valor <= 0) return;

            let porcentaje = 0;

            if (oferta.tipo_descuento === "porcentaje") {
                porcentaje = Math.round(valor);
            } else {
                porcentaje = Math.round((valor / original) * 100);
            }

            map.set(oferta.id_oferta, porcentaje);

        });

        return map;

    }, [ofertas]);


    /* =========================================================
       FILTRAR OFERTAS
    ========================================================= */

    const ofertasFiltradas = useMemo(() => {

        let lista = [...ofertas];


        /* BÚSQUEDA */

        if (busqueda.trim()) {

            const texto = busqueda.toLowerCase().trim();

            lista = lista.filter((oferta) => {

                const nombreProducto =
                    oferta.producto_detalle?.nombre || "";
                const nombreOferta = oferta.nombre || "";

                return (
                    nombreProducto.toLowerCase().includes(texto) ||
                    nombreOferta.toLowerCase().includes(texto)
                );

            });

        }


        /* CATEGORÍA
           - Si la categoría seleccionada es padre, también
             mostramos las ofertas de sus subcategorías.
           - Si es hija, solo esa. */

        if (categoria) {

            const idCategoria = Number(categoria);

            const idsValidos = new Set([idCategoria]);

            categoriasPadres.forEach((padre) => {

                if (padre.id_categoria === idCategoria) {

                    (padre.subcategorias || []).forEach((sub) => {

                        if (sub.estado !== "archivado") {
                            idsValidos.add(Number(sub.id_categoria));
                        }

                    });

                }

            });

            lista = lista.filter((oferta) => {

                const id = Number(
                    oferta.producto_detalle?.categoria?.id_categoria ??
                    oferta.producto_detalle?.categoria
                );

                return idsValidos.has(id);

            });

        }


        /* PRECIO MÍNIMO (sobre el precio con descuento) */

        if (
            precioMin !== "" &&
            !Number.isNaN(Number(precioMin))
        ) {

            lista = lista.filter((oferta) => {

                const producto = oferta.producto_detalle;
                if (!producto) return false;

                const original = Number(producto.precio);
                const valor = Number(oferta.valor);

                let nuevo = original;

                if (oferta.tipo_descuento === "porcentaje") {
                    nuevo = original - (original * valor) / 100;
                } else {
                    nuevo = original - valor;
                }

                nuevo = Math.max(0, nuevo);

                return nuevo >= Number(precioMin);

            });

        }


        /* PRECIO MÁXIMO */

        if (
            precioMax !== "" &&
            !Number.isNaN(Number(precioMax))
        ) {

            lista = lista.filter((oferta) => {

                const producto = oferta.producto_detalle;
                if (!producto) return false;

                const original = Number(producto.precio);
                const valor = Number(oferta.valor);

                let nuevo = original;

                if (oferta.tipo_descuento === "porcentaje") {
                    nuevo = original - (original * valor) / 100;
                } else {
                    nuevo = original - valor;
                }

                nuevo = Math.max(0, nuevo);

                return nuevo <= Number(precioMax);

            });

        }


        /* ORDEN */

        const calcularPrecioFinal = (oferta) => {

            const original = Number(oferta.producto_detalle?.precio);
            const valor = Number(oferta.valor);

            if (!Number.isFinite(original)) return 0;

            let nuevo = original;

            if (oferta.tipo_descuento === "porcentaje") {
                nuevo = original - (original * valor) / 100;
            } else {
                nuevo = original - valor;
            }

            return Math.max(0, nuevo);

        };

        switch (orden) {

            case "precio-asc":
                lista.sort((a, b) => calcularPrecioFinal(a) - calcularPrecioFinal(b));
                break;

            case "precio-desc":
                lista.sort((a, b) => calcularPrecioFinal(b) - calcularPrecioFinal(a));
                break;

            case "nombre":
                lista.sort((a, b) => {

                    const na = a.producto_detalle?.nombre || a.nombre || "";
                    const nb = b.producto_detalle?.nombre || b.nombre || "";

                    return na.localeCompare(nb);

                });
                break;

            default:
                break;

        }

        return lista;

    }, [
        ofertas,
        busqueda,
        categoria,
        precioMin,
        precioMax,
        orden,
        categoriasPadres,
    ]);


    /* =========================================================
       LIMPIAR FILTROS
    ========================================================= */

    const limpiarFiltros = () => {

        setBusqueda("");
        setCategoria("");
        setPrecioMin("");
        setPrecioMax("");
        setOrden("relevancia");
        setFiltrosAbiertos(false);

    };


    const hayFiltrosActivos = Boolean(
        busqueda ||
        categoria ||
        precioMin ||
        precioMax ||
        orden !== "relevancia"
    );


    /* =========================================================
       PANEL DE FILTROS
       Mismo patrón que Products.jsx, sin el checkbox
       "Solo con descuento" (ya estamos en /offers).
    ========================================================= */

    const panelFiltros = (

        <aside className="products-sidebar">

            <div className="sidebar-section">

                <h3>Categorías</h3>

                <button
                    type="button"
                    className={
                        !categoria
                            ? "category-item category-item--parent active"
                            : "category-item category-item--parent"
                    }
                    onClick={() => setCategoria("")}
                >
                    Todos
                </button>

                {categoriasPadres.map((padre) => {

                    const subcats = (padre.subcategorias || []).filter(
                        (s) => s.estado !== "archivado"
                    );

                    const isPadreActive =
                        String(categoria) === String(padre.id_categoria);

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
                                onClick={() =>
                                    setCategoria(String(padre.id_categoria))
                                }
                            >
                                {padre.nombre}
                            </button>

                            {subcats.length > 0 && (

                                <div className="category-sublist">

                                    {subcats.map((sub) => {

                                        const isSubActive =
                                            String(categoria) ===
                                            String(sub.id_categoria);

                                        return (

                                            <button
                                                key={sub.id_categoria}
                                                type="button"
                                                className={
                                                    isSubActive
                                                        ? "category-item category-item--sub active"
                                                        : "category-item category-item--sub"
                                                }
                                                onClick={() =>
                                                    setCategoria(
                                                        String(sub.id_categoria)
                                                    )
                                                }
                                            >
                                                {sub.nombre}
                                            </button>

                                        );

                                    })}

                                </div>

                            )}

                        </div>

                    );

                })}

            </div>

            <div className="sidebar-divider" />

            <div className="sidebar-section">

                <div className="sidebar-title-row">

                    <h3>Filtros</h3>

                    {hayFiltrosActivos && (

                        <button
                            type="button"
                            className="sidebar-clear"
                            onClick={limpiarFiltros}
                        >
                            Limpiar
                        </button>

                    )}

                </div>

                <div className="filter-block">

                    <span className="filter-label">Precio</span>

                    <div className="price-label">
                        <span>
                            $
                            {precioMin
                                ? Number(precioMin).toLocaleString("es-CO")
                                : "0"}
                        </span>
                        <span>
                            $
                            {precioMax
                                ? Number(precioMax).toLocaleString("es-CO")
                                : "1.000.000"}
                        </span>
                    </div>

                    <div className="price-inputs">

                        <input
                            type="number"
                            min="0"
                            placeholder="Mínimo"
                            value={precioMin}
                            onChange={(e) => setPrecioMin(e.target.value)}
                        />

                        <input
                            type="number"
                            min="0"
                            placeholder="Máximo"
                            value={precioMax}
                            onChange={(e) => setPrecioMax(e.target.value)}
                        />

                    </div>

                </div>

                <div className="filter-block">

                    <span className="filter-label">Buscar</span>

                    <input
                        className="sidebar-input"
                        type="text"
                        placeholder="¿Qué buscas?"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />

                </div>

                <button
                    type="button"
                    className="apply-filters-button"
                    onClick={() => setFiltrosAbiertos(false)}
                >
                    Aplicar filtros
                </button>

            </div>

        </aside>

    );


    /* =========================================================
       BREADCRUMB
    ========================================================= */

    const breadcrumbItems = useMemo(() => {

        const items = [{ label: "Ofertas" }];

        if (categoria) {

            const catActual = categorias.find(
                (c) =>
                    String(c.id_categoria) === String(categoria)
            );

            if (catActual) {
                items.push({ label: catActual.nombre });
            }

        }

        if (busqueda) {
            items.push({ label: `Resultados: "${busqueda}"` });
        }

        return items;

    }, [categorias, categoria, busqueda]);


    return (

        <main className="products-page">

            <div className="products-container">

                <Breadcrumb items={breadcrumbItems} />


                <div className="products-layout">

                    {panelFiltros}

                    <section className="products-content">

                        {/* HEADER */}
                        <header className="products-header">

                            <div className="products-heading">

                                <h1>Ofertas</h1>

                                <p>
                                    Aprovecha los descuentos activos por
                                    tiempo limitado.
                                </p>

                            </div>

                            <div className="products-toolbar">

                                <button
                                    type="button"
                                    className="mobile-filter-button"
                                    onClick={() => setFiltrosAbiertos(true)}
                                >
                                    <SlidersHorizontal size={17} />
                                    Filtros
                                </button>

                                <div className="products-count">
                                    Mostrando{" "}
                                    <strong>{ofertasFiltradas.length}</strong>{" "}
                                    de{" "}
                                    <strong>{ofertas.length}</strong>{" "}
                                    ofertas
                                </div>

                                <div className="products-sort">

                                    <span>Ordenar</span>

                                    <select
                                        value={orden}
                                        onChange={(e) => setOrden(e.target.value)}
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

                                    <ChevronDown size={15} />

                                </div>

                            </div>

                        </header>


                        {/* OFERTAS */}
                        {loading ? (

                            <div className="products-message">

                                <div className="loading-spinner" />

                                <p>Cargando ofertas...</p>

                            </div>

                        ) : error ? (

                            <div className="products-empty">

                                <h3>No pudimos cargar las ofertas</h3>

                                <p>{error}</p>

                                <button
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    className="empty-action"
                                >
                                    Reintentar
                                </button>

                            </div>

                        ) : ofertasFiltradas.length === 0 ? (

                            <div className="products-empty">

                                <h3>No encontramos ofertas</h3>

                                <p>
                                    Prueba ajustando los filtros o
                                    vuelve pronto para encontrar
                                    nuevas promociones.
                                </p>

                                <button
                                    type="button"
                                    onClick={limpiarFiltros}
                                    className="empty-action"
                                >
                                    Limpiar filtros
                                </button>

                            </div>

                        ) : (

                            <div className="products-grid">

                                {ofertasFiltradas.map((oferta) => (

                                    <OfferCard
                                        key={oferta.id_oferta}
                                        offer={oferta}
                                    />

                                ))}

                            </div>

                        )}


                        {/* PAGINACIÓN VISUAL */}
                        {!loading && !error && ofertasFiltradas.length > 0 && (

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

                                <span className="pagination-dots">...</span>

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
                                    <ChevronRight size={17} />
                                </button>

                            </div>

                        )}

                    </section>

                </div>

            </div>


            {/* MODAL FILTROS MOBILE */}
            {filtrosAbiertos && (

                <div
                    className="filters-modal"
                    onClick={() => setFiltrosAbiertos(false)}
                >

                    <div
                        className="filters-modal-inner"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="filters-modal-head">

                            <h3>Filtros</h3>

                            <button
                                type="button"
                                onClick={() => setFiltrosAbiertos(false)}
                                aria-label="Cerrar filtros"
                            >
                                <X size={21} />
                            </button>

                        </div>

                        {panelFiltros}

                    </div>

                </div>

            )}


            {/* DETALLE PRODUCTO */}
            {selectedProductId !== null && (

                <ProductDetail
                    productId={selectedProductId}
                    onClose={() => setSelectedProductId(null)}
                />

            )}

        </main>

    );

}


export default Offers;
