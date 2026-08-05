import "./ProductCard.css";
import NoImage from "../../../assets/images/no-image.png";

import { Heart, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ProductCard({ product }) {

    const navigate = useNavigate();

    const handleOpenProduct = () => {

        navigate(`/producto/${product.id_producto}`);

    };

    return (

        <article
            className="product-card"
            onClick={handleOpenProduct}
        >

            <div className="product-image">

                <img
                    src={NoImage}
                    alt={product.nombre}
                />

                <button
                    className="favorite-button"
                    onClick={(e) => e.stopPropagation()}
                >

                    <Heart size={18} />

                </button>

                {

                    product.descuento > 0 && (

                        <span className="discount-badge">

                            -{product.descuento}%

                        </span>

                    )

                }

            </div>

            <div className="product-content">

                <span className="product-category">

                    {

                        product.categoria?.nombre ||

                        product.categoria ||

                        "Categoría"

                    }

                </span>

                <h3>

                    {product.nombre}

                </h3>

                <div className="product-price">

                    {

                        product.precio_anterior && (

                            <span className="old-price">

                                ${Number(product.precio_anterior).toLocaleString("es-CO")}

                            </span>

                        )

                    }

                    <span className="current-price">

                        ${Number(product.precio).toLocaleString("es-CO")}

                    </span>

                </div>

                <button
                    className="cart-button"
                    onClick={(e) => {

                        e.stopPropagation();

                        // Próximamente:
                        // Agregar al carrito

                    }}
                >

                    <ShoppingCart size={18} />

                    Agregar

                </button>

            </div>

        </article>

    );

}

export default ProductCard;