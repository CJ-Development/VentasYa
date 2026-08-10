import "./ProductCard.css";
import NoImage from "../../../assets/images/no-image.png";

import { Heart, ShoppingCart } from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useFavorites } from "../../../hooks/useFavorites";
import { useAuth } from "../../../hooks/useAuth";
import { useCart } from "../../../hooks/useCart";

function ProductCard({ product, onSelect }) {

    const navigate = useNavigate();
    const { usuario } = useAuth();
    const { isFavorite, toggle } = useFavorites();
    const { addItem } = useCart();

    const handleOpenProduct = () => {
        if (onSelect) onSelect(product.id_producto);
    };

    const handleToggleFavorite = async (e) => {
        e.stopPropagation();
        if (!usuario) {
            navigate("/login?from=/");
            return;
        }
        await toggle(product.id_producto);
    };

    const handleAddToCart = async (e) => {
        e.stopPropagation();

        if (!product) return;

        // Tomamos la primera variante (o la marcada como principal)
        const variante = (product.variantes && product.variantes[0]) || null;

        if (!variante) {
            alert("Este producto aún no tiene variantes disponibles para la compra.");
            return;
        }

        const imagen =
            (variante.imagenes || []).find((i) => i.principal)?.imagen ||
            (variante.imagenes || [])[0]?.imagen ||
            null;

        const payload = {
            variante_id: variante.id_variante,
            sku: variante.sku,
            stock: variante.stock,
            producto_id: product.id_producto,
            producto_nombre: product.nombre,
            producto_slug: product.slug,
            producto_precio: product.precio,
            color: variante.color?.nombre || "",
            talla: variante.talla?.nombre || "",
            imagen,
            cantidad: 1,
        };

        const result = await addItem(payload);
        if (!result?.ok) {
            alert("No se pudo agregar al carrito. Intenta de nuevo.");
        }
    };

    const fav = isFavorite(product.id_producto);

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
                    className={`favorite-button ${fav ? "is-favorite" : ""}`}
                    onClick={handleToggleFavorite}
                    title={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
                    aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
                >

                    <Heart
                        size={18}
                        fill={fav ? "#dc2626" : "none"}
                        color={fav ? "#dc2626" : "currentColor"}
                    />

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
                    onClick={handleAddToCart}
                >

                    <ShoppingCart size={18} />
                    Agregar

                </button>

            </div>

        </article>
    );

}

export default ProductCard;
