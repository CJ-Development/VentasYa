import { useEffect, useMemo, useState } from "react";
import "./ProductTable.css";

import {
    Search,
    Pencil,
    Archive,
    RotateCcw,
    SlidersHorizontal,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Package,
    CheckCircle2,
    AlertTriangle,
    XCircle,
} from "lucide-react";

import {
    getProducts,
    archiveProduct,
    reactivateProduct,
    getCategories,
} from "../../../services/adminService";

const API_ORIGIN = "http://127.0.0.1:8000";

const PLACEHOLDER = "https://via.placeholder.com/80?text=Sin+imagen";

const mediaUrl = (value) => {
    if (!value) return null;

    return !value.startsWith("http")
        ? `${API_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`
        : value;
};

function obtenerPrimeraImagen(producto) {
    for (const variant of producto.variantes || []) {
        const principal = (variant.imagenes || []).find(
            (img) => img.principal
        );

        if (principal?.imagen) {
            return mediaUrl(principal.imagen);
        }

        if (variant.imagenes?.[0]?.imagen) {
            return mediaUrl(variant.imagenes[0].imagen);
        }
    }

    return null;
}

function obtenerStock(producto) {
    if (producto.stock !== undefined && producto.stock !== null) {
        return Number(producto.stock) || 0;
    }

    if (producto.stock_total !== undefined && producto.stock_total !== null) {
        return Number(producto.stock_total) || 0;
    }

    if (Array.isArray(producto.variantes)) {
        return producto.variantes.reduce((total, variante) => {
            const stock =
                variante.stock ??
                variante.stock_actual ??
                variante.cantidad_stock ??
                variante.inventario ??
                0;

            return total + (Number(stock) || 0);
        }, 0);
    }

    return 0;
}

function ProductTable({ refreshKey, onEdit, onPreview }) {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [busqueda, setBusqueda] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");

    const [orden, setOrden] = useState("recientes");

    const [pagina, setPagina] = useState(1);

    const productosPorPagina = 8;

    const cargar = async () => {
        try {
            setLoading(true);

            const [{ data: products }, { data: cats }] =
                await Promise.all([
                    getProducts(),
                    getCategories(),
                ]);

            setProductos(products || []);
            setCategorias(cats || []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("No fue posible cargar los productos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar();
    }, [refreshKey]);

    useEffect(() => {
        setPagina(1);
    }, [busqueda, filtroCategoria, filtroEstado, orden]);

    const productosProcesados = useMemo(() => {
        let resultado = productos.filter((producto) => {
            const text = busqueda.trim().toLowerCase();

            const coincideBusqueda =
                !text ||
                producto.nombre?.toLowerCase().includes(text) ||
                producto.slug?.toLowerCase().includes(text);

            const coincideCategoria =
                !filtroCategoria ||
                producto.categoria?.id_categoria === Number(filtroCategoria);

            const coincideEstado =
                !filtroEstado ||
                producto.estado === filtroEstado;

            return (
                coincideBusqueda &&
                coincideCategoria &&
                coincideEstado
            );
        });

        resultado = [...resultado];

        if (orden === "nombre") {
            resultado.sort((a, b) =>
                (a.nombre || "").localeCompare(b.nombre || "")
            );
        }

        if (orden === "precio-menor") {
            resultado.sort(
                (a, b) =>
                    Number(a.precio || 0) - Number(b.precio || 0)
            );
        }

        if (orden === "precio-mayor") {
            resultado.sort(
                (a, b) =>
                    Number(b.precio || 0) - Number(a.precio || 0)
            );
        }

        if (orden === "stock") {
            resultado.sort(
                (a, b) =>
                    obtenerStock(b) - obtenerStock(a)
            );
        }

        return resultado;
    }, [
        productos,
        busqueda,
        filtroCategoria,
        filtroEstado,
        orden,
    ]);

    const totalProductos = productos.length;

    const totalActivos = productos.filter(
        (producto) => producto.estado === "activo"
    ).length;

    const totalStockBajo = productos.filter((producto) => {
        const stock = obtenerStock(producto);

        return stock > 0 && stock <= 10;
    }).length;

    const totalSinStock = productos.filter(
        (producto) => obtenerStock(producto) <= 0
    ).length;

    const totalPaginas = Math.max(
        1,
        Math.ceil(
            productosProcesados.length / productosPorPagina
        )
    );

    const productosPagina = productosProcesados.slice(
        (pagina - 1) * productosPorPagina,
        pagina * productosPorPagina
    );

    const desde =
        productosProcesados.length === 0
            ? 0
            : (pagina - 1) * productosPorPagina + 1;

    const hasta = Math.min(
        pagina * productosPorPagina,
        productosProcesados.length
    );

    const cambiarPagina = (numero) => {
        if (
            numero < 1 ||
            numero > totalPaginas
        ) {
            return;
        }

        setPagina(numero);
    };

    const archive = async (id) => {
        if (
            !window.confirm(
                "¿Archivar este producto? No se eliminará, solo quedará oculto."
            )
        ) {
            return;
        }

        try {
            await archiveProduct(id);
            await cargar();
        } catch (err) {
            console.error(err);
            alert("No fue posible archivar el producto.");
        }
    };

    const reactivate = async (id) => {
        try {
            await reactivateProduct(id);
            await cargar();
        } catch (err) {
            console.error(err);
            alert("No fue posible reactivar el producto.");
        }
    };

    const getStockClass = (stock) => {
        if (stock <= 0) return "stock-empty";
        if (stock <= 10) return "stock-low";

        return "stock-good";
    };

    const getStockText = (stock) => {
        return `${stock} uds`;
    };

    if (loading) {
        return (
            <div className="product-table loading-state">
                Cargando productos...
            </div>
        );
    }

    if (error) {
        return (
            <div className="product-table error-state">
                {error}
            </div>
        );
    }

    return (
        <div className="product-table">

            {/* =========================
                ESTADÍSTICAS
            ========================= */}

            <div className="product-statistics">

                <div className="product-stat-card">
                    <div className="stat-icon stat-icon-products">
                        <Package size={19} />
                    </div>

                    <div className="stat-content">
                        <strong>{totalProductos}</strong>
                        <span>Productos</span>
                        <small>Total registrados</small>
                    </div>
                </div>

                <div className="product-stat-card">
                    <div className="stat-icon stat-icon-active">
                        <CheckCircle2 size={19} />
                    </div>

                    <div className="stat-content">
                        <strong>{totalActivos}</strong>
                        <span>Activos</span>
                        <small>Productos publicados</small>
                    </div>
                </div>

                <div className="product-stat-card">
                    <div className="stat-icon stat-icon-warning">
                        <AlertTriangle size={19} />
                    </div>

                    <div className="stat-content">
                        <strong>{totalStockBajo}</strong>
                        <span>Bajo stock</span>
                        <small>Menos de 10 unidades</small>
                    </div>
                </div>

                <div className="product-stat-card">
                    <div className="stat-icon stat-icon-danger">
                        <XCircle size={19} />
                    </div>

                    <div className="stat-content">
                        <strong>{totalSinStock}</strong>
                        <span>Sin stock</span>
                        <small>Agotados</small>
                    </div>
                </div>

            </div>

            {/* =========================
                CONTENEDOR DE TABLA
            ========================= */}

            <div className="product-table-card">

                {/* TOOLBAR */}

                <div className="table-toolbar">

                    <div className="table-search">

                        <Search size={18} />

                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={busqueda}
                            onChange={(e) =>
                                setBusqueda(e.target.value)
                            }
                        />

                    </div>

                    <div className="table-filters">

                        <div className="select-wrapper">

                            <select
                                value={filtroCategoria}
                                onChange={(e) =>
                                    setFiltroCategoria(e.target.value)
                                }
                            >
                                <option value="">
                                    Todas las categorías
                                </option>

                                {categorias.map((categoria) => (
                                    <option
                                        key={categoria.id_categoria}
                                        value={categoria.id_categoria}
                                    >
                                        {categoria.nombre}
                                    </option>
                                ))}
                            </select>

                            <ChevronDown size={16} />

                        </div>

                        <div className="select-wrapper">

                            <select
                                value={filtroEstado}
                                onChange={(e) =>
                                    setFiltroEstado(e.target.value)
                                }
                            >
                                <option value="">
                                    Todos los estados
                                </option>

                                <option value="activo">
                                    Activo
                                </option>

                                <option value="inactivo">
                                    Inactivo
                                </option>

                                <option value="archivado">
                                    Archivado
                                </option>

                            </select>

                            <ChevronDown size={16} />

                        </div>

                        <div className="select-wrapper order-select">

                            <ArrowUpDown size={15} />

                            <select
                                value={orden}
                                onChange={(e) =>
                                    setOrden(e.target.value)
                                }
                            >
                                <option value="recientes">
                                    Ordenar por
                                </option>

                                <option value="nombre">
                                    Nombre
                                </option>

                                <option value="precio-menor">
                                    Precio menor
                                </option>

                                <option value="precio-mayor">
                                    Precio mayor
                                </option>

                                <option value="stock">
                                    Mayor stock
                                </option>

                            </select>

                            <ChevronDown size={15} />

                        </div>

                        <button
                            type="button"
                            className="filter-button"
                            onClick={() => {
                                setBusqueda("");
                                setFiltroCategoria("");
                                setFiltroEstado("");
                                setOrden("recientes");
                            }}
                        >
                            <SlidersHorizontal size={16} />
                            <span>Filtros</span>
                        </button>

                    </div>

                </div>

                {/* TABLA */}

                <div className="table-scroll">

                    <table>

                        <thead>
                            <tr>
                                <th className="product-column">
                                    Producto
                                </th>

                                <th className="category-column">
                                    <span className="category-header">
                                        <span className="category-header-line">
                                            Categoría padre
                                        </span>
                                        <span className="category-header-line">
                                            Subcategoría
                                        </span>
                                    </span>
                                </th>

                                <th>
                                    Precio
                                </th>

                                <th>
                                    Stock
                                </th>

                                <th>
                                    Estado
                                </th>

                                <th className="actions-column">
                                    Acciones
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            {productosPagina.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan="6"
                                        className="empty-products"
                                    >
                                        No existen productos que
                                        coincidan con los filtros.
                                    </td>
                                </tr>

                            ) : (

                                productosPagina.map((producto) => {

                                    const image =
                                        obtenerPrimeraImagen(producto);

                                    const stock =
                                        obtenerStock(producto);

                                    return (
                                        <tr
                                            key={producto.id_producto}
                                        >

                                            <td className="product-column">

                                                <div className="product-info">

                                                    <div className="product-image">

                                                        <img
                                                            src={
                                                                image ||
                                                                PLACEHOLDER
                                                            }
                                                            alt={
                                                                producto.nombre
                                                            }
                                                            onError={(e) => {
                                                                e.currentTarget.src =
                                                                    PLACEHOLDER;
                                                            }}
                                                        />

                                                    </div>

                                                    <div className="product-name">

                                                        <strong>
                                                            {
                                                                producto.nombre
                                                            }
                                                        </strong>

                                                        <span>
                                                            SKU:{" "}
                                                            {
                                                                producto.slug ||
                                                                `PRO-${producto.id_producto}`
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>

                                            <td>
                                                <div className="category-cell">
                                                    {producto.categoria
                                                        ?.id_categoria_padre ||
                                                    producto.categoria
                                                        ?.categoria_padre ? (
                                                        <span className="category-parent">
                                                            {
                                                                producto
                                                                    .categoria
                                                                    ?.categoria_padre
                                                                    ?.nombre ||
                                                                producto
                                                                    .categoria
                                                                    ?.nombre ||
                                                                "Sin categoría"
                                                            }
                                                        </span>
                                                    ) : (
                                                        <span className="category-parent">
                                                            {
                                                                producto
                                                                    .categoria
                                                                    ?.nombre ||
                                                                "Sin categoría"
                                                            }
                                                        </span>
                                                    )}

                                                    {producto.categoria
                                                        ?.id_categoria_padre ||
                                                    producto.categoria
                                                        ?.categoria_padre ? (
                                                        <span className="category-sub">
                                                            {
                                                                producto
                                                                    .categoria
                                                                    ?.nombre
                                                            }
                                                        </span>
                                                    ) : (
                                                        <span className="category-sub category-sub-empty">
                                                            —
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="price-cell">
                                                $
                                                {Number(
                                                    producto.precio || 0
                                                ).toLocaleString(
                                                    "es-CO"
                                                )}
                                            </td>

                                            <td>

                                                <span
                                                    className={`stock-value ${getStockClass(
                                                        stock
                                                    )}`}
                                                >
                                                    {getStockText(stock)}
                                                </span>

                                            </td>

                                            <td>

                                                <span
                                                    className={`status ${
                                                        producto.estado ===
                                                        "activo"
                                                            ? "active"
                                                            : producto.estado ===
                                                              "inactivo"
                                                            ? "inactive"
                                                            : "archived"
                                                    }`}
                                                >
                                                    {
                                                        producto.estado
                                                    }
                                                </span>

                                            </td>

                                            <td className="actions-column">

                                                <div className="actions">

                                                    <button
                                                        type="button"
                                                        className="action-button edit"
                                                        title="Editar"
                                                        onClick={() =>
                                                            onEdit(
                                                                producto
                                                            )
                                                        }
                                                    >
                                                        <Pencil size={17} />
                                                    </button>

                                                    {producto.estado ===
                                                    "archivado" ? (

                                                        <button
                                                            type="button"
                                                            className="action-button reactivate"
                                                            title="Reactivar"
                                                            onClick={() =>
                                                                reactivate(
                                                                    producto.id_producto
                                                                )
                                                            }
                                                        >
                                                            <RotateCcw
                                                                size={17}
                                                            />
                                                        </button>

                                                    ) : (

                                                        <button
                                                            type="button"
                                                            className="action-button archive"
                                                            title="Archivar"
                                                            onClick={() =>
                                                                archive(
                                                                    producto.id_producto
                                                                )
                                                            }
                                                        >
                                                            <Archive
                                                                size={17}
                                                            />
                                                        </button>

                                                    )}

                                                </div>

                                            </td>

                                        </tr>
                                    );
                                })

                            )}

                        </tbody>

                    </table>

                </div>

                {/* FOOTER / PAGINACIÓN */}

                <div className="table-footer">

                    <span className="results-count">
                        Mostrando{" "}
                        <strong>
                            {desde}-{hasta}
                        </strong>{" "}
                        de{" "}
                        <strong>
                            {productosProcesados.length}
                        </strong>{" "}
                        productos
                    </span>

                    {totalPaginas > 1 && (

                        <div className="pagination">

                            <button
                                type="button"
                                className="pagination-button"
                                disabled={pagina === 1}
                                onClick={() =>
                                    cambiarPagina(pagina - 1)
                                }
                            >
                                <ChevronLeft size={17} />
                            </button>

                            {Array.from(
                                {
                                    length: Math.min(
                                        totalPaginas,
                                        5
                                    ),
                                },
                                (_, index) => index + 1
                            ).map((numero) => (

                                <button
                                    key={numero}
                                    type="button"
                                    className={`pagination-button ${
                                        pagina === numero
                                            ? "current"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        cambiarPagina(numero)
                                    }
                                >
                                    {numero}
                                </button>

                            ))}

                            <button
                                type="button"
                                className="pagination-button"
                                disabled={
                                    pagina === totalPaginas
                                }
                                onClick={() =>
                                    cambiarPagina(pagina + 1)
                                }
                            >
                                <ChevronRight size={17} />
                            </button>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}

export default ProductTable;