import "./ProductCard.css";
import NoImage from "../../../assets/images/no-image.png";
import { mediaUrl } from "../../../utils/mediaUrl";

import { Heart, ShoppingCart, Loader2 } from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useFavorites } from "../../../hooks/useFavorites";
import { useAuth } from "../../../hooks/useAuth";
import { useCart } from "../../../hooks/useCart";


function ProductCard({ product, onSelect }) {

    const navigate = useNavigate();

    const { usuario } = useAuth();
    const { isFavorite, toggle } = useFavorites();
    const { addItem } = useCart();

    const [isAdding, setIsAdding] = useState(false);


    /*
    ============================================================
    OBTENER IMAGEN DEL PRODUCTO
    ============================================================
    */

    const getProductImage = () => {

        if (!product) {
            return NoImage;
        }

        /*
        Primero buscamos la imagen principal
        dentro de las variantes.
        */

        const variantes = product.variantes || [];

        for (const variante of variantes) {

            const imagenes = variante.imagenes || [];

            const imagenPrincipal = imagenes.find(
                (imagen) => imagen.principal === true
            );

            if (imagenPrincipal?.imagen) {
                return mediaUrl(imagenPrincipal.imagen, NoImage);
            }

            /*
            Si no existe principal,
            usamos la primera imagen disponible.
            */

            if (imagenes[0]?.imagen) {
                return mediaUrl(imagenes[0].imagen, NoImage);
            }

        }


        /*
        Algunos endpoints pueden devolver
        la imagen directamente en el producto.
        */

        if (product.imagen) {
            return mediaUrl(product.imagen, NoImage);
        }

        if (product.imagen_url) {
            return mediaUrl(product.imagen_url, NoImage);
        }


        /*
        Si no existe ninguna imagen,
        mostramos NoImage.
        */

        return NoImage;

    };


    const imageUrl = getProductImage();


    /*
    ============================================================
    FAVORITOS
    ============================================================
    */

    const fav = isFavorite(product.id_producto);


    const handleToggleFavorite = async (e) => {

        e.stopPropagation();

        /*
        Favoritos deshabilitado para invitados
        */

        if (!usuario) {

            return;

        }

        await toggle(product.id_producto);

    };


    /*
    ============================================================
    ABRIR PRODUCTO
    ============================================================
    Por defecto navega a la página de detalle propia
    (/producto/:slug). Si el consumidor pasa explícitamente
    onSelect, mantenemos compatibilidad con el modal legacy.
    ============================================================
    */

    const handleOpenProduct = () => {

        if (onSelect) {

            onSelect(product.id_producto);

            return;

        }


        if (product?.slug) {

            navigate(`/producto/${product.slug}`);

        }

    };


    /*
    ============================================================
    AGREGAR AL CARRITO
    ============================================================
    */

    const handleAddToCart = async (e) => {

        e.stopPropagation();

        if (!product || isAdding) {
            return;
        }

        setIsAdding(true);

        try {
            /*
            Buscamos una variante que tenga stock.
            */

            const variante = product.variantes?.find(
                (v) => v.stock > 0
            );

            if (!variante) {

                console.log("[ProductCard] No hay variante con stock");
                alert(
                    "Este producto no tiene stock disponible."
                );

                setIsAdding(false);

                return;

            }

            /*
            ============================================================
            IMAGEN
            ============================================================
            */

            const imagen = getProductImage();

            /*
            ============================================================
            Payload para el carrito.
            ============================================================
            */

            const payload = {

                variante_id: variante.id_variante,

                sku: variante.sku,

                stock: variante.stock,


                producto_id: product.id_producto,

                producto_nombre: product.nombre,

                producto_slug: product.slug,


                producto_precio: product.precio,


                color:
                    variante.color?.nombre || "",

                talla:
                    variante.talla?.nombre || "",


                imagen,

                cantidad: 1,

            };

            console.log("[ProductCard] Llamando a addItem con payload:", payload);
            const result = await addItem(payload);
            console.log("[ProductCard] addItem retornó:", result);

            if (!result?.ok) {

                console.log("[ProductCard] addItem devolvió !ok");
                alert(
                    "No se pudo agregar al carrito. Intenta de nuevo."
                );

            }
        } catch (error) {
            console.error("[ProductCard] Error en handleAddToCart:", error);
            alert("Error al agregar al carrito. Intenta de nuevo.");
        } finally {
            console.log("[ProductCard] finally: Seteando isAdding = false");
            setIsAdding(false);
        }

    };


    /*
    ============================================================
    IMAGEN ROTA
    ============================================================
    */

    const handleImageError = (e) => {

        /*
        Evitamos un ciclo infinito
        si NoImage también tuviera algún problema.
        */

        if (
            e.currentTarget.src.includes("no-image")
        ) {

            return;

        }


        e.currentTarget.src = NoImage;

        e.currentTarget.classList.add(
            "is-fallback"
        );

    };


    /*
    ============================================================
    RENDER
    ============================================================
    */

    return (

        <article
            className="pc-card"
            onClick={handleOpenProduct}
        >

            {/* ==================================================
                IMAGEN
            ================================================== */}

            <div className="pc-image">

                <img
                    src={imageUrl}
                    alt={product.nombre}
                    onError={handleImageError}
                />


                {/* ==================================================
                    FAVORITO
                ================================================== */}

                <button
                    type="button"

                    className={`pc-favorite ${
                        fav ? "is-favorite" : ""
                    }`}

                    onClick={handleToggleFavorite}

                    title={
                        fav
                            ? "Quitar de favoritos"
                            : "Agregar a favoritos"
                    }

                    aria-label={
                        fav
                            ? "Quitar de favoritos"
                            : "Agregar a favoritos"
                    }
                >

                    <Heart
                        size={20}

                        strokeWidth={2}
                    />

                </button>


                {/* ==================================================
                    DESCUENTO
                ================================================== */}

                {Number(product.descuento) > 0 && (

                    <span className="pc-discount">

                        -{product.descuento}%

                    </span>

                )}

            </div>


            {/* ==================================================
                CONTENIDO
            ================================================== */}

            <div className="pc-content">


                {/* ==================================================
                    CATEGORÍA
                ================================================== */}

                <span className="pc-category">

                    {product.categoria?.nombre ||
                        product.categoria ||
                        "Categoría"}

                </span>


                {/* ==================================================
                    NOMBRE
                ================================================== */}

                <h3>

                    {product.nombre}

                </h3>


                {/* ==================================================
                    PRECIO
                ================================================== */}

                <div className="pc-price">

                    {product.precio_anterior && (

                        <span className="pc-price-old">

                            $
                            {Number(
                                product.precio_anterior
                            ).toLocaleString("es-CO")}

                        </span>

                    )}


                    <span className="pc-price-current">

                        $
                        {Number(
                            product.precio
                        ).toLocaleString("es-CO")}

                    </span>

                </div>


                {/* ==================================================
                    CARRITO
                ================================================== */}

                <button
                    type="button"
                    className="pc-cart-button"
                    onClick={handleAddToCart}
                    disabled={isAdding}
                >

                    {isAdding ? (
                        <Loader2 size={19} className="spin" />
                    ) : (
                        <ShoppingCart size={19} />
                    )}

                    <span>
                        {isAdding ? "Agregando..." : "Agregar"}
                    </span>

                </button>

            </div>

        </article>

    );

}


export default ProductCard;