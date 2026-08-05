import { useEffect, useState } from "react";

import { getProducts } from "../../../services/adminService";
import ProductCard from "../ProductCard/ProductCard";
import ProductDetailImage from "../../../assets/images/no-detail.png";
import "./FeaturedProducts.css";

function FeaturedProducts() {

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);

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

                                            onClick={() => setSelectedProduct(product)}

                                            style={{ cursor: "pointer" }}

                                        >

                                            <ProductCard

                                                product={product}

                                            />

                                        </div>

                                    ))

                                }

                            </div>

                        )

            }

            {

                selectedProduct && (

                    <div

                        className="product-modal-overlay"

                        onClick={() => setSelectedProduct(null)}

                    >

                        <div

                            className="product-modal"

                            onClick={(e) => e.stopPropagation()}

                        >

                            <button

                                className="close-modal"

                                onClick={() => setSelectedProduct(null)}

                            >

                                ✕

                            </button>

                            <div className="modal-left">
                                <img
                                    src={ProductDetailImage}
                                    alt={selectedProduct.nombre}
                                />

                            </div>

                            <div className="modal-right">

                                <span className="modal-category">

                                    {selectedProduct.categoria?.nombre}

                                </span>

                                <h2>

                                    {selectedProduct.nombre}

                                </h2>

                                <h3>

                                    ${Number(selectedProduct.precio).toLocaleString("es-CO")}

                                </h3>

                                <p>

                                    {selectedProduct.descripcion}

                                </p>

                                <h4>

                                    Color

                                </h4>

                                <div className="colors">

                                    <span className="color black"></span>

                                    <span className="color gray"></span>

                                    <span className="color green"></span>

                                    <span className="color white"></span>

                                </div>

                                <h4>

                                    Talla

                                </h4>

                                <div className="sizes">

                                    <button>S</button>

                                    <button className="active">M</button>

                                    <button>L</button>

                                    <button>XL</button>

                                </div>

                                <button className="add-cart-modal">

                                    Agregar al carrito

                                </button>

                            </div>

                        </div>

                    </div>

                )

            }

        </section>

    );

}

export default FeaturedProducts;