import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    Loader2,
    Phone,
    ShieldCheck,
    AlertCircle,
    ShoppingBag,
    ArrowRight,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";

import Breadcrumb from "../../components/Breadcrumb/Breadcrumb";

import NoImage from "../../assets/images/no-image.png";
import { mediaUrl } from "../../utils/mediaUrl";
import { createOrderFromCart } from "../../services/clientService";
import api from "../../services/api";

import "./Checkout.css";

const formatearPesos = (valor) => {
    const numero = Number(valor);
    if (Number.isNaN(numero)) return "$0";
    return `$${numero.toLocaleString("es-CO")}`;
};

function Checkout() {
    const { usuario } = useAuth();
    const { items, total, loading: cartLoading } = useCart();
    const navigate = useNavigate();

    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");

    const [terminosAceptados, setTerminosAceptados] = useState(false);
    const [datosAceptados, setDatosAceptados] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    
    // Estados para validación de campos individuales
    const [nombreError, setNombreError] = useState("");
    const [telefonoError, setTelefonoError] = useState("");
    const [terminosError, setTerminosError] = useState("");
    const [datosError, setDatosError] = useState("");

    // Cargar datos del usuario si está autenticado
    useEffect(() => {
        if (usuario) {
            if (usuario.nombres) {
                setNombre(usuario.nombres);
            }
            if (usuario.telefono) {
                setTelefono(usuario.telefono);
            }
        }
    }, [usuario]);

    // Redirigir si el carrito está vacío
    useEffect(() => {
        if (!cartLoading && items.length === 0) {
            navigate("/cart");
        }
    }, [items, cartLoading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones mejoradas
        const validationErrors = [];

            // Validar nombre
        if (!nombre || nombre.trim().length < 2) {
            validationErrors.push("nombre");
            setNombreError("El nombre debe tener al menos 2 caracteres");
        } else {
            setNombreError("");
        }

        // Validar teléfono (formato colombiano: +57 3XX XXX XXXX o 3XX XXX XXXX)
        const telefonoRegex = /^(\+57\s?)?3\d{2}\s?\d{3}\s?\d{4}$/;
        if (!telefono || !telefonoRegex.test(telefono.trim())) {
            validationErrors.push("teléfono");
            setTelefonoError("Formato inválido. Usa: +57 3XX XXX XXXX o 3XX XXX XXXX");
        } else {
            setTelefonoError("");
        }

        // Validar términos y condiciones
        if (!terminosAceptados) {
            validationErrors.push("términos y condiciones");
            setTerminosError("Debes aceptar los Términos y Condiciones");
        } else {
            setTerminosError("");
        }

        // Validar política de privacidad
        if (!datosAceptados) {
            validationErrors.push("política de privacidad");
            setDatosError("Debes aceptar la Política de Privacidad");
        } else {
            setDatosError("");
        }

        // Validar que el carrito no esté vacío
        if (!items || items.length === 0) {
            validationErrors.push("carrito vacío");
        }

        // Validar que todos los items tengan datos necesarios
        const invalidItems = items.filter(item => 
            !item.variante_id || 
            !item.cantidad || 
            item.cantidad < 1 ||
            !item.producto_nombre ||
            !item.producto_precio
        );

        if (invalidItems.length > 0) {
            validationErrors.push("datos del producto");
        }

        // Mostrar errores específicos
        if (validationErrors.length > 0) {
            const errorMessages = {
                "nombre": "El nombre debe tener al menos 2 caracteres",
                "teléfono": "El teléfono debe tener formato colombiano (+57 3XX XXX XXXX o 3XX XXX XXXX)",
                "términos y condiciones": "Debes aceptar los Términos y Condiciones",
                "política de privacidad": "Debes aceptar la Política de Privacidad",
                "carrito vacío": "El carrito está vacío. Agrega productos antes de continuar.",
                "datos del producto": "Algunos productos tienen datos incompletos. Por favor contáctanos."
            };

            const specificErrors = validationErrors.map(error => errorMessages[error]).join(". ");
            setError(specificErrors);
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const response = await createOrderFromCart({
                usuario_id: usuario?.id_usuario || null,
                direccion_id: null,
                nombre_cliente: nombre,
                telefono_contacto: telefono,
                terminos_aceptados: terminosAceptados,
                datos_aceptados: datosAceptados,
                items: items.map((item) => ({
                    variante_id: item.variante_id,
                    cantidad: item.cantidad,
                })),
            });

            // Logs de diagnóstico para producción
            console.log("[Checkout] response.data:", response.data);
            console.log("[Checkout] compra_id:", response.data?.compra_id);
            console.log("[Checkout] referencia:", response.data?.referencia);

            // Validar respuesta del backend
            if (!response.data || !response.data.whatsapp_number) {
                setError("No se pudo obtener el número de WhatsApp. Intenta nuevamente.");
                return;
            }

            if (!response.data.cliente || !response.data.productos) {
                setError("La respuesta del servidor no tiene el formato esperado.");
                return;
            }

            // Generar mensaje de WhatsApp
            const mensaje = generarMensajeWhatsApp(response.data);
            const encodedMessage = encodeURIComponent(mensaje);
            const whatsappUrl = `https://wa.me/${response.data.whatsapp_number}?text=${encodedMessage}`;

            console.log("Abriendo WhatsApp:", whatsappUrl);

            // Abrir WhatsApp
            window.open(whatsappUrl, "_blank");

            // Redirigir a home después de un breve delay
            setTimeout(() => {
                navigate("/");
            }, 500);
        } catch (err) {
            console.error("Error al crear pedido:", err);
            setError("No pudimos registrar tu pedido. Por favor inténtalo nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const generarMensajeWhatsApp = (data) => {
        const { cliente, productos, total, referencia, compra_id } = data;

        // Formatear referencia con formato BMS-XXXXX
        const formatearReferencia = (ref, id) => {
            // Si la referencia ya viene formateada (ej: "#55" o "#BMS-00055"), usarla
            if (ref && typeof ref === 'string') {
                // Si ya tiene formato BMS, devolverla tal cual
                if (ref.includes('BMS')) return ref;
                // Si es solo un número con #, formatearlo
                if (ref.startsWith('#')) {
                    const numRef = ref.replace('#', '');
                    const paddedId = String(numRef).padStart(5, '0');
                    return `#BMS-${paddedId}`;
                }
                return ref;
            }
            // Si no hay referencia, usar el ID de compra
            if (id != null) {
                const paddedId = String(id).padStart(5, '0');
                return `#BMS-${paddedId}`;
            }
            return "Pendiente";
        };

        const referenciaFinal = formatearReferencia(referencia, compra_id);

        console.log("[Checkout] referenciaFinal:", referenciaFinal);

        // Emojis como Unicode para asegurar encoding correcto
        const EMOJIS = {
            cart: '\uD83D\uDECD', // 🛒
            tag: '\uD83D\uDCC3', // 🔖
            person: '\uD83D\uDC64', // 👤
            phone: '\uD83D\uDCF1', // 📱
            box: '\uD83D\uDCE6', // 📦
            money: '\uD83D\uDCB0', // 💰
        };

        let mensaje = `${EMOJIS.cart} *Nuevo pedido - Baúl Mágico Shop*\n\n`;
        mensaje += `${EMOJIS.tag} *Referencia:* ${referenciaFinal}\n`;
        mensaje += `${EMOJIS.person} *Cliente:* ${cliente.nombre}\n`;
        mensaje += `${EMOJIS.phone} *Teléfono:* ${cliente.telefono}\n\n`;
        mensaje += `${EMOJIS.box} *Productos:*\n\n`;

        productos.forEach((p) => {
            mensaje += `${p.cantidad}x ${p.nombre}\n`;
            if (p.color || p.talla) {
                mensaje += `${p.color ? p.color : ""}${p.color && p.talla ? " / " : ""}${p.talla ? p.talla : ""}\n`;
            }
            mensaje += `Subtotal: ${formatearPesos(p.subtotal)}\n\n`;
        });

        mensaje += `${EMOJIS.money} *Total:* ${formatearPesos(total)}\n\n`;
        mensaje += "Pedido realizado desde Baúl Mágico Shop";

        return mensaje;
    };

    if (cartLoading) {
        return (
            <main className="checkout-page">
                <div className="checkout-container">
                    <div className="checkout-loading">
                        <Loader2 size={32} className="spin" />
                        <h2>Cargando...</h2>
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
                        <ShoppingBag size={48} />
                        <h2>Tu carrito está vacío</h2>
                        <p>Agrega productos para continuar con tu compra.</p>
                        <button
                            type="button"
                            className="checkout-primary-button"
                            onClick={() => navigate("/")}
                        >
                            Ir a comprar
                            <ArrowRight size={17} />
                        </button>
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
                        { label: "Carrito", path: "/cart" },
                        { label: "Checkout" }
                    ]}
                />

                <header className="checkout-header">
                    <div>
                        <span className="checkout-eyebrow">FINALIZAR COMPRA</span>
                        <h1>Checkout</h1>
                        <p>Revisa tu pedido y confirma los datos de envío.</p>
                    </div>
                </header>

                {error && (
                    <div className="checkout-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => setError(null)}
                            aria-label="Cerrar error"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="checkout-layout">
                    {/* Columna izquierda: Formulario */}
                    <section className="checkout-form-section">
                        {/* Datos del cliente */}
                        <div className="checkout-card">
                            <div className="checkout-card-header">
                                <Phone size={18} />
                                <h2>Datos del cliente</h2>
                            </div>

                            <form className="checkout-form" onSubmit={handleSubmit}>
                                <div className="checkout-form-group">
                                    <label htmlFor="nombre">Nombre completo *</label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        required
                                        value={nombre}
                                        onChange={(e) => {
                                            setNombre(e.target.value);
                                            setNombreError("");
                                        }}
                                        placeholder="Tu nombre completo"
                                        className={nombreError ? "checkout-input-error" : ""}
                                    />
                                    {nombreError && (
                                        <small className="checkout-error-text">{nombreError}</small>
                                    )}
                                </div>

                                <div className="checkout-form-group">
                                    <label htmlFor="telefono">Número de WhatsApp *</label>
                                    <input
                                        type="tel"
                                        id="telefono"
                                        required
                                        value={telefono}
                                        onChange={(e) => {
                                            setTelefono(e.target.value);
                                            setTelefonoError("");
                                        }}
                                        placeholder="+57 318 1174546"
                                        className={telefonoError ? "checkout-input-error" : ""}
                                    />
                                    <small className="checkout-form-hint">Tu pedido será confirmado por WhatsApp a este número</small>
                                    {telefonoError && (
                                        <small className="checkout-error-text">{telefonoError}</small>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Términos */}
                        <div className="checkout-card">
                            <div className="checkout-card-header">
                                <ShieldCheck size={18} />
                                <h2>Términos y condiciones</h2>
                            </div>

                            <div className="checkout-terms">
                                <label className={`checkout-checkbox-label ${terminosError ? "error" : ""}`}>
                                    <input
                                        type="checkbox"
                                        checked={terminosAceptados}
                                        onChange={(e) => {
                                            setTerminosAceptados(e.target.checked);
                                            setTerminosError("");
                                        }}
                                    />
                                    <span>
                                        He leído y acepto los <a href="/Legal/Autorizacion_Tratamiento_Datos_Baul_Magico.pdf" target="_blank" rel="noopener noreferrer">términos y condiciones</a>
                                    </span>
                                </label>
                                {terminosError && (
                                    <span className="checkout-checkbox-error">{terminosError}</span>
                                )}

                                <label className={`checkout-checkbox-label ${datosError ? "error" : ""}`}>
                                    <input
                                        type="checkbox"
                                        checked={datosAceptados}
                                        onChange={(e) => {
                                            setDatosAceptados(e.target.checked);
                                            setDatosError("");
                                        }}
                                    />
                                    <span>
                                        Autorizo el tratamiento de mis datos personales según la <a href="/Legal/Politica_de_Privacidad_Baul_Magico.pdf" target="_blank" rel="noopener noreferrer">política de privacidad</a>
                                    </span>
                                </label>
                                {datosError && (
                                    <span className="checkout-checkbox-error">{datosError}</span>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="checkout-submit-button"
                            onClick={handleSubmit}
                            disabled={
                                isSubmitting ||
                                !nombre ||
                                nombre.trim().length < 2 ||
                                !telefono ||
                                !terminosAceptados ||
                                !datosAceptados ||
                                items.length === 0
                            }
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    Confirmar pedido por WhatsApp
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </section>

                    {/* Columna derecha: Resumen */}
                    <aside className="checkout-summary-section">
                        <div className="checkout-summary-card">
                            <div className="checkout-summary-header">
                                <h2>Resumen del pedido</h2>
                                <span className="checkout-summary-count">
                                    {items.length} {items.length === 1 ? "producto" : "productos"}
                                </span>
                            </div>

                            <div className="checkout-summary-items">
                                {items.map((item) => {
                                    const subtotal =
                                        Number(item.producto_precio || 0) *
                                        Number(item.cantidad || 0);
                                    const key = item.id_item || item.variante_id;

                                    return (
                                        <div key={key} className="checkout-summary-item">
                                            <div className="checkout-summary-item-image">
                                                <img
                                                    src={mediaUrl(item.imagen, NoImage)}
                                                    alt={item.producto_nombre}
                                                    onError={(e) => {
                                                        e.currentTarget.src = NoImage;
                                                    }}
                                                />
                                            </div>

                                            <div className="checkout-summary-item-info">
                                                <h4>{item.producto_nombre}</h4>
                                                {(item.color || item.talla) && (
                                                    <small>
                                                        {item.color && `Color: ${item.color}`}
                                                        {item.color && item.talla && " · "}
                                                        {item.talla && `Talla: ${item.talla}`}
                                                    </small>
                                                )}
                                                <div className="checkout-summary-item-qty">
                                                    <span>Cantidad: {item.cantidad}</span>
                                                    <span>{formatearPesos(item.producto_precio)}</span>
                                                </div>
                                            </div>

                                            <div className="checkout-summary-item-price">
                                                <strong>{formatearPesos(subtotal)}</strong>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="checkout-summary-divider" />

                            <div className="checkout-summary-total">
                                <div>
                                    <span>Total</span>
                                </div>
                                <strong>{formatearPesos(total)}</strong>
                            </div>

                            <p className="checkout-summary-note">
                                Al confirmar, se abrirá WhatsApp con los detalles de tu pedido.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}

export default Checkout;
