import { useEffect, useState } from "react";
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

import Breadcrumb from "../../components/Breadcrumb/Breadcrumb";

import {
    getMisDirecciones,
    crearDireccion,
} from "../../services/addressService";
import {
    checkout,
    getMetodosPago,
    getWompiMerchant,
    getWompiWidgetData,
} from "../../services/paymentService";

import NoImage from "../../assets/images/no-image.png";
import { mediaUrl } from "../../utils/mediaUrl";

import "./Checkout.css";

const formatearPesos = (valor) => {
    const numero = Number(valor);
    if (Number.isNaN(numero)) return "$0";
    return `$${numero.toLocaleString("es-CO")}`;
};

function Checkout() {

    const { usuario } = useAuth();
    const { items, total, loading } = useCart();
    const navigate = useNavigate();

    /* ----------- Estado UI ----------- */
    const [direcciones, setDirecciones] = useState([]);
    const [loadingDatos, setLoadingDatos] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState(null);

    const [direccionId, setDireccionId] = useState(null);
    const [telefono, setTelefono] = useState("");

    const [terminosAceptados, setTerminosAceptados] = useState(false);
    const [datosAceptados, setDatosAceptados] = useState(false);

    const [wompiTokens, setWompiTokens] = useState(null);

    const [mostrarFormDireccion, setMostrarFormDireccion] = useState(false);
    const [nuevaDireccion, setNuevaDireccion] = useState({
        direccion: "",
        ciudad: "",
        departamento: "",
        codigo_postal: "",
        predeterminada: true,
    });
    const [guardandoDireccion, setGuardandoDireccion] = useState(false);

    /* ----------- Estado del Widget Wompi ----------- */
    const [widgetPayload, setWidgetPayload] = useState(null);

    /* ----------- Carga inicial ----------- */
    useEffect(() => {
        if (!usuario) return;
        setLoadingDatos(true);
        Promise.all([
            getMisDirecciones(usuario.id_usuario),
            getWompiMerchant(),
        ])
            .then(([dirRes, wompiRes]) => {
                const dirs = dirRes.data || [];
                setDirecciones(dirs);
                setWompiTokens(wompiRes.data?.acceptance_tokens || null);

                const pred = dirs.find((d) => d.predeterminada) || dirs[0];
                if (pred) setDireccionId(pred.id_direccion);

                setTelefono(usuario.telefono || "");
            })
            .catch((err) => {
                console.error("Checkout load:", err);
                setError("No se pudieron cargar los datos del checkout.");
            })
            .finally(() => setLoadingDatos(false));
    }, [usuario]);

    /* ----------- Carrito vacío → redirigir ----------- */
    useEffect(() => {
        if (!loading && items.length === 0 && !procesando && !widgetPayload) {
            navigate("/cart", { replace: true });
        }
    }, [loading, items.length, procesando, widgetPayload, navigate]);

    /* ----------- Inyección limpia del script del Widget -----------
       useEffect con cleanup garantiza que el script se elimina del
       DOM cuando el componente se desmonta (ej. al navegar). */
    useEffect(() => {
        if (!widgetPayload) return;

        const formId = "wompi-checkout-form";
        const existing = document.getElementById(formId);
        if (existing) existing.remove();

        const form = document.createElement("form");
        form.id = formId;

        const script = document.createElement("script");
        script.src = "https://checkout.wompi.co/widget.js";
        script.async = true;
        script.setAttribute("data-render", "button");
        script.setAttribute("data-public-key", widgetPayload.public_key);
        script.setAttribute("data-currency", widgetPayload.currency);
        script.setAttribute(
            "data-amount-in-cents",
            String(widgetPayload.amount_in_cents)
        );
        script.setAttribute("data-reference", widgetPayload.reference);
        script.setAttribute(
            "data-signature:integrity",
            widgetPayload.signature_integrity
        );

        if (widgetPayload.customer_email) {
            script.setAttribute(
                "data-customer-email",
                widgetPayload.customer_email
            );
        }

        script.setAttribute(
            "data-redirect-url",
            widgetPayload.redirect_url
        );

        form.appendChild(script);
        document.body.appendChild(form);

        return () => {
            const el = document.getElementById(formId);
            if (el) el.remove();
        };
    }, [widgetPayload]);

    const totalFinal = Number(total || 0);

    /* ----------- Guardar nueva dirección ----------- */
    const handleGuardarDireccion = async (e) => {
        e.preventDefault();
        if (
            !nuevaDireccion.direccion ||
            !nuevaDireccion.ciudad ||
            !nuevaDireccion.departamento
        ) {
            setError("Completa los campos obligatorios de la dirección.");
            return;
        }
        setGuardandoDireccion(true);
        setError(null);
        try {
            const { data } = await crearDireccion({
                usuario: usuario.id_usuario,
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

        if (!terminosAceptados || !datosAceptados) {
            setError(
                "Debes aceptar los Términos y la Política de Tratamiento de Datos para continuar."
            );
            return;
        }

        setProcesando(true);
        setError(null);

        try {
            // 1) Buscar el id del método Wompi.
            const { data: metodos } = await getMetodosPago();
            const metodoWompi = (metodos || []).find(
                (m) => m.tipo?.toLowerCase() === "wompi"
            );

            if (!metodoWompi) {
                throw new Error(
                    "No hay método de pago Wompi configurado en el sistema."
                );
            }

            // 2) Crear la compra (descuento temporal de stock).
            const { data: checkoutData } = await checkout({
                usuario_id: usuario.id_usuario,
                direccion_id: direccionId,
                metodo_pago_id: metodoWompi.id,
                telefono_contacto: telefono || usuario.telefono,
                terminos_aceptados: terminosAceptados,
                datos_aceptados: datosAceptados,
            });

            const compraId =
                checkoutData?.compra_id ??
                checkoutData?.id_compra ??
                checkoutData?.compra?.id_compra ??
                checkoutData?.compra?.id;

            if (!compraId) {
                throw new Error("No se pudo crear la compra.");
            }

            // 3) Pedir al backend el payload del Widget.
            const { data: widgetResp } = await getWompiWidgetData(compraId);
            const w = widgetResp?.widget;

            if (!w?.public_key || !w?.signature_integrity) {
                throw new Error(
                    "No se pudo preparar el widget de pago de Wompi."
                );
            }

            // 4) Activar el Widget. El useEffect lo inyecta y limpia.
            //    Cuando Wompi termine, redirige a /checkout/confirm
            //    y este componente se desmonta → cleanup elimina el script.
            setWidgetPayload(w);

        } catch (err) {
            console.error("Checkout error:", err);
            const msg =
                err?.response?.data?.detail ||
                err?.response?.data?.error ||
                err?.message ||
                "No fue posible iniciar el pago. Intenta de nuevo.";
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

    if (items.length === 0 && !widgetPayload) {
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

                <Breadcrumb
                    items={[
                        { label: "Carrito", to: "/cart" },
                        { label: "Checkout" },
                    ]}
                />

                <h1>Finalizar compra</h1>
                <p>
                    Confirma tu dirección y revisa tu pedido. Te llevaremos al
                    pago seguro de Wompi en el siguiente paso.
                </p>

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

                        {/* ACEPTACIONES LEGALES — minimalistas */}
                        <section className="checkout-card checkout-legal-card">
                            <p className="checkout-legal-text">
                                Para procesar tu pago de forma segura, Wompi nos
                                exige confirmar las siguientes autorizaciones:
                            </p>

                            <label className="checkout-legal-option">
                                <input
                                    type="checkbox"
                                    checked={terminosAceptados}
                                    onChange={(e) => setTerminosAceptados(e.target.checked)}
                                />
                                <span>
                                    Acepto los{" "}
                                    <a
                                        href={wompiTokens?.acceptance_permalink || "/terminos-y-condiciones"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Términos y Condiciones
                                    </a>
                                    .
                                </span>
                            </label>

                            <label className="checkout-legal-option">
                                <input
                                    type="checkbox"
                                    checked={datosAceptados}
                                    onChange={(e) => setDatosAceptados(e.target.checked)}
                                />
                                <span>
                                    Autorizo el{" "}
                                    <a
                                        href={wompiTokens?.personal_data_permalink || "/politica-tratamiento-datos"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Tratamiento de Datos Personales
                                    </a>
                                    .
                                </span>
                            </label>
                        </section>
                    </div>

                    {/* ===========================
                        RESUMEN
                    ============================ */}
                    <aside className="checkout-summary">
                        <h2>Resumen del pedido</h2>

                        <ul className="checkout-items">
                            {items.map((it) => {
                                const key = it.id_item || it.variante_id;
                                const sub = Number(it.producto_precio || 0) * Number(it.cantidad || 0);
                                return (
                                    <li key={key} className="checkout-item">
                                        <img
                                            src={mediaUrl(it.imagen, NoImage)}
                                            alt={it.producto_nombre}
                                            onError={(e) => {
                                                e.currentTarget.src = NoImage;
                                            }}
                                        />
                                        <div className="checkout-item-info">
                                            <strong>{it.producto_nombre}</strong>
                                            <span>
                                                {it.color ? `Color: ${it.color}` : ""}
                                                {it.color && it.talla ? " · " : ""}
                                                {it.talla ? `Talla: ${it.talla}` : ""}
                                                {" · Cant: "}{it.cantidad}
                                            </span>
                                        </div>
                                        <span className="checkout-item-price">
                                            {formatearPesos(sub)}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="checkout-summary-row">
                            <span>Subtotal</span>
                            <strong>{formatearPesos(total)}</strong>
                        </div>
                        <div className="checkout-summary-row">
                            <span>
                                <Truck size={13} style={{ verticalAlign: -2 }} /> Envío
                            </span>
                            <strong style={{ color: "#0097A7" }}>Por calcular</strong>
                        </div>
                        <div className="checkout-summary-divider" />
                        <div className="checkout-summary-row checkout-summary-total">
                            <span>Total</span>
                            <strong>{formatearPesos(totalFinal)}</strong>
                        </div>

                        {widgetPayload ? (
                            <div className="checkout-widget-active">
                                <p className="checkout-widget-hint">
                                    <LockKeyhole size={12} /> Wompi está listo.
                                    Pulsa el botón para abrir el pago seguro.
                                </p>
                                <p className="checkout-widget-hint-sub">
                                    (El botón de Wompi aparecerá aquí cuando Wompi
                                    termine de cargar. Si no aparece en 5 segundos,
                                    recarga la página.)
                                </p>
                                {/* El botón real lo inyecta el script de Wompi
                                    dentro del <form id="wompi-checkout-form">. */}
                                <div id="wompi-button-mount" />
                                <button
                                    type="button"
                                    className="checkout-pay"
                                    style={{ background: "#888" }}
                                    onClick={() => navigate("/cart")}
                                >
                                    Cancelar y volver al carrito
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="checkout-pay"
                                    onClick={handlePagar}
                                    disabled={
                                        procesando ||
                                        !direccionId ||
                                        !terminosAceptados ||
                                        !datosAceptados
                                    }
                                >
                                    {procesando ? (
                                        <>
                                            <Loader2 size={16} className="checkout-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={16} />
                                            Continuar al pago con Wompi
                                        </>
                                    )}
                                </button>

                                <p className="checkout-secure-note">
                                    <LockKeyhole size={12} /> En el siguiente
                                    paso verás el pago seguro procesado por
                                    Wompi (Bancolombia).
                                </p>
                            </>
                        )}

                        <Link
                            to="/cart"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                marginTop: 10,
                                color: "#0097A7",
                                textDecoration: "none",
                                fontWeight: 600,
                                fontSize: 13,
                            }}
                        >
                            <ArrowLeft size={14} /> Volver al carrito
                        </Link>
                    </aside>

                </div>

            </div>
        </main>
    );
}

export default Checkout;
