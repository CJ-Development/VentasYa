import { useEffect } from "react";

import { Link, useNavigate } from "react-router-dom";

import {
    Loader2,
    Minus,
    Plus,
    ShoppingCart,
    Trash2,
    X,
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

    // Refrescar al montar si hay usuario (Provider ya carga, pero por si acaso)
    useEffect(() => {

        // No-op: el provider se encarga.

    }, []);

    const cambiarCantidad = (item, delta) => {

        const nuevaCantidad = Math.max(1, Number(item.cantidad || 1) + delta);

        if (nuevaCantidad === item.cantidad) return;

        updateQty(item, nuevaCantidad);

    };

    const eliminarItem = (item) => {

        const confirmar = window.confirm("¿Eliminar este producto del carrito?");

        if (!confirmar) return;

        removeItem(item);

    };

    const finalizarCompra = () => {

        // Sin usuario: redirigir a login preservando el carrito (ya esta en localStorage).

        if (!usuario) {

            navigate("/login?from=/cart", { replace: false });

            return;

        }

        // Aqui iria el flujo real de pago. Por ahora placeholder.

        alert("Compra finalizada (simulada). El flujo de pago real se integrará luego.");

    };

    if (!usuario) {

        return (

            <main className="cart-page">

                <div className="cart-container">

                    <h1>Mi carrito</h1>

                    <div className="cart-empty">

                        <ShoppingCart size={64} />

                        <h2>Tu carrito tiene productos sin guardar</h2>

                        <p>
                            Para conservarlos en tu cuenta y finalizar la compra,
                            inicia sesión o crea una cuenta.
                        </p>

                        <div className="cart-empty-actions">

                            <Link
                                to="/login?from=/cart"
                                className="cart-primary-button"
                            >
                                Iniciar sesión y conservar mi carrito
                            </Link>

                            <Link to="/" className="cart-secondary-link">
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

                <h1>Mi carrito</h1>

                {loading ? (

                    <div className="cart-loading">

                        <Loader2 size={32} className="spin" />

                        <p>Cargando tu carrito...</p>

                    </div>

                ) : items.length === 0 ? (

                    <div className="cart-empty">

                        <ShoppingCart size={64} />

                        <h2>Tu carrito está vacío</h2>

                        <p>Agrega productos desde el inicio para comprar.</p>

                        <Link to="/" className="cart-primary-button">

                            Ir a comprar

                        </Link>

                    </div>

                ) : (

                    <>

                        <ul className="cart-list">

                            {items.map((item) => {

                                const subtotal =

                                    Number(item.producto_precio || 0) * Number(item.cantidad || 0);

                                const key = item.id_item || item.variante_id;

                                return (

                                    <li key={key} className="cart-item">

                                        <div className="cart-item-image">

                                            <img

                                                src={item.imagen || NoImage}

                                                alt={item.producto_nombre}

                                                onError={(e) => { e.currentTarget.src = NoImage; }}

                                            />

                                        </div>

                                        <div className="cart-item-info">

                                            <h3>{item.producto_nombre}</h3>

                                            <p className="cart-item-variant">

                                                {item.color} · Talla {item.talla}

                                            </p>

                                            {item.sku && (
                                                <p className="cart-item-sku">SKU: {item.sku}</p>
                                            )}

                                        </div>

                                        <div className="cart-item-qty">

                                            <button

                                                type="button"

                                                onClick={() => cambiarCantidad(item, -1)}

                                                disabled={item.cantidad <= 1}

                                                title="Disminuir"

                                            >

                                                <Minus size={14} />

                                            </button>

                                            <span>{item.cantidad}</span>

                                            <button

                                                type="button"

                                                onClick={() => cambiarCantidad(item, 1)}

                                                disabled={item.stock ? item.cantidad >= item.stock : false}

                                                title="Aumentar"

                                            >

                                                <Plus size={14} />

                                            </button>

                                        </div>

                                        <div className="cart-item-price">

                                            <strong>{formatearPesos(subtotal)}</strong>

                                            <small>{formatearPesos(item.producto_precio)} c/u</small>

                                        </div>

                                        <button

                                            type="button"

                                            className="cart-item-remove"

                                            onClick={() => eliminarItem(item)}

                                            title="Eliminar"

                                        >

                                            <X size={18} />

                                        </button>

                                    </li>

                                );

                            })}

                        </ul>

                        <div className="cart-summary">

                            <div className="cart-summary-row">

                                <span>Subtotal</span>

                                <strong>{formatearPesos(total)}</strong>

                            </div>

                            <div className="cart-summary-row">

                                <span>Envío</span>

                                <strong>Por calcular</strong>

                            </div>

                            <div className="cart-summary-row cart-summary-total">

                                <span>Total</span>

                                <strong>{formatearPesos(total)}</strong>

                            </div>

                            <button

                                type="button"

                                className="cart-primary-button cart-checkout"

                                onClick={finalizarCompra}

                            >

                                Finalizar compra

                            </button>

                            <Link to="/" className="cart-secondary-link">

                                Seguir comprando

                            </Link>

                        </div>

                    </>

                )}

            </div>

        </main>

    );

}

export default Cart;
