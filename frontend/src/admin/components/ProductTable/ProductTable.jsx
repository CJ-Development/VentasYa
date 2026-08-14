import { useEffect, useState } from "react";
import "./ProductTable.css";
import { Search, Eye, Pencil, Archive, RotateCcw } from "lucide-react";
import { getProducts, archiveProduct, reactivateProduct, getCategories } from "../../../services/adminService";

const API_ORIGIN = "http://127.0.0.1:8000";
const PLACEHOLDER = "https://via.placeholder.com/80?text=Sin+imagen";
const mediaUrl = (value) => value && !value.startsWith("http") ? `${API_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}` : value;

function obtenerPrimeraImagen(producto) {
    for (const variant of producto.variantes || []) {
        const principal = (variant.imagenes || []).find((img) => img.principal);
        if (principal?.imagen) return mediaUrl(principal.imagen);
        if (variant.imagenes?.[0]?.imagen) return mediaUrl(variant.imagenes[0].imagen);
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

    const cargar = async () => {
        try {
            const [{ data: products }, { data: cats }] = await Promise.all([getProducts(), getCategories()]);
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

    useEffect(() => { cargar(); }, [refreshKey]);

    const filtered = productos.filter((producto) => {
        const text = busqueda.toLowerCase();
        return (!text || producto.nombre.toLowerCase().includes(text) || (producto.slug || "").toLowerCase().includes(text))
            && (!filtroCategoria || producto.categoria?.id_categoria === Number(filtroCategoria))
            && (!filtroEstado || producto.estado === filtroEstado);
    });

    const archive = async (id) => {
        if (!window.confirm("¿Archivar este producto? No se eliminará, solo quedará oculto.")) return;
        try { await archiveProduct(id); await cargar(); } catch (err) { console.error(err); alert("No fue posible archivar el producto."); }
    };

    const reactivate = async (id) => {
        try { await reactivateProduct(id); await cargar(); } catch (err) { console.error(err); alert("No fue posible reactivar el producto."); }
    };

    if (loading) return <div className="product-table">Cargando productos...</div>;
    if (error) return <div className="product-table">{error}</div>;

    return (
        <div className="product-table">
            <div className="table-toolbar">
                <div className="table-search"><Search size={18} /><input placeholder="Buscar producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div>
                <div className="table-filters">
                    <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}><option value="">Todas las categorías</option>{categorias.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}</select>
                    <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}><option value="">Todos los estados</option><option value="activo">Activo</option><option value="inactivo">Inactivo</option><option value="archivado">Archivado</option></select>
                </div>
            </div>
            <table><thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>{filtered.length === 0 ? <tr><td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>No existen productos que coincidan con los filtros.</td></tr> : filtered.map((producto) => {
                    const image = obtenerPrimeraImagen(producto);
                    return <tr key={producto.id_producto}>
                        <td><div className="product-info"><div className="product-image"><img src={image || PLACEHOLDER} alt={producto.nombre} onError={(e) => { e.currentTarget.src = PLACEHOLDER; }} /></div><div><strong>{producto.nombre}</strong><span>{producto.slug}</span></div></div></td>
                        <td>{producto.categoria?.nombre || "Sin categoría"}</td>
                        <td>${Number(producto.precio).toLocaleString("es-CO")}</td>
                        <td><span className={`status ${producto.estado === "activo" ? "active" : producto.estado === "inactivo" ? "inactive" : "archived"}`}>{producto.estado}</span></td>
                        <td><div className="actions">
                            <button className="view" title="Ver vista previa" onClick={() => onPreview && onPreview(producto)}><Eye size={18} /></button>
                            <button className="edit" title="Editar" onClick={() => onEdit(producto)}><Pencil size={18} /></button>
                            {producto.estado === "archivado" ? <button className="reactivate" title="Reactivar" onClick={() => reactivate(producto.id_producto)}><RotateCcw size={18} /></button> : <button className="archive" title="Archivar" onClick={() => archive(producto.id_producto)}><Archive size={18} /></button>}
                        </div></td>
                    </tr>;
                })}</tbody>
            </table>
        </div>
    );
}

export default ProductTable;
