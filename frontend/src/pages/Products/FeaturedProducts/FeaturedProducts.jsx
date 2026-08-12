    import { useEffect, useState } from "react";

    import { getProducts } from "../../../services/adminService";

    import ProductCard from "../ProductCard/ProductCard";
    import ProductDetail from "../ProductDetail/ProductDetail";

    import "./FeaturedProducts.css";


    function FeaturedProducts() {

        const [products, setProducts] = useState([]);

        const [loading, setLoading] = useState(true);

        const [selectedProductId, setSelectedProductId] = useState(null);


        /*
        ============================================================
        CARGAR PRODUCTOS
        ============================================================
        */

        const loadProducts = async () => {

            try {

                const { data } = await getProducts();

                const activeProducts = Array.isArray(data)
                    ? data.filter(
                        (product) =>
                            product.estado === "activo"
                    )
                    : [];

                setProducts(activeProducts);

            } catch (error) {

                console.error(
                    "Error cargando productos destacados:",
                    error
                );

                setProducts([]);

            } finally {

                setLoading(false);

            }

        };


        useEffect(() => {

            loadProducts();

        }, []);


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

                {!loading && products.length === 0 && (

                    <div className="products-message">

                        <p>
                            No hay productos registrados.
                        </p>

                    </div>

                )}


                {/* ==================================================
                    PRODUCTOS
                ================================================== */}

                {!loading && products.length > 0 && (

                    <div className="featured-products-grid">

                        {products.map((product) => (

                            <ProductCard
                                key={product.id_producto}
                                product={product}
                                onSelect={
                                    setSelectedProductId
                                }
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