import { useEffect, useState } from "react";

import "./ProductTable.css";

import {
    Search,
    Eye,
    Pencil,
    Archive,
    RotateCcw,
} from "lucide-react";

import {
    getProducts,
    archiveProduct,
    reactivateProduct,
    getCategories,
} from "../../../services/adminService";

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='10' fill='%236b7280'%3ESin imagen%3C/text%3E%3C/svg%3E";

function obtenerPrimeraImagen(producto) {

    if (!producto.variantes || producto.variantes.length === 0) return null;

    for (const v of producto.variantes) {

        if (v.imagenes && v.imagenes.length > 0) {

            return v.imagenes[0].imagen;

        }

    }

    return null;

}

function ProductTable({ refreshKey, onEdit, onPreview }) {

    const [productos, setProductos] = useState([]);

    const [categorias, setCategorias] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [busqueda, setBusqueda] = useState("");

    const [filtroCategoria, setFiltroCategoria] = useState("");

    const [filtroEstado, setFiltroEstado] = useState("");

    const cargarProductos = async () => {

        try {

            const { data } = await getProducts();

            setProductos(data);

            setError(null);

        }

        catch (err) {

            console.error(err);

            setError("No fue posible cargar los productos.");

        }

        finally {

            setLoading(false);

        }

    };

    const cargarCategorias = async () => {

        try {

            const { data } = await getCategories();

            setCategorias(data);

        }

        catch (err) {

            console.error(err);

        }

    };

    useEffect(() => {

        cargarProductos();

        cargarCategorias();

    }, [refreshKey]);

    const archivarProducto = async (id) => {

        const confirmar = window.confirm(
            "¿Archivar este producto? No se eliminará, solo quedará oculto."
        );

        if (!confirmar) return;

        try {

            await archiveProduct(id);

            await cargarProductos();

        }

        catch (err) {

            console.error(err);

            alert("No fue posible archivar el producto.");

        }

    };

    const reactivarProducto = async (id) => {

        try {

            await reactivateProduct(id);

            await cargarProductos();

        }

        catch (err) {

            console.error(err);

            alert("No fue posible reactivar el producto.");

        }

    };

    const productosFiltrados = productos.filter((producto) => {

        const texto = busqueda.toLowerCase();

        const coincideBusqueda =
            !busqueda ||
            producto.nombre.toLowerCase().includes(texto) ||
            (producto.slug || "").toLowerCase().includes(texto);

        const coincideCategoria =
            !filtroCategoria ||
            producto.categoria?.id_categoria === Number(filtroCategoria);

        const coincideEstado =
            !filtroEstado ||
            producto.estado === filtroEstado;

        return coincideBusqueda && coincideCategoria && coincideEstado;

    });

    if (loading) {

        return <div className="product-table">Cargando productos...</div>;

    }

    if (error) {

        return <div className="product-table">{error}</div>;

    }

    return (

        <div className="product-table">

            <div className="table-toolbar">

                <div className="table-search">

                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />

                </div>

                <div className="table-filters">

                    <select
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                    >

                        <option value="">Todas las categorías</option>

                        {categorias.map((categoria) => (

                            <option
                                key={categoria.id_categoria}
                                value={categoria.id_categoria}
                            >

                                {categoria.nombre}

                            </option>

                        ))}

                    </select>

                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                    >

                        <option value="">Todos los estados</option>

                        <option value="activo">Activo</option>

                        <option value="inactivo">Inactivo</option>

                        <option value="archivado">Archivado</option>

                    </select>

                </div>

            </div>

            <table>

                <thead>

                    <tr>

                        <th>Producto</th>

                        <th>Categoría</th>

                        <th>Precio</th>

                        <th>Estado</th>

                        <th>Acciones</th>

                    </tr>

                </thead>

                <tbody>

                    {productosFiltrados.length === 0 ? (

                        <tr>

                            <td
                                colSpan="5"
                                style={{
                                    textAlign: "center",
                                    padding: "40px",
                                }}
                            >

                                No existen productos que coincidan con los filtros.

                            </td>

                        </tr>

                    ) : (

                        productosFiltrados.map((producto) => {

                            const imagen = obtenerPrimeraImagen(producto);

                            return (

                                <tr key={producto.id_producto}>

                                    <td>

                                        <div className="product-info">

                                            <div className="product-image">

                                                <img
                                                    src={imagen || PLACEHOLDER}
                                                    alt={producto.nombre}
                                                    onError={(e) => {
                                                        e.currentTarget.src = PLACEHOLDER;
                                                    }}
                                                />

                                            </div>

                                            <div>

                                                <strong>{producto.nombre}</strong>

                                                <span>{producto.slug}</span>

                                            </div>

                                        </div>

                                    </td>

                                    <td>

                                        {producto.categoria?.nombre || "Sin categoría"}

                                    </td>

                                    <td>

                                        ${Number(producto.precio).toLocaleString("es-CO")}

                                    </td>

                                    <td>

                                        <span
                                            className={
                                                `status ` +
                                                (producto.estado === "activo"
                                                    ? "active"
                                                    : producto.estado === "inactivo"
                                                        ? "inactive"
                                                        : "archived")
                                            }
                                        >

                                            {producto.estado}

                                        </span>

                                    </td>

                                    <td>

                                        <div className="actions">

                                            <button
                                                className="view"
                                                title="Ver vista previa"
                                                onClick={() => onPreview && onPreview(producto)}
                                            >

                                                <Eye size={18} />

                                            </button>

                                            <button
                                                className="edit"
                                                title="Editar"
                                                onClick={() => onEdit(producto)}
                                            >

                                                <Pencil size={18} />

                                            </button>

                                            {producto.estado === "archivado" ? (

                                                <button
                                                    className="reactivate"
                                                    title="Reactivar"
                                                    onClick={() => reactivarProducto(producto.id_producto)}
                                                >

                                                    <RotateCcw size={18} />

                                                </button>

                                            ) : (

                                                <button
                                                    className="archive"
                                                    title="Archivar"
                                                    onClick={() => archivarProducto(producto.id_producto)}
                                                >

                                                    <Archive size={18} />

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

    );

}

export default ProductTable;
