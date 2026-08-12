import { Link, useNavigate } from "react-router-dom";
import {
    Loader2,
    Minus,
    Plus,
    ShoppingCart,
    Trash2,
    Tag,
    Truck,
    ShieldCheck,
    LockKeyhole,
    ChevronRight,
    PackageCheck,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";

import NoImage from "../../assets/images/no-image.png";

import "./Cart.css";

const formatearPesos = (valor) => {
    const numero = Number(valor);

    if (Number.isNaN(numero)) return "$0";

    return `$${numero.toLocaleString("es-CO")}`;
};

function Cart() {

    const { usuario } = useAuth();

    const {
        items,
        loading,
        total,
        updateQty,
        removeItem,
    } = useCart();

    const navigate = useNavigate();

    const cambiarCantidad = (item, delta) => {

        const nuevaCantidad = Math.max(
            1,
            Number(item.cantidad || 1) + delta
        );

        if (nuevaCantidad === Number(item.cantidad)) return;

        updateQty(item, nuevaCantidad);
    };

    const eliminarItem = (item) => {

        const confirmar = window.confirm(
            "¿Eliminar este producto del carrito?"
        );

        if (!confirmar) return;

        removeItem(item);
    };

    const finalizarCompra = () => {

        if (!usuario) {
            navigate("/login?from=/checkout", {
                replace: false,
            });

            return;
        }

        navigate("/checkout");
    };

    /*
     * META PARA ENVÍO GRATIS
     *
     * Puedes cambiar este valor cuando definas
     * la regla definitiva del ecommerce.
     */
    const envioGratisDesde = 999900;

    const faltanteEnvioGratis = Math.max(
        envioGratisDesde - Number(total || 0),
        0
    );

    const progresoEnvio = Math.min(
        (Number(total || 0) / envioGratisDesde) * 100,
        100
    );

    /*
     * CARRITO SIN SESIÓN
     */

    if (!usuario) {

        return (
            <main className="cart-page">

                <div className="cart-container">

                    <div className="cart-breadcrumb">
                        <Link to="/">Inicio</Link>
                        <ChevronRight size={15} />
                        <span>Carrito</span>
                    </div>

                    <header className="cart-header">

                        <div>
                            <h1>Tu carrito</h1>

                            <p>
                                Revisa los productos que has seleccionado.
                            </p>
                        </div>

                    </header>

                    <div className="cart-empty">

                        <div className="cart-empty-icon">
                            <ShoppingCart size={42} />
                        </div>

                        <h2>
                            Tu carrito tiene productos sin guardar
                        </h2>

                        <p>
                            Para conservarlos en tu cuenta y finalizar
                            la compra, inicia sesión o crea una cuenta.
                        </p>

                        <div className="cart-empty-actions">

                            <Link
                                to="/login?from=/cart"
                                className="cart-primary-button"
                            >
                                Iniciar sesión y conservar mi carrito
                            </Link>

                            <Link
                                to="/"
                                className="cart-secondary-link"
                            >
                                Seguir explorando
                            </Link>

                        </div>

                    </div>

                </div>

            </main>
        );
    }

    /*
     * CARRITO
     */

    return (

        <main className="cart-page">

            <div className="cart-container">

                <div className="cart-breadcrumb">

                    <Link to="/">
                        Inicio
                    </Link>

                    <ChevronRight size={15} />

                    <span>
                        Carrito
                    </span>

                </div>

                <header className="cart-header">

                    <div>

                        <h1>
                            Tu carrito
                        </h1>

                        <p>
                            Revisa los productos que has seleccionado.
                        </p>

                    </div>

                    {items.length > 0 && (

                        <button
                            type="button"
                            className="cart-clear-button"
                            onClick={() => {

                                const confirmar = window.confirm(
                                    "¿Quieres vaciar todo el carrito?"
                                );

                                if (!confirmar) return;

                                items.forEach((item) => {
                                    removeItem(item);
                                });
                            }}
                        >
                            <Trash2 size={17} />
                            Vaciar carrito
                        </button>

                    )}

                </header>

                {loading ? (

                    <div className="cart-loading">

                        <Loader2
                            size={34}
                            className="spin"
                        />

                        <p>
                            Cargando tu carrito...
                        </p>

                    </div>

                ) : items.length === 0 ? (

                    <div className="cart-empty">

                        <div className="cart-empty-icon">
                            <ShoppingCart size={42} />
                        </div>

                        <h2>
                            Tu carrito está vacío
                        </h2>

                        <p>
                            Agrega productos desde nuestra tienda
                            para comenzar tu compra.
                        </p>

                        <Link
                            to="/"
                            className="cart-primary-button"
                        >
                            Ir a comprar
                        </Link>

                    </div>

                ) : (

                    <div className="cart-layout">

                        {/* =========================================
                            PRODUCTOS
                        ========================================== */}

                        <section className="cart-products-section">

                            <div className="cart-products-card">

                                <div className="cart-table-header">

                                    <span>
                                        Producto
                                    </span>

                                    <span>
                                        Precio
                                    </span>

                                    <span>
                                        Cantidad
                                    </span>

                                    <span>
                                        Subtotal
                                    </span>

                                    <span></span>

                                </div>

                                <ul className="cart-list">

                                    {items.map((item) => {

                                        const subtotal =
                                            Number(item.producto_precio || 0) *
                                            Number(item.cantidad || 0);

                                        const key =
                                            item.id_item ||
                                            item.variante_id;

                                        return (

                                            <li
                                                key={key}
                                                className="cart-item"
                                            >

                                                <div className="cart-product">

                                                    <div className="cart-item-image">

                                                        <img
                                                            src={
                                                                item.imagen ||
                                                                NoImage
                                                            }
                                                            alt={
                                                                item.producto_nombre
                                                            }
                                                            onError={(e) => {
                                                                e.currentTarget.src =
                                                                    NoImage;
                                                            }}
                                                        />

                                                    </div>

                                                    <div className="cart-item-info">

                                                        <h3>
                                                            {
                                                                item.producto_nombre
                                                            }
                                                        </h3>

                                                        <p className="cart-item-variant">

                                                            {item.color &&
                                                                `Color: ${item.color}`}

                                                            {item.color &&
                                                                item.talla &&
                                                                " · "}

                                                            {item.talla &&
                                                                `Talla: ${item.talla}`}

                                                        </p>

                                                        {item.sku && (

                                                            <p className="cart-item-sku">
                                                                SKU: {item.sku}
                                                            </p>

                                                        )}

                                                    </div>

                                                </div>

                                                <div className="cart-item-unit-price">

                                                    {formatearPesos(
                                                        item.producto_precio
                                                    )}

                                                </div>

                                                <div className="cart-item-qty">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            cambiarCantidad(
                                                                item,
                                                                -1
                                                            )
                                                        }
                                                        disabled={
                                                            Number(
                                                                item.cantidad
                                                            ) <= 1
                                                        }
                                                        title="Disminuir"
                                                    >
                                                        <Minus size={14} />
                                                    </button>

                                                    <span>
                                                        {item.cantidad}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            cambiarCantidad(
                                                                item,
                                                                1
                                                            )
                                                        }
                                                        disabled={
                                                            item.stock
                                                                ? Number(
                                                                      item.cantidad
                                                                  ) >=
                                                                  Number(
                                                                      item.stock
                                                                  )
                                                                : false
                                                        }
                                                        title="Aumentar"
                                                    >
                                                        <Plus size={14} />
                                                    </button>

                                                </div>

                                                <div className="cart-item-price">

                                                    <strong>
                                                        {formatearPesos(
                                                            subtotal
                                                        )}
                                                    </strong>

                                                </div>

                                                <button
                                                    type="button"
                                                    className="cart-item-remove"
                                                    onClick={() =>
                                                        eliminarItem(item)
                                                    }
                                                    title="Eliminar producto"
                                                >
                                                    <Trash2 size={17} />
                                                </button>

                                            </li>

                                        );

                                    })}

                                </ul>

                                {/* =====================================
                                    ENVÍO GRATIS
                                ====================================== */}

                                <div className="shipping-progress">

                                    <div className="shipping-progress-icon">

                                        <Truck size={28} />

                                    </div>

                                    <div className="shipping-progress-content">

                                        {faltanteEnvioGratis > 0 ? (

                                            <>

                                                <div className="shipping-progress-title">

                                                    <strong>
                                                        ¡Envío gratis!
                                                    </strong>

                                                    <span>
                                                        Te faltan{" "}
                                                        <b>
                                                            {formatearPesos(
                                                                faltanteEnvioGratis
                                                            )}
                                                        </b>{" "}
                                                        para obtener envío gratis
                                                    </span>

                                                </div>

                                            </>

                                        ) : (

                                            <div className="shipping-progress-title">

                                                <strong>
                                                    ¡Has conseguido envío gratis!
                                                </strong>

                                                <span>
                                                    Tu pedido cumple con el
                                                    mínimo para envío gratis.
                                                </span>

                                            </div>

                                        )}

                                        <div className="shipping-progress-bar">

                                            <div
                                                className="shipping-progress-fill"
                                                style={{
                                                    width: `${progresoEnvio}%`,
                                                }}
                                            />

                                        </div>

                                        <div className="shipping-progress-values">

                                            <span>
                                                $0
                                            </span>

                                            <span>
                                                {formatearPesos(
                                                    envioGratisDesde
                                                )}
                                            </span>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </section>

                        {/* =========================================
                            RESUMEN
                        ========================================== */}

                        <aside className="cart-sidebar">

                            <div className="cart-summary">

                                <h2>
                                    Resumen del pedido
                                </h2>

                                <div className="cart-summary-row">

                                    <span>
                                        Subtotal ({items.length}{" "}
                                        {items.length === 1
                                            ? "producto"
                                            : "productos"})
                                    </span>

                                    <strong>
                                        {formatearPesos(total)}
                                    </strong>

                                </div>

                                <div className="cart-summary-row">

                                    <span>
                                        Envío
                                    </span>

                                    <strong className="shipping-free">

                                        {faltanteEnvioGratis <= 0
                                            ? "Gratis"
                                            : "Por calcular"}

                                    </strong>

                                </div>

                                <div className="cart-summary-row">

                                    <span>
                                        Descuento
                                    </span>

                                    <strong>
                                        -$0
                                    </strong>

                                </div>

                                <div className="cart-summary-divider" />

                                <div className="cart-summary-total">

                                    <div>

                                        <span>
                                            Total
                                        </span>

                                        <small>
                                            Impuestos incluidos
                                        </small>

                                    </div>

                                    <strong>
                                        {formatearPesos(total)}
                                    </strong>

                                </div>

                                <button
                                    type="button"
                                    className="cart-checkout-button"
                                    onClick={finalizarCompra}
                                >

                                    <LockKeyhole size={18} />

                                    Finalizar compra

                                </button>

                            </div>

                            {/* =====================================
                                CUPÓN
                            ====================================== */}

                            <div className="cart-coupon">

                                <div className="cart-coupon-title">

                                    <Tag size={18} />

                                    <strong>
                                        ¿Tienes un código de descuento?
                                    </strong>

                                </div>

                                <div className="cart-coupon-form">

                                    <input
                                        type="text"
                                        placeholder="Ingresa tu código"
                                    />

                                    <button type="button">
                                        Aplicar
                                    </button>

                                </div>

                            </div>

                            {/* =====================================
                                COMPRA SEGURA
                            ====================================== */}

                            <div className="cart-secure">

                                <div className="cart-secure-icon">
                                    <ShieldCheck size={25} />
                                </div>

                                <div>

                                    <strong>
                                        Compra segura
                                    </strong>

                                    <p>
                                        Tus datos están protegidos
                                        con encriptación SSL.
                                    </p>

                                </div>

                            </div>

                            <div className="cart-back-shop">

                                <PackageCheck size={18} />

                                <div>

                                    <strong>
                                        Compra con confianza
                                    </strong>

                                    <span>
                                        Envíos rápidos a toda Colombia
                                    </span>

                                </div>

                            </div>

                            <Link
                                to="/"
                                className="cart-continue-shopping"
                            >
                                Seguir comprando
                            </Link>

                        </aside>

                    </div>

                )}

            </div>

        </main>
    );
}

export default Cart;