import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Sparkles,
    ShieldCheck,
    Truck,
    ArrowRight,
    ChevronDown,
} from "lucide-react";

import ProductCard from "../Products/ProductCard/ProductCard";
import ProductDetail from "../Products/ProductDetail/ProductDetail";

import {
    getCategories,
    getProducts,
} from "../../services/adminService";

import "./New.css";


/* =========================================================
   MAPA DE ORDEN
========================================================= */

const ORDEN_MAP = {
    recientes: "-created_at",
    "precio-asc": "precio",
    "precio-desc": "-precio",
    nombre: "nombre",
};


/* =========================================================
   BENEFICIOS (estáticos)
========================================================= */

const BENEFICIOS = [
    {
        id: 1,
        icon: Sparkles,
        titulo: "Lo más nuevo",
        descripcion: "Productos recién llegados cada semana",
    },
    {
        id: 2,
        icon: ShieldCheck,
        titulo: "Calidad garantizada",
        descripcion: "Seleccionamos lo mejor para ti",
    },
    {
        id: 3,
        icon: Truck,
        titulo: "Envíos rápidos",
        descripcion: "Recibe lo nuevo en la puerta de tu casa",
    },
];


function New() {

    /* =========================================================
       ESTADOS
    ========================================================= */

    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);

    const [categoriaSeleccionada, setCategoriaSeleccionada] =
        useState(null);

    const [orden, setOrden] = useState("recientes");

    const [selectedProductId, setSelectedProductId] = useState(null);


    /* =========================================================
       CARGAR CATEGORÍAS
    ========================================================= */

    useEffect(() => {

        const controller = new AbortController();

        const cargarCategorias = async () => {

            try {

                const res = await getCategories({
                    signal: controller.signal,
                });

                const data = res?.data || [];

                setCategorias(
                    Array.isArray(data) ? data : []
                );

            } catch (error) {

                if (
                    error?.name !== "CanceledError" &&
                    error?.code !== "ERR_CANCELED"
                ) {
                    console.error(
                        "Error cargando categorías:",
                        error
                    );
                }

            }

        };

        cargarCategorias();

        return () => {
            controller.abort();
        };

    }, []);


    /* =========================================================
       CARGAR PRODUCTOS
    ========================================================= */

    useEffect(() => {

        const controller = new AbortController();

        const cargarProductos = async () => {

            try {

                setLoading(true);

                const filters = {
                    ordering: ORDEN_MAP[orden] || "-created_at",
                    estado: "activo",
                };

                if (categoriaSeleccionada) {
                    filters.categoria = categoriaSeleccionada;
                }

                const res = await getProducts({
                    ...filters,
                    signal: controller.signal,
                });

                const data = res?.data || [];

                setProductos(
                    Array.isArray(data)
                        ? data.filter(
                              (p) => p.estado === "activo"
                          )
                        : []
                );

            } catch (error) {

                if (
                    error?.name !== "CanceledError" &&
                    error?.code !== "ERR_CANCELED"
                ) {
                    console.error(
                        "Error cargando novedades:",
                        error
                    );
                }

            } finally {

                setLoading(false);

            }

        };

        cargarProductos();

        return () => {
            controller.abort();
        };

    }, [categoriaSeleccionada, orden]);


    /* =========================================================
       CATEGORÍAS PARA PILLS
    ========================================================= */

    const categoriasVisibles = useMemo(() => {

        return (categorias || []).filter(
            (cat) => cat.estado !== "archivado"
        );

    }, [categorias]);


    /* =========================================================
       RENDER
    ========================================================= */

    return (

        <main className="new-page">

            <div className="new-container">


                {/* =================================================
                    HERO
                ================================================= */}

                <section className="new-hero">

                    <div className="new-hero-text">

                        <h1>
                            Novedades
                        </h1>

                        <p>
                            Descubre los productos
                            más recientes que
                            acaban de llegar a
                            nuestra tienda.
                        </p>

                    </div>


                    <div className="new-hero-benefits">

                        {BENEFICIOS.map(
                            (beneficio) => {

                                const Icon =
                                    beneficio.icon;

                                return (

                                    <div
                                        key={
                                            beneficio.id
                                        }
                                        className="new-benefit-card"
                                    >

                                        <div className="new-benefit-icon">

                                            <Icon
                                                size={
                                                    22
                                                }
                                                strokeWidth={
                                                    1.8
                                                }
                                            />

                                        </div>


                                        <div className="new-benefit-content">

                                            <h3>
                                                {
                                                    beneficio.titulo
                                                }
                                            </h3>

                                            <p>
                                                {
                                                    beneficio.descripcion
                                                }
                                            </p>

                                        </div>

                                    </div>

                                );

                            }
                        )}

                    </div>

                </section>


                {/* =================================================
                    FILTROS: PILLS + ORDEN
                ================================================= */}

                <section className="new-toolbar-section">

                    <div className="new-pills">

                        <button
                            type="button"
                            className={
                                categoriaSeleccionada ===
                                    null
                                    ? "new-pill active"
                                    : "new-pill"
                            }
                            onClick={() =>
                                setCategoriaSeleccionada(
                                    null
                                )
                            }
                        >
                            Todos
                        </button>


                        {categoriasVisibles.map(
                            (cat) => {

                                const active =
                                    categoriaSeleccionada ===
                                    cat.id_categoria;

                                return (

                                    <button
                                        key={
                                            cat.id_categoria
                                        }
                                        type="button"
                                        className={
                                            active
                                                ? "new-pill active"
                                                : "new-pill"
                                        }
                                        onClick={() =>
                                            setCategoriaSeleccionada(
                                                cat.id_categoria
                                            )
                                        }
                                    >
                                        {cat.nombre}
                                    </button>

                                );

                            }
                        )}

                    </div>


                    <div className="new-sort">

                        <ChevronDown
                            size={15}
                            className="new-sort-icon"
                        />

                        <select
                            value={orden}
                            onChange={(e) =>
                                setOrden(
                                    e.target.value
                                )
                            }
                        >

                            <option value="recientes">
                                Más recientes
                            </option>

                            <option value="precio-asc">
                                Precio: menor a mayor
                            </option>

                            <option value="precio-desc">
                                Precio: mayor a menor
                            </option>

                            <option value="nombre">
                                Nombre A-Z
                            </option>

                        </select>

                    </div>

                </section>


                {/* =================================================
                    GRID DE PRODUCTOS
                ================================================= */}

                <section className="new-grid-section">

                    {loading ? (

                        <div className="new-message">

                            <div className="new-spinner" />

                            <p>
                                Cargando
                                novedades...
                            </p>

                        </div>

                    ) : productos.length === 0 ? (

                        <div className="new-empty">

                            <h3>
                                Aún no hay
                                novedades
                            </h3>

                            <p>
                                Vuelve pronto:
                                estamos
                                preparando
                                nuevos
                                productos para
                                ti.
                            </p>

                            <Link
                                to="/products"
                                className="new-empty-action"
                            >
                                Ver todos los
                                productos
                            </Link>

                        </div>

                    ) : (

                        <div className="new-grid">

                            {productos.map(
                                (producto) => (

                                    <div
                                        key={
                                            producto.id_producto
                                        }
                                        className="new-card-wrapper"
                                    >

                                        <span className="new-badge">
                                            Nuevo
                                        </span>

                                        <ProductCard
                                            product={
                                                producto
                                            }
                                            onSelect={
                                                setSelectedProductId
                                            }
                                        />

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </section>


                {/* =================================================
                    CTA INFERIOR
                ================================================= */}

                <section className="new-cta">

                    <div className="new-cta-content">

                        <div className="new-cta-icon">

                            <Sparkles
                                size={22}
                                strokeWidth={
                                    1.8
                                }
                            />

                        </div>


                        <div className="new-cta-text">

                            <h3>
                                Nuevos productos
                                cada semana
                            </h3>

                            <p>
                                No te pierdas las
                                últimas novedades
                                y tendencias.
                            </p>

                        </div>

                    </div>


                    <Link
                        to="/products"
                        className="new-cta-button"
                    >

                        <span>
                            Ver todos los
                            productos
                        </span>

                        <ArrowRight
                            size={17}
                        />

                    </Link>

                </section>


            </div>


            {/* =================================================
                DETALLE DE PRODUCTO
            ================================================= */}

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


export default New;
