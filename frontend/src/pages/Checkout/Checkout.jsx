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

import Breadcrumb from "../../components/Breadcrumb/Breadcrumb";

import {
    getMisDirecciones,
    crearDireccion,
} from "../../services/addressService";
import { getMetodosPago, checkout, crearTransaccionWompi, confirmarPago } from "../../services/paymentService";

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

    const [terminosAceptados, setTerminosAceptados] = useState(false);
    const [datosAceptados, setDatosAceptados] = useState(false);

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
            getMisDirecciones(usuario.id_usuario),
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

    const metodoSeleccionado = metodos.find(
        (m) => m.id === metodoPagoId
    );
    const esWompi =
        metodoSeleccionado?.tipo?.toLowerCase() ===
        "wompi";

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

        // Validar aceptaciones legales
        const metodoSeleccionado = metodos.find(
            (m) => m.id === metodoPagoId
        );
        const esWompi =
            metodoSeleccionado?.tipo?.toLowerCase() ===
            "wompi";

        if (esWompi && (!terminosAceptados || !datosAceptados)) {
            setError("Debes aceptar los Términos y Condiciones y la Política de Tratamiento de Datos para pagar con Wompi.");
            return;
        }

        setProcesando(true);
        setError(null);

        try {
            // Primero crear la compra
            const { data: compraData } = await checkout({
                usuario_id: usuario.id_usuario,
                direccion_id: direccionId,
                metodo_pago_id: metodoPagoId,
                telefono_contacto: telefono || usuario.telefono,
                terminos_aceptados: terminosAceptados,
                datos_aceptados: datosAceptados,
            });

            console.log("RESPUESTA COMPLETA DEL CHECKOUT:", compraData);

            const compraId =
                compraData?.id_compra ??
                compraData?.id ??
                compraData?.compra?.id_compra ??
                compraData?.compra?.id;

            if (!compraId) {
                throw new Error("No se pudo crear la compra");
            }

            // Detectar método seleccionado. Si NO es Wompi
            // (es Contra entrega o Transferencia), aprobamos
            // la compra directamente sin pasar por la pasarela.
            const metodoSeleccionado = metodos.find(
                (m) => m.id === metodoPagoId
            );
            const esWompi =
                metodoSeleccionado?.tipo?.toLowerCase() ===
                "wompi";

            if (!esWompi) {
                // Para métodos distintos a Wompi (contra
                // entrega, transferencia), aprobamos la
                // compra directamente en el backend.
                await confirmarPago(compraId);
                await clear();
                navigate(
                    `/checkout/confirm?compra_id=${compraId}&simulated=1`,
                    { replace: true }
                );
                return;
            }

            // Crear transacción de Wompi y obtener datos para Web Checkout
            const { data: wompiData } = await crearTransaccionWompi(compraId);

            // Verificar si tenemos los datos necesarios para Web Checkout
            const {
                public_key,
                currency,
                amount_in_cents,
                reference,
                signature,
                redirect_url,
                simulated
            } = wompiData;

            if (!public_key || !currency || !amount_in_cents || !reference || !signature) {
                throw new Error(
                    "No se pudieron obtener los datos necesarios para el checkout de Wompi"
                );
            }

            // Si es modo simulado, redirigir directamente
            if (simulated) {
                await clear();
                window.location.href = redirect_url;
                return;
            }

            // Construir y enviar formulario para Web Checkout de Wompi
            const form = document.createElement('form');
            form.method = 'GET';
            form.action = 'https://checkout.wompi.co/p/';

            const fields = [
                { name: 'public-key', value: public_key },
                { name: 'currency', value: currency },
                { name: 'amount-in-cents', value: amount_in_cents },
                { name: 'reference', value: reference },
                { name: 'signature:integrity', value: signature.integrity },
            ];

            if (redirect_url) {
                fields.push({ name: 'redirect-url', value: redirect_url });
            }

            fields.forEach(field => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = field.name;
                input.value = field.value;
                form.appendChild(input);
            });

            document.body.appendChild(form);

            // Vaciar carrito local antes de redirigir
            await clear();

            // Enviar formulario para redirigir a Wompi
            form.submit();

        } catch (err) {
            console.error("Checkout error:", err);
            const msg =
                err?.response?.data?.wompi_response ||
                err?.response?.data?.detail ||
                err?.response?.data?.error ||
                err?.message ||
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

                <Breadcrumb
                    items={[
                        { label: "Carrito", to: "/cart" },
                        { label: "Checkout" }
                    ]}
                />

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
                            <p>Selecciona tu método de pago preferido.</p>

                            {metodos.length === 0 ? (
                                <div className="checkout-no-options">
                                    No hay métodos de pago disponibles.
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
                                                <span>{m.detalle}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* ACEPTACIONES LEGALES */}
                        <section className="checkout-card">
                            <h2>
                                <LockKeyhole size={18} /> Aceptaciones legales
                            </h2>
                            <p>Para continuar con tu compra, debes aceptar los siguientes documentos:</p>

                            <div className="checkout-legal-section">
                                <label className="checkout-legal-option">
                                    <input
                                        type="checkbox"
                                        checked={terminosAceptados}
                                        onChange={(e) => setTerminosAceptados(e.target.checked)}
                                    />
                                    <span>
                                        He leído y acepto los <strong>Términos y Condiciones</strong> de VentasYa.
                                        <a
                                            href="/terminos-y-condiciones"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="checkout-legal-link"
                                        >
                                            [Leer documento]
                                        </a>
                                    </span>
                                </label>

                                <label className="checkout-legal-option">
                                    <input
                                        type="checkbox"
                                        checked={datosAceptados}
                                        onChange={(e) => setDatosAceptados(e.target.checked)}
                                    />
                                    <span>
                                        Autorizo el tratamiento de mis datos personales conforme a la <strong>Política de Tratamiento de Datos Personales</strong>.
                                        <a
                                            href="/politica-tratamiento-datos"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="checkout-legal-link"
                                        >
                                            [Leer documento]
                                        </a>
                                    </span>
                                </label>
                            </div>
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
                            <strong style={{ color: envioGratis ? "#0097A7" : "#031927" }}>
                                {envioGratis ? "Gratis" : "Por calcular"}
                            </strong>
                        </div>
                        <div className="checkout-summary-divider" />
                        <div className="checkout-summary-row checkout-summary-total">
                            <span>Total</span>
                            <strong>{formatearPesos(totalFinal)}</strong>
                        </div>

                        <button
                            type="button"
                            className="checkout-pay"
                            onClick={handlePagar}
                            disabled={
                                procesando ||
                                !direccionId ||
                                !metodoPagoId ||
                                (esWompi && (!terminosAceptados || !datosAceptados))
                            }
                        >
                            {procesando ? (
                                <>
                                    <Loader2 size={16} className="checkout-spin" />
                                    Procesando pago...
                                </>
                            ) : (
                                <>
                                    <LockKeyhole size={16} />
                                    Pagar {formatearPesos(totalFinal)}
                                </>
                            )}
                        </button>

                        <Link
                            to="/cart"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                marginTop: 14,
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
