import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";

import ProductCard from "./ProductCard/ProductCard";
import ProductDetail from "./ProductDetail/ProductDetail";

import { getProducts } from "../../services/adminService";
import { getCategories } from "../../services/adminService";
import { getOffers } from "../../services/clientService";

import "./Products.css";

const formatearPesos = (valor) => {
    const n = Number(valor);
    if (Number.isNaN(n)) return "$0";
    return `$${n.toLocaleString("es-CO")}`;
};

function Products() {

    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get("q") || "";
    const categoriaParam = searchParams.get("categoria") || "";
    const soloOfertas = searchParams.get("oferta") === "1";

    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [ofertas, setOfertas] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedProductId, setSelectedProductId] = useState(null);
    const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

    // Filtros locales
    const [busqueda, setBusqueda] = useState(query);
    const [categoria, setCategoria] = useState(categoriaParam);
    const [precioMin, setPrecioMin] = useState("");
    const [precioMax, setPrecioMax] = useState("");
    const [soloConDescuento, setSoloConDescuento] = useState(soloOfertas);
    const [orden, setOrden] = useState("relevancia");

    // Carga inicial
    useEffect(() => {
        const cargar = async () => {
            try {
                setLoading(true);
                const [prodRes, catRes, ofRes] = await Promise.all([
                    getProducts(),
                    getCategories(),
                    getOffers().catch(() => ({ data: [] })),
                ]);
                const data = prodRes.data || [];
                setProductos(Array.isArray(data) ? data.filter((p) => p.estado === "activo") : []);
                setCategorias(catRes.data || []);
                setOfertas(Array.isArray(ofRes.data) ? ofRes.data : []);
            } catch (err) {
                console.error("Error cargando productos:", err);
            } finally {
                setLoading(false);
            }
        };
        cargar();
    }, []);

    // Sincronizar inputs con query params
    useEffect(() => {
        setBusqueda(query);
    }, [query]);

    useEffect(() => {
        setCategoria(categoriaParam);
    }, [categoriaParam]);

    useEffect(() => {
        setSoloConDescuento(soloOfertas);
    }, [soloOfertas]);

    // IDs de productos en oferta
    const productosEnOferta = useMemo(() => {
        const set = new Set();
        (ofertas || []).forEach((o) => {
            const id =
                o.producto?.id_producto ||
                o.producto_detalle?.id_producto ||
                o.id_producto ||
                o.producto_id ||
                null;
            if (id) set.add(id);
        });
        return set;
    }, [ofertas]);

    // Descuento por producto (cuando el backend lo expone)
    const descuentoPorProducto = useMemo(() => {
        const map = new Map();
        (ofertas || []).forEach((o) => {
            const id =
                o.producto?.id_producto ||
                o.producto_detalle?.id_producto ||
                o.id_producto ||
                o.producto_id ||
                null;
            if (id) {
                const pct = Number(o.porcentaje || o.descuento || 0);
                if (pct > 0) map.set(id, pct);
            }
        });
        return map;
    }, [ofertas]);

    // Aplicar filtros
    const productosFiltrados = useMemo(() => {
        let lista = [...productos];

        if (busqueda.trim()) {
            const t = busqueda.toLowerCase();
            lista = lista.filter((p) => (p.nombre || "").toLowerCase().includes(t));
        }

        if (categoria) {
            const idCat = Number(categoria);
            lista = lista.filter((p) => {
                const catId = p.categoria?.id_categoria ?? p.categoria;
                return Number(catId) === idCat;
            });
        }

        if (precioMin !== "" && !Number.isNaN(Number(precioMin))) {
            lista = lista.filter((p) => Number(p.precio) >= Number(precioMin));
        }
        if (precioMax !== "" && !Number.isNaN(Number(precioMax))) {
            lista = lista.filter((p) => Number(p.precio) <= Number(precioMax));
        }

        if (soloConDescuento) {
            lista = lista.filter((p) => productosEnOferta.has(p.id_producto) || (p.descuento && Number(p.descuento) > 0));
        }

        switch (orden) {
            case "precio-asc":
                lista.sort((a, b) => Number(a.precio) - Number(b.precio));
                break;
            case "precio-desc":
                lista.sort((a, b) => Number(b.precio) - Number(a.precio));
                break;
            case "nombre":
                lista.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
                break;
            default:
                break;
        }

        return lista;
    }, [productos, busqueda, categoria, precioMin, precioMax, soloConDescuento, productosEnOferta, orden]);

    const aplicarFiltros = () => {
        const params = new URLSearchParams();
        if (busqueda.trim()) params.set("q", busqueda.trim());
        if (categoria) params.set("categoria", categoria);
        if (soloConDescuento) params.set("oferta", "1");
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
        busqueda || categoria || precioMin || precioMax || soloConDescuento || orden !== "relevancia";

    const panelFiltros = (
        <aside className="filters-panel">
            <div className="filters-header">
                <h3>Filtros</h3>
                {hayFiltrosActivos && (
                    <button type="button" className="filters-clear" onClick={limpiarFiltros}>
                        Limpiar
                    </button>
                )}
            </div>

            <div className="filter-group">
                <label>Buscar</label>
                <input
                    type="text"
                    placeholder="¿Qué buscas?"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            <div className="filter-group">
                <label>Categoría</label>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                    <option value="">Todas las categorías</option>
                    {categorias.map((c) => (
                        <option key={c.id_categoria} value={c.id_categoria}>
                            {c.nombre}
                        </option>
                    ))}
                </select>
            </div>

            <div className="filter-group">
                <label>Precio</label>
                <div className="filter-price">
                    <input
                        type="number"
                        min="0"
                        placeholder="Mín."
                        value={precioMin}
                        onChange={(e) => setPrecioMin(e.target.value)}
                    />
                    <span>—</span>
                    <input
                        type="number"
                        min="0"
                        placeholder="Máx."
                        value={precioMax}
                        onChange={(e) => setPrecioMax(e.target.value)}
                    />
                </div>
            </div>

            <div className="filter-group">
                <label className="filter-check">
                    <input
                        type="checkbox"
                        checked={soloConDescuento}
                        onChange={(e) => setSoloConDescuento(e.target.checked)}
                    />
                    <span>Solo con descuento</span>
                </label>
            </div>

            <button type="button" className="filters-apply" onClick={aplicarFiltros}>
                Aplicar filtros
            </button>
        </aside>
    );

    return (
        <main className="products-page">
            <div className="products-container">
                <header className="products-header">
                    <div>
                        <span className="products-eyebrow">Catálogo</span>
                        <h1>
                            {query
                                ? <>Resultados para <em>"{query}"</em></>
                                : categoria
                                    ? categorias.find((c) => String(c.id_categoria) === categoria)?.nombre || "Productos"
                                    : "Todos los productos"}
                        </h1>
                        <p>
                            {productosFiltrados.length} producto{productosFiltrados.length === 1 ? "" : "s"} disponible{productosFiltrados.length === 1 ? "" : "s"}.
                        </p>
                    </div>

                    <div className="products-toolbar">
                        <button
                            type="button"
                            className="products-filter-toggle"
                            onClick={() => setFiltrosAbiertos(true)}
                        >
                            <SlidersHorizontal size={18} />
                            Filtros
                        </button>

                        <div className="products-sort">
                            <label>Ordenar:</label>
                            <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                                <option value="relevancia">Relevancia</option>
                                <option value="precio-asc">Precio: menor a mayor</option>
                                <option value="precio-desc">Precio: mayor a menor</option>
                                <option value="nombre">Nombre A-Z</option>
                            </select>
                        </div>
                    </div>
                </header>

                <div className="products-layout">
                    {panelFiltros}

                    <section className="products-content">
                        {loading ? (
                            <div className="products-message">Cargando productos...</div>
                        ) : productosFiltrados.length === 0 ? (
                            <div className="products-empty">
                                <h3>No encontramos productos</h3>
                                <p>Prueba ajustando los filtros o usando otras palabras clave.</p>
                                <button type="button" onClick={limpiarFiltros} className="filters-apply">
                                    Limpiar filtros
                                </button>
                            </div>
                        ) : (
                            <div className="products-grid">
                                {productosFiltrados.map((p) => (
                                    <ProductCard
                                        key={p.id_producto}
                                        product={{
                                            ...p,
                                            descuento: descuentoPorProducto.get(p.id_producto) || p.descuento || 0,
                                        }}
                                        onSelect={setSelectedProductId}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {filtrosAbiertos && (
                <div className="filters-modal" onClick={() => setFiltrosAbiertos(false)}>
                    <div className="filters-modal-inner" onClick={(e) => e.stopPropagation()}>
                        <div className="filters-modal-head">
                            <h3>Filtros</h3>
                            <button
                                type="button"
                                onClick={() => setFiltrosAbiertos(false)}
                                aria-label="Cerrar filtros"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        {panelFiltros}
                    </div>
                </div>
            )}

            {selectedProductId !== null && (
                <ProductDetail
                    productId={selectedProductId}
                    onClose={() => setSelectedProductId(null)}
                />
            )}
        </main>
    );
}

export default Products;
