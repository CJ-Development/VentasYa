    import { useEffect, useMemo, useState } from "react";

    import { getProducts } from "../../../services/adminService";
    import { getOffers } from "../../../services/clientService";

    import ProductCard from "../ProductCard/ProductCard";
    import ProductDetail from "../ProductDetail/ProductDetail";

    import "./FeaturedProducts.css";


    function FeaturedProducts() {

        const [products, setProducts] = useState([]);
        const [offers, setOffers] = useState([]);

        const [loading, setLoading] = useState(true);

        const [selectedProductId, setSelectedProductId] = useState(null);


        /*
        ============================================================
        CARGAR PRODUCTOS + OFERTAS
        ------------------------------------------------------------
        Traemos también las ofertas para calcular el descuento que
        se muestra en cada ProductCard (mismo patrón que Products.jsx).
        ============================================================
        */

        const loadProducts = async () => {

            try {

                const [prodRes, ofRes] = await Promise.all([

                    getProducts(),

                    // Si falla el endpoint de ofertas, seguimos mostrando
                    // productos sin descuento en vez de romper la home.
                    getOffers().catch(() => ({ data: [] })),

                ]);


                const activeProducts = Array.isArray(prodRes?.data)
                    ? prodRes.data.filter(
                        (product) => product.estado === "activo"
                    )
                    : [];

                setProducts(activeProducts);
                setOffers(Array.isArray(ofRes?.data) ? ofRes.data : []);

            } catch (error) {

                console.error(
                    "Error cargando productos destacados:",
                    error
                );

                setProducts([]);
                setOffers([]);

            } finally {

                setLoading(false);

            }

        };


        useEffect(() => {

            loadProducts();

        }, []);


        /*
        ============================================================
        DESCUENTO POR PRODUCTO
        ------------------------------------------------------------
        Solo consideramos ofertas vigentes (activa + ventana de
        fechas) y calculamos el porcentaje equivalente cuando el
        descuento es de tipo fijo, para que el badge siempre diga -X%.
        ============================================================
        */

        const descuentoPorProducto = useMemo(() => {

            const map = new Map();
            const ahora = Date.now();

            (offers || []).forEach((oferta) => {

                if (oferta.activa === false) return;

                const tsInicio = oferta.fecha_inicio
                    ? new Date(oferta.fecha_inicio).getTime()
                    : null;
                const tsFin = oferta.fecha_fin
                    ? new Date(oferta.fecha_fin).getTime()
                    : null;

                if (tsInicio !== null && Number.isNaN(tsInicio)) return;
                if (tsFin !== null && Number.isNaN(tsFin)) return;
                if (tsInicio !== null && ahora < tsInicio) return;
                if (tsFin !== null && ahora > tsFin) return;

                const id =
                    oferta.producto?.id_producto ||
                    oferta.producto_detalle?.id_producto ||
                    oferta.id_producto ||
                    oferta.producto_id ||
                    null;

                if (!id) return;

                const original = Number(
                    oferta.producto_detalle?.precio ??
                    oferta.producto?.precio ??
                    0
                );

                const valor = Number(oferta.valor);
                if (!Number.isFinite(valor) || valor <= 0) return;

                let porcentaje = 0;

                if (oferta.tipo_descuento === "porcentaje") {
                    porcentaje = Math.round(valor);
                } else if (original > 0) {
                    porcentaje = Math.round((valor / original) * 100);
                }

                if (porcentaje > 0) {
                    // Si ya hay una oferta con mejor descuento, la conservamos.
                    const actual = map.get(id);
                    if (!actual || porcentaje > actual) {
                        map.set(id, porcentaje);
                    }
                }

            });

            return map;

        }, [offers]);


        /*
        ============================================================
        PRODUCTOS CON DESCUENTO
        ------------------------------------------------------------
        Ordenamos los productos para mostrar primero los que tienen
        oferta activa y luego el resto, igual que hace /products.
        ============================================================
        */

        const productosOrdenados = useMemo(() => {

            return [...products].sort((a, b) => {

                const aDesc = descuentoPorProducto.get(a.id_producto) || 0;
                const bDesc = descuentoPorProducto.get(b.id_producto) || 0;

                return bDesc - aDesc;

            });

        }, [products, descuentoPorProducto]);


        /*
        ============================================================
        RENDER
        ============================================================
        */

        return (

            <section className="featured-products">

                {/* ==================================================
                    ENCABEZADO
                ================================================== */}

                <div className="featured-header">

                    <div className="featured-header-content">

                        <span className="featured-subtitle">
                            SELECCIÓN PARA TI
                        </span>

                        <h2>
                            Productos destacados
                        </h2>

                        <p>
                            Descubre los productos más vendidos
                            y recomendados de nuestra tienda.
                        </p>

                    </div>


                    <a
                        href="/products"
                        className="featured-view-all"
                    >
                        Ver todos
                        <span>→</span>
                    </a>

                </div>


                {/* ==================================================
                    CARGANDO
                ================================================== */}

                {loading && (

                    <div className="products-message">

                        <span className="products-loader"></span>

                        <p>
                            Cargando productos...
                        </p>

                    </div>

                )}


                {/* ==================================================
                    SIN PRODUCTOS
                ================================================== */}

                {!loading && productosOrdenados.length === 0 && (

                    <div className="products-message">

                        <p>
                            No hay productos registrados.
                        </p>

                    </div>

                )}


                {/* ==================================================
                    PRODUCTOS
                ================================================== */}

                {!loading && productosOrdenados.length > 0 && (

                    <div className="featured-products-grid">

                        {productosOrdenados.map((product) => (

                            <ProductCard
                                key={product.id_producto}
                                product={{
                                    ...product,
                                    descuento:
                                        descuentoPorProducto.get(
                                            product.id_producto
                                        ) ||
                                        product.descuento ||
                                        0
                                }}
                            />

                        ))}

                    </div>

                )}


                {/* ==================================================
                    MODAL PRODUCTO
                ================================================== */}

                {selectedProductId !== null && (

                    <ProductDetail
                        productId={selectedProductId}
                        onClose={() =>
                            setSelectedProductId(null)
                        }
                    />

                )}

            </section>

        );

    }


    export default FeaturedProducts;
