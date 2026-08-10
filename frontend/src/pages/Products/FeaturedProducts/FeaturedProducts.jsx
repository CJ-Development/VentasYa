import { useEffect, useState } from "react";

import { getProducts } from "../../../services/adminService";
import ProductCard from "../ProductCard/ProductCard";
import ProductDetail from "../ProductDetail/ProductDetail";
import "./FeaturedProducts.css";

function FeaturedProducts() {

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProductId, setSelectedProductId] = useState(null);

    const loadProducts = async () => {

        try {

            const { data } = await getProducts();

            const activeProducts = data.filter(
                product => product.estado === "activo"
            );

            setProducts(activeProducts);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        loadProducts();

    }, []);

    return (

        <section className="featured-products">

            <div className="featured-header">

                <div>

                    <span className="featured-subtitle">

                        SELECCIÓN PARA TI

                    </span>

                    <h2>

                        Productos destacados

                    </h2>

                    <p>

                        Descubre los productos más vendidos y recomendados de nuestra tienda.

                    </p>

                </div>

                <a href="/products">

                    Ver todos →

                </a>

            </div>

            {

                loading ?

                    (

                        <div className="products-message">

                            Cargando productos...

                        </div>

                    )

                    :

                    products.length === 0 ?

                        (

                            <div className="products-message">

                                No hay productos registrados.

                            </div>

                        )

                        :

                        (

                            <div className="products-grid">

                                {

                                    products.map(product => (

                                        <div
                                            key={product.id_producto}
                                            style={{ cursor: "pointer" }}
                                        >

                                            <ProductCard
                                                product={product}
                                                onSelect={setSelectedProductId}
                                            />

                                        </div>

                                    ))

                                }

                            </div>

                        )

            }

            {

                selectedProductId !== null && (

                    <ProductDetail
                        productId={selectedProductId}
                        onClose={() => setSelectedProductId(null)}
                    />

                )

            }

        </section>

    );

}

export default FeaturedProducts;