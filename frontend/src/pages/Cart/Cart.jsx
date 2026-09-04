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
    PackageCheck,
    ArrowRight,
    CheckCircle2,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";

import Breadcrumb from "../../components/Breadcrumb/Breadcrumb";

import NoImage from "../../assets/images/no-image.png";
import { mediaUrl } from "../../utils/mediaUrl";

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
        navigate("/checkout");
    };

    /*
     * META PARA ENVÍO GRATIS
     *
     * Valor utilizado en el diseño actual:
     * $99.900
     *
     * Si después defines otro valor en backend,
     * solo cambia esta constante.
     */
    const envioGratisDesde = 99900;

    const totalNumerico = Number(total || 0);

    const faltanteEnvioGratis = Math.max(
        envioGratisDesde - totalNumerico,
        0
    );

    const tieneEnvioGratis = faltanteEnvioGratis <= 0;

    const progresoEnvio = Math.min(
        (totalNumerico / envioGratisDesde) * 100,
        100
    );

    /*
     * CARRITO SIN SESIÓN
     */
    if (!usuario) {
        return (
            <main className="cart-page">
                <div className="cart-container">

                    <Breadcrumb
                        items={[
                            { label: "Carrito" }
                        ]}
                    />

                    <header className="cart-header">
                        <div>
                            <span className="cart-eyebrow">
                                TU COMPRA
                            </span>

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
                                <ArrowRight size={17} />
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

    return (
        <main className="cart-page">
            <div className="cart-container">

                {/* =====================================================
                    BREADCRUMB
                ====================================================== */}

                <Breadcrumb
                    items={[
                        { label: "Carrito" }
                    ]}
                />

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <header className="cart-header">

                    <div className="cart-header-content">

                        <span className="cart-eyebrow">
                            TU COMPRA
                        </span>

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
                            <Trash2 size={16} />
                            Vaciar carrito
                        </button>
                    )}

                </header>

                {/* =====================================================
                    LOADING
                ====================================================== */}

                {loading ? (

                    <div className="cart-loading">

                        <div className="cart-loading-icon">
                            <Loader2
                                size={32}
                                className="spin"
                            />
                        </div>

                        <h2>
                            Cargando tu carrito
                        </h2>

                        <p>
                            Estamos actualizando tus productos...
                        </p>

                    </div>

                ) : items.length === 0 ? (

                    /* =================================================
                       EMPTY
                    ================================================== */

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
                            <ArrowRight size={17} />
                        </Link>

                    </div>

                ) : (

                    /* =================================================
                       CONTENIDO PRINCIPAL
                    ================================================== */

                    <div className="cart-layout">

                        {/* =================================================
                            PRODUCTOS
                        ================================================== */}

                        <section className="cart-products-section">

                            <div className="cart-products-card">

                                {/* CABECERA DE TABLA */}

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

                                    <span />

                                </div>

                                {/* LISTA */}

                                <ul className="cart-list">

                                    {items.map((item) => {

                                        const precioUnitario =
                                            Number(
                                                item.producto_precio || 0
                                            );

                                        const cantidad =
                                            Number(
                                                item.cantidad || 0
                                            );

                                        const subtotal =
                                            precioUnitario * cantidad;

                                        const key =
                                            item.id_item ||
                                            item.variante_id;

                                        return (
                                            <li
                                                key={key}
                                                className="cart-item"
                                            >

                                                {/* PRODUCTO */}

                                                <div className="cart-product">

                                                    <div className="cart-item-image">

                                                        <img
                                                            src={mediaUrl(
                                                                item.imagen,
                                                                NoImage
                                                            )}
                                                            alt={
                                                                item.producto_nombre ||
                                                                "Producto"
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

                                                        {(item.color ||
                                                            item.talla) && (
                                                            <p className="cart-item-variant">

                                                                {item.color &&
                                                                    `Color: ${item.color}`}

                                                                {item.color &&
                                                                    item.talla &&
                                                                    " · "}

                                                                {item.talla &&
                                                                    `Talla: ${item.talla}`}

                                                            </p>
                                                        )}

                                                        {item.sku && (
                                                            <p className="cart-item-sku">
                                                                SKU: {item.sku}
                                                            </p>
                                                        )}

                                                    </div>

                                                </div>

                                                {/* PRECIO UNITARIO */}

                                                <div className="cart-item-unit-price">

                                                    <span>
                                                        {formatearPesos(
                                                            precioUnitario
                                                        )}
                                                    </span>

                                                    <small>
                                                        por unidad
                                                    </small>

                                                </div>

                                                {/* CANTIDAD */}

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
                                                            cantidad <= 1
                                                        }
                                                        title="Disminuir cantidad"
                                                        aria-label="Disminuir cantidad"
                                                    >
                                                        <Minus size={14} />
                                                    </button>

                                                    <span>
                                                        {cantidad}
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
                                                                ? cantidad >=
                                                                  Number(
                                                                      item.stock
                                                                  )
                                                                : false
                                                        }
                                                        title="Aumentar cantidad"
                                                        aria-label="Aumentar cantidad"
                                                    >
                                                        <Plus size={14} />
                                                    </button>

                                                </div>

                                                {/* SUBTOTAL */}

                                                <div className="cart-item-price">

                                                    <strong>
                                                        {formatearPesos(
                                                            subtotal
                                                        )}
                                                    </strong>

                                                </div>

                                                {/* ELIMINAR */}

                                                <button
                                                    type="button"
                                                    className="cart-item-remove"
                                                    onClick={() =>
                                                        eliminarItem(item)
                                                    }
                                                    title="Eliminar producto"
                                                    aria-label={`Eliminar ${item.producto_nombre}`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                            </li>
                                        );
                                    })}

                                </ul>

                                {/* =================================================
                                    ENVÍO GRATIS
                                ================================================== */}

                                <div
                                    className={`cart-shipping-progress ${
                                        tieneEnvioGratis
                                            ? "cart-shipping-progress--success"
                                            : ""
                                    }`}
                                >

                                    <div className="cart-shipping-icon">

                                        {tieneEnvioGratis ? (
                                            <CheckCircle2 size={22} />
                                        ) : (
                                            <Truck size={22} />
                                        )}

                                    </div>

                                    <div className="cart-shipping-info">

                                        {tieneEnvioGratis ? (
                                            <>
                                                <strong>
                                                    ¡Envío gratis desbloqueado! 🎉
                                                </strong>

                                                <span>
                                                    Tu pedido ya cumple con
                                                    el monto mínimo para envío
                                                    gratis.
                                                </span>
                                            </>
                                        ) : (
                                            <>
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
                                                    para obtener envío gratis.
                                                </span>
                                            </>
                                        )}

                                        <div className="cart-shipping-progress-row">

                                            <div className="cart-shipping-bar">

                                                <span
                                                    style={{
                                                        width: `${progresoEnvio}%`,
                                                    }}
                                                />

                                            </div>

                                        </div>

                                        <div className="cart-shipping-values">

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

                        {/* =================================================
                            SIDEBAR
                        ================================================== */}

                        <aside className="cart-sidebar">

                            {/* RESUMEN */}

                            <div className="cart-summary">

                                <div className="cart-summary-heading">

                                    <div>
                                        <span>
                                            TU PEDIDO
                                        </span>

                                        <h2>
                                            Resumen del pedido
                                        </h2>
                                    </div>

                                    <div className="cart-summary-badge">
                                        {items.length}
                                    </div>

                                </div>

                                <div className="cart-summary-row">

                                    <span>
                                        Subtotal ({items.length}{" "}
                                        {items.length === 1
                                            ? "producto"
                                            : "productos"})
                                    </span>

                                    <strong>
                                        {formatearPesos(totalNumerico)}
                                    </strong>

                                </div>

                                <div className="cart-summary-row">

                                    <span>
                                        Envío
                                    </span>

                                    <strong
                                        className={
                                            tieneEnvioGratis
                                                ? "shipping-free"
                                                : "shipping-pending"
                                        }
                                    >
                                        {tieneEnvioGratis
                                            ? "Gratis"
                                            : "Por calcular"}
                                    </strong>

                                </div>

                                {/* Solo mostramos descuento cuando exista.
                                    Actualmente no hay lógica de descuento,
                                    por eso no mostramos "-$0". */}

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
                                        {formatearPesos(totalNumerico)}
                                    </strong>

                                </div>

                                <button
                                    type="button"
                                    className="cart-checkout-button"
                                    onClick={finalizarCompra}
                                >

                                    <LockKeyhole size={18} />

                                    <span>
                                        Finalizar compra
                                    </span>

                                    <ArrowRight size={17} />

                                </button>

                                <div className="cart-checkout-security">

                                    <ShieldCheck size={15} />

                                    <span>
                                        Pago seguro y protegido
                                    </span>

                                </div>

                            </div>

                            {/* =================================================
                                CUPÓN
                            ================================================== */}

                            <div className="cart-coupon">

                                <div className="cart-coupon-title">

                                    <Tag size={17} />

                                    <strong>
                                        ¿Tienes un código de descuento?
                                    </strong>

                                </div>

                                <div className="cart-coupon-form">

                                    <input
                                        type="text"
                                        placeholder="Ingresa tu código"
                                        aria-label="Código de descuento"
                                    />

                                    <button type="button">
                                        Aplicar
                                    </button>

                                </div>

                            </div>

                            {/* =================================================
                                COMPRA SEGURA
                            ================================================== */}

                            <div className="cart-secure">

                                <div className="cart-secure-icon">
                                    <ShieldCheck size={23} />
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

                            {/* =================================================
                                CONFIANZA
                            ================================================== */}

                            <div className="cart-confidence">

                                <div className="cart-confidence-icon">
                                    <PackageCheck size={19} />
                                </div>

                                <div>

                                    <strong>
                                        Compra con confianza
                                    </strong>

                                    <span>
                                        Envíos rápidos a toda Colombia
                                    </span>

                                </div>

                            </div>

                            {/* =================================================
                                CONTINUAR
                            ================================================== */}

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