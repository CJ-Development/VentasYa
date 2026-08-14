import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    Loader2,
    LockKeyhole,
    MapPin,
    Plus,
    ShoppingBag,
    Truck,
    User,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";

import {
    getMisDirecciones,
    crearDireccion,
} from "../../services/addressService";
import { getMetodosPago, checkout } from "../../services/paymentService";

import NoImage from "../../assets/images/no-image.png";

import "./Checkout.css";

const formatearPesos = (valor) => {
    const numero = Number(valor);
    if (Number.isNaN(numero)) return "$0";
    return `$${numero.toLocaleString("es-CO")}`;
};

function Checkout() {

    const { usuario } = useAuth();

    const { items, total, loading, clear } = useCart();

    const navigate = useNavigate();

    /* ----------- Estado UI ----------- */
    const [direcciones, setDirecciones] = useState([]);
    const [metodos, setMetodos] = useState([]);

    const [loadingDatos, setLoadingDatos] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState(null);

    const [direccionId, setDireccionId] = useState(null);
    const [metodoPagoId, setMetodoPagoId] = useState(null);
    const [telefono, setTelefono] = useState("");

    const [mostrarFormDireccion, setMostrarFormDireccion] = useState(false);
    const [nuevaDireccion, setNuevaDireccion] = useState({
        direccion: "",
        ciudad: "",
        departamento: "",
        codigo_postal: "",
        predeterminada: true,
    });
    const [guardandoDireccion, setGuardandoDireccion] = useState(false);

    /* ----------- Carga inicial ----------- */
    useEffect(() => {
        if (!usuario) return;
        setLoadingDatos(true);
        Promise.all([
            getMisDirecciones(),
            getMetodosPago(),
        ])
            .then(([dirRes, metRes]) => {
                const dirs = dirRes.data || [];
                setDirecciones(dirs);
                setMetodos(metRes.data || []);

                const pred = dirs.find((d) => d.predeterminada) || dirs[0];
                if (pred) setDireccionId(pred.id_direccion);

                if ((metRes.data || []).length > 0) {
                    setMetodoPagoId(metRes.data[0].id);
                }

                setTelefono(usuario.telefono || "");
            })
            .catch((err) => {
                console.error("Checkout load:", err);
                setError("No se pudieron cargar los datos del checkout.");
            })
            .finally(() => setLoadingDatos(false));
    }, [usuario]);

    /* ----------- Si el carrito se vacía ----------- */
    useEffect(() => {
        if (!loading && items.length === 0 && !procesando) {
            navigate("/cart", { replace: true });
        }
    }, [loading, items.length, procesando, navigate]);

    const envioGratisDesde = 999900;
    const envioGratis = total >= envioGratisDesde;

    const costoEnvio = useMemo(() => (envioGratis ? 0 : 0), [envioGratis]);

    const totalFinal = useMemo(
        () => Number(total || 0) + Number(costoEnvio || 0),
        [total, costoEnvio]
    );

    /* ----------- Guardar nueva dirección ----------- */
    const handleGuardarDireccion = async (e) => {
        e.preventDefault();
        if (!nuevaDireccion.direccion || !nuevaDireccion.ciudad || !nuevaDireccion.departamento) {
            setError("Completa los campos obligatorios de la dirección.");
            return;
        }
        setGuardandoDireccion(true);
        setError(null);
        try {
            const { data } = await crearDireccion({
                ...nuevaDireccion,
            });
            const nuevas = [...direcciones, data];
            setDirecciones(nuevas);
            setDireccionId(data.id_direccion);
            setMostrarFormDireccion(false);
            setNuevaDireccion({
                direccion: "",
                ciudad: "",
                departamento: "",
                codigo_postal: "",
                predeterminada: true,
            });
        } catch (err) {
            console.error("Guardar dirección:", err);
            setError("No se pudo guardar la dirección.");
        } finally {
            setGuardandoDireccion(false);
        }
    };

    /* ----------- Pagar ----------- */
    const handlePagar = async () => {
        if (!direccionId) {
            setError("Selecciona o crea una dirección de envío.");
            return;
        }
        if (!metodoPagoId) {
            setError("Selecciona un método de pago.");
            return;
        }

        setProcesando(true);
        setError(null);

        try {
            // Generar idempotency_key único para este intento
            const idempotencyKey = crypto.randomUUID();

            const { data } = await checkout({
                direccion_id: direccionId,
                metodo_pago_id: metodoPagoId,
                telefono_contacto: telefono || usuario.telefono,
                idempotency_key: idempotencyKey,
            });

            // Vaciar carrito local
            await clear();

            // Redirigir a Mis pedidos
            navigate(`/orders`, {
                replace: true,
                state: { pedidoId: data?.id_compra },
            });
        } catch (err) {
            console.error("Checkout error:", err);
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.error ||
                "No fue posible procesar el pago. Intenta de nuevo.";
            setError(msg);
        } finally {
            setProcesando(false);
        }
    };

    /* ----------- Guards ----------- */
    if (!usuario) {
        return (
            <main className="checkout-page">
                <div className="checkout-container">
                    <div className="checkout-empty">
                        <User size={42} />
                        <h2>Inicia sesión para pagar</h2>
                        <p>Necesitas una cuenta para finalizar la compra.</p>
                        <Link to="/login?from=/checkout">Iniciar sesión</Link>
                    </div>
                </div>
            </main>
        );
    }

    if (loading || loadingDatos) {
        return (
            <main className="checkout-page">
                <div className="checkout-container">
                    <div className="checkout-loading">
                        <Loader2 size={34} className="checkout-spin" />
                        <p>Preparando tu pedido...</p>
                    </div>
                </div>
            </main>
        );
    }

    if (items.length === 0) {
        return (
            <main className="checkout-page">
                <div className="checkout-container">
                    <div className="checkout-empty">
                        <ShoppingBag size={42} />
                        <h2>Tu carrito está vacío</h2>
                        <p>Agrega productos antes de finalizar la compra.</p>
                        <Link to="/">Ir a la tienda</Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="checkout-page">
            <div className="checkout-container">

                <div className="checkout-breadcrumb">
                    <Link to="/">Inicio</Link>
                    <span>›</span>
                    <Link to="/cart">Carrito</Link>
                    <span>›</span>
                    <span>Checkout</span>
                </div>

                <h1>Finalizar compra</h1>
                <p>Confirma tu dirección y método de pago para completar el pedido.</p>

                {error && <div className="checkout-error">{error}</div>}

                <div className="checkout-layout">

                    {/* ===========================
                        FORMULARIO
                    ============================ */}
                    <div className="checkout-form">

                        {/* DIRECCIÓN */}
                        <section className="checkout-card">
                            <h2>
                                <MapPin size={18} /> Dirección de envío
                            </h2>
                            <p>Elige una dirección registrada o agrega una nueva.</p>

                            {direcciones.length === 0 ? (
                                <div className="checkout-no-options">
                                    Aún no tienes direcciones registradas.
                                </div>
                            ) : (
                                <div className="checkout-options">
                                    {direcciones.map((d) => (
                                        <label
                                            key={d.id_direccion}
                                            className={
                                                "checkout-option"
                                                + (direccionId === d.id_direccion ? " is-selected" : "")
                                            }
                                        >
                                            <input
                                                type="radio"
                                                name="direccion"
                                                value={d.id_direccion}
                                                checked={direccionId === d.id_direccion}
                                                onChange={() => setDireccionId(d.id_direccion)}
                                            />
                                            <div className="checkout-option-main">
                                                <strong>
                                                    {d.direccion}
                                                    {d.predeterminada && (
                                                        <span className="checkout-tag">Predeterminada</span>
                                                    )}
                                                </strong>
                                                <span>
                                                    {d.ciudad}, {d.departamento}
                                                    {d.codigo_postal ? ` · CP ${d.codigo_postal}` : ""}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {!mostrarFormDireccion ? (
                                <button
                                    type="button"
                                    className="checkout-add-toggle"
                                    onClick={() => setMostrarFormDireccion(true)}
                                >
                                    <Plus size={14} /> Agregar nueva dirección
                                </button>
                            ) : (
                                <form
                                    onSubmit={handleGuardarDireccion}
                                    style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}
                                >
                                    <div className="checkout-field">
                                        <label>Dirección *</label>
                                        <input
                                            type="text"
                                            value={nuevaDireccion.direccion}
                                            onChange={(e) =>
                                                setNuevaDireccion({ ...nuevaDireccion, direccion: e.target.value })
                                            }
                                            placeholder="Calle 123 #45-67"
                                            required
                                        />
                                    </div>
                                    <div className="checkout-grid-2">
                                        <div className="checkout-field">
                                            <label>Ciudad *</label>
                                            <input
                                                type="text"
                                                value={nuevaDireccion.ciudad}
                                                onChange={(e) =>
                                                    setNuevaDireccion({ ...nuevaDireccion, ciudad: e.target.value })
                                                }
                                                placeholder="Bogotá"
                                                required
                                            />
                                        </div>
                                        <div className="checkout-field">
                                            <label>Departamento *</label>
                                            <input
                                                type="text"
                                                value={nuevaDireccion.departamento}
                                                onChange={(e) =>
                                                    setNuevaDireccion({ ...nuevaDireccion, departamento: e.target.value })
                                                }
                                                placeholder="Cundinamarca"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="checkout-grid-2">
                                        <div className="checkout-field">
                                            <label>Código postal</label>
                                            <input
                                                type="text"
                                                value={nuevaDireccion.codigo_postal}
                                                onChange={(e) =>
                                                    setNuevaDireccion({ ...nuevaDireccion, codigo_postal: e.target.value })
                                                }
                                                placeholder="110111"
                                            />
                                        </div>
                                        <label
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                color: "#031927",
                                                fontSize: 12,
                                                fontWeight: 700,
                                                alignSelf: "end",
                                                paddingBottom: 10,
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={nuevaDireccion.predeterminada}
                                                onChange={(e) =>
                                                    setNuevaDireccion({
                                                        ...nuevaDireccion,
                                                        predeterminada: e.target.checked,
                                                    })
                                                }
                                            />
                                            Marcar como predeterminada
                                        </label>
                                    </div>

                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button
                                            type="submit"
                                            className="checkout-pay"
                                            style={{ flex: 1, background: "#0097A7" }}
                                            disabled={guardandoDireccion}
                                        >
                                            {guardandoDireccion ? (
                                                <Loader2 size={16} className="checkout-spin" />
                                            ) : (
                                                <CheckCircle2 size={16} />
                                            )}
                                            Guardar dirección
                                        </button>
                                        <button
                                            type="button"
                                            className="checkout-add-toggle"
                                            style={{ flex: "0 0 120px" }}
                                            onClick={() => setMostrarFormDireccion(false)}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            )}
                        </section>

                        {/* CONTACTO */}
                        <section className="checkout-card">
                            <h2>
                                <User size={18} /> Datos de contacto
                            </h2>
                            <p>Teléfono para confirmar la entrega.</p>
                            <div className="checkout-field">
                                <label>Teléfono</label>
                                <input
                                    type="tel"
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value)}
                                    placeholder="3001234567"
                                />
                            </div>
                        </section>

                        {/* MÉTODO DE PAGO */}
                        <section className="checkout-card">
                            <h2>
                                <CreditCard size={18} /> Método de pago
                            </h2>
                            <p>Selecciona cómo quieres pagar.</p>

                            {metodos.length === 0 ? (
                                <div className="checkout-no-options">
                                    No hay métodos de pago configurados. Contacta al administrador.
                                </div>
                            ) : (
                                <div className="checkout-options">
                                    {metodos.map((m) => (
                                        <label
                                            key={m.id}
                                            className={
                                                "checkout-option"
                                                + (metodoPagoId === m.id ? " is-selected" : "")
                                            }
                                        >
                                            <input
                                                type="radio"
                                                name="metodo_pago"
                                                value={m.id}
                                                checked={metodoPagoId === m.id}
                                                onChange={() => setMetodoPagoId(m.id)}
                                            />
                                            <div className="checkout-option-main">
                                                <strong>{m.tipo}</strong>
                                                {m.detalle && <span>{m.detalle}</span>}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ===========================
                        RESUMEN
                    ============================ */}
                    <div className="checkout-summary">
                        <h2>Resumen del pedido</h2>

                        <div className="checkout-items">
                            {items.map((item) => (
                                <div key={item.id_item} className="checkout-item">
                                    <img
                                        src={item.imagen || NoImage}
                                        alt={item.producto_nombre}
                                        className="checkout-item-image"
                                    />
                                    <div className="checkout-item-info">
                                        <strong>{item.producto_nombre}</strong>
                                        <span>
                                            {item.color} · {item.talla} · x{item.cantidad}
                                        </span>
                                    </div>
                                    <span className="checkout-item-price">
                                        {formatearPesos(item.producto_precio * item.cantidad)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="checkout-totals">
                            <div className="checkout-total-row">
                                <span>Subtotal</span>
                                <span>{formatearPesos(total)}</span>
                            </div>
                            <div className="checkout-total-row">
                                <span>Envío</span>
                                <span>
                                    {costoEnvio === 0 ? "Gratis" : formatearPesos(costoEnvio)}
                                </span>
                            </div>
                            {!envioGratis && (
                                <div className="checkout-shipping-notice">
                                    <Truck size={14} />
                                    Agrega {formatearPesos(envioGratisDesde - total)} para envío gratis
                                </div>
                            )}
                            <div className="checkout-total-row checkout-total-final">
                                <span>Total</span>
                                <span>{formatearPesos(totalFinal)}</span>
                            </div>
                        </div>

                        <button
                            className="checkout-pay"
                            onClick={handlePagar}
                            disabled={procesando}
                        >
                            {procesando ? (
                                <>
                                    <Loader2 size={18} className="checkout-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <LockKeyhole size={18} />
                                    Pagar {formatearPesos(totalFinal)}
                                </>
                            )}
                        </button>

                        <div className="checkout-security">
                            <LockKeyhole size={14} />
                            <span>Pago seguro con encriptación SSL</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Checkout;
