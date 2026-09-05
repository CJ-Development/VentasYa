import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Loader2,
    MapPin,
    Phone,
    Check,
    AlertCircle,
    ShoppingBag,
    ArrowRight,
    Plus,
    X,
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
    const { items, total, loading: cartLoading, recargar } = useCart();
    const navigate = useNavigate();

    const [direcciones, setDirecciones] = useState([]);
    const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
    const [mostrarFormularioDireccion, setMostrarFormularioDireccion] = useState(false);
    const [nuevaDireccion, setNuevaDireccion] = useState({
        direccion: "",
        ciudad: "",
        departamento: "",
        codigo_postal: "",
    });

    const [telefono, setTelefono] = useState("");
    const [terminosAceptados, setTerminosAceptados] = useState(false);
    const [datosAceptados, setDatosAceptados] = useState(false);

    const [loadingDirecciones, setLoadingDirecciones] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [carritoSincronizado, setCarritoSincronizado] = useState(false);

    // Refs para controlar la recarga del carrito
    const carritoRecargadoRef = useRef(false);
    const recargaEnCursoRef = useRef(false);

    // Cargar direcciones del usuario
    useEffect(() => {
        if (!usuario) return;

        const cargarDirecciones = async () => {
            try {
                setLoadingDirecciones(true);
                const response = await api.get(`/users/direcciones/?usuario_id=${usuario.id_usuario}`);
                setDirecciones(response.data);
                
                // Seleccionar la dirección predeterminada si existe
                const predeterminada = response.data.find(d => d.predeterminada);
                if (predeterminada) {
                    setDireccionSeleccionada(predeterminada.id_direccion);
                }
            } catch (err) {
                console.error("Error al cargar direcciones:", err);
                setError("Error al cargar las direcciones");
            } finally {
                setLoadingDirecciones(false);
            }
        };

        cargarDirecciones();
    }, [usuario]);

    // Cargar teléfono del usuario
    useEffect(() => {
        if (usuario?.telefono) {
            setTelefono(usuario.telefono);
        }
    }, [usuario]);

    // Recargar carrito al entrar a Checkout para asegurar datos actualizados
    useEffect(() => {
        const uid = usuario?.id_usuario;
        if (!uid) return;

        // Reiniciar control si cambia el usuario
        if (carritoRecargadoRef.current && !recargaEnCursoRef.current) {
            carritoRecargadoRef.current = false;
            setCarritoSincronizado(false);
        }

        // Evitar múltiples recargas simultáneas
        if (recargaEnCursoRef.current) return;

        // Solo recargar una vez por sesión de Checkout por usuario
        if (carritoRecargadoRef.current) return;

        const recargarCarrito = async () => {
            recargaEnCursoRef.current = true;
            try {
                await recargar();
                carritoRecargadoRef.current = true;
                setCarritoSincronizado(true);
            } catch (err) {
                console.error("Error al recargar carrito en Checkout:", err);
                setError("Error al cargar el carrito. Por favor, recarga la página.");
                setCarritoSincronizado(false);
            } finally {
                recargaEnCursoRef.current = false;
            }
        };

        recargarCarrito();
    }, [usuario?.id_usuario, recargar]);

    // Redirigir si no está autenticado
    useEffect(() => {
        if (!usuario && !cartLoading) {
            navigate("/login?from=/checkout");
        }
    }, [usuario, cartLoading, navigate]);

    // Redirigir si el carrito está vacío
    useEffect(() => {
        if (!cartLoading && items.length === 0) {
            navigate("/cart");
        }
    }, [items, cartLoading, navigate]);

    const handleCrearDireccion = async (e) => {
        e.preventDefault();
        
        try {
            setIsSubmitting(true);
            const response = await api.post("/users/direcciones/", {
                usuario: usuario.id_usuario,
                ...nuevaDireccion,
                predeterminada: direcciones.length === 0,
            });

            setDirecciones([...direcciones, response.data]);
            setDireccionSeleccionada(response.data.id_direccion);
            setMostrarFormularioDireccion(false);
            setNuevaDireccion({
                direccion: "",
                ciudad: "",
                departamento: "",
                codigo_postal: "",
            });
        } catch (err) {
            console.error("Error al crear dirección:", err);
            setError("Error al crear la dirección");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones
        if (!direccionSeleccionada) {
            setError("Debes seleccionar una dirección de envío");
            return;
        }

        if (!telefono || telefono.trim().length < 7) {
            setError("Debes ingresar un teléfono válido");
            return;
        }

        if (!terminosAceptados) {
            setError("Debes aceptar los términos y condiciones");
            return;
        }

        if (!datosAceptados) {
            setError("Debes autorizar el tratamiento de tus datos");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const response = await createOrderFromCart({
                usuario_id: usuario.id_usuario,
                direccion_id: direccionSeleccionada,
                telefono_contacto: telefono,
                terminos_aceptados: terminosAceptados,
                datos_aceptados: datosAceptados,
            });

            // Generar mensaje de WhatsApp
            const mensaje = generarMensajeWhatsApp(response.data);
            const encodedMessage = encodeURIComponent(mensaje);
            const whatsappUrl = `https://wa.me/${response.data.whatsapp_number}?text=${encodedMessage}`;

            // Abrir WhatsApp
            window.open(whatsappUrl, "_blank");

            // Redirigir a pedidos
            navigate("/orders");
        } catch (err) {
            console.error("Error al crear pedido:", err);
            setError(err.response?.data?.detail || "Error al crear el pedido. Intenta nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const generarMensajeWhatsApp = (data) => {
        const { cliente, direccion_envio, productos, total } = data;

        let mensaje = "🛒 *Nuevo pedido - Baúl Mágico Shop*\n\n";
        mensaje += `👤 *Cliente:* ${cliente.nombre}\n`;
        mensaje += `📱 *Teléfono:* ${cliente.telefono}\n\n`;
        mensaje += `📍 *Dirección de envío:*\n`;
        mensaje += `${direccion_envio.direccion}\n`;
        mensaje += `${direccion_envio.ciudad}, ${direccion_envio.departamento}\n`;
        if (direccion_envio.codigo_postal) {
            mensaje += `${direccion_envio.codigo_postal}\n`;
        }
        mensaje += "\n📦 *Productos:*\n\n";

        productos.forEach((p) => {
            mensaje += `${p.cantidad}x ${p.nombre}\n`;
            if (p.color || p.talla) {
                mensaje += `${p.color ? p.color : ""}${p.color && p.talla ? " / " : ""}${p.talla ? p.talla : ""}\n`;
            }
            mensaje += `Subtotal: ${formatearPesos(p.subtotal)}\n\n`;
        });

        mensaje += `💰 *Total:* ${formatearPesos(total)}\n\n`;
        mensaje += "Pedido realizado desde Baúl Mágico Shop";

        return mensaje;
    };

    if (!usuario || cartLoading) {
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
                        {/* Dirección */}
                        <div className="checkout-card">
                            <div className="checkout-card-header">
                                <MapPin size={18} />
                                <h2>Dirección de envío</h2>
                            </div>

                            {loadingDirecciones ? (
                                <div className="checkout-loading-small">
                                    <Loader2 size={20} className="spin" />
                                    <span>Cargando direcciones...</span>
                                </div>
                            ) : direcciones.length === 0 ? (
                                <div className="checkout-no-address">
                                    <p>No tienes direcciones guardadas.</p>
                                    <button
                                        type="button"
                                        className="checkout-secondary-button"
                                        onClick={() => setMostrarFormularioDireccion(true)}
                                    >
                                        <Plus size={16} />
                                        Agregar nueva dirección
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="checkout-address-list">
                                        {direcciones.map((dir) => (
                                            <label
                                                key={dir.id_direccion}
                                                className={`checkout-address-item ${
                                                    direccionSeleccionada === dir.id_direccion
                                                        ? "checkout-address-item--selected"
                                                        : ""
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="direccion"
                                                    value={dir.id_direccion}
                                                    checked={direccionSeleccionada === dir.id_direccion}
                                                    onChange={(e) =>
                                                        setDireccionSeleccionada(
                                                            Number(e.target.value)
                                                        )
                                                    }
                                                />
                                                <div className="checkout-address-content">
                                                    <div className="checkout-address-main">
                                                        <span className="checkout-address-text">
                                                            {dir.direccion}
                                                        </span>
                                                        {dir.predeterminada && (
                                                            <span className="checkout-address-badge">
                                                                Predeterminada
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="checkout-address-secondary">
                                                        {dir.ciudad}, {dir.departamento}
                                                    </div>
                                                </div>
                                                <div className="checkout-address-radio">
                                                    <Check size={16} />
                                                </div>
                                            </label>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        className="checkout-text-button"
                                        onClick={() => setMostrarFormularioDireccion(true)}
                                    >
                                        <Plus size={14} />
                                        Agregar nueva dirección
                                    </button>
                                </>
                            )}

                            {mostrarFormularioDireccion && (
                                <form
                                    className="checkout-new-address-form"
                                    onSubmit={handleCrearDireccion}
                                >
                                    <div className="checkout-form-group">
                                        <label htmlFor="direccion">Dirección *</label>
                                        <input
                                            type="text"
                                            id="direccion"
                                            required
                                            value={nuevaDireccion.direccion}
                                            onChange={(e) =>
                                                setNuevaDireccion({
                                                    ...nuevaDireccion,
                                                    direccion: e.target.value,
                                                })
                                            }
                                            placeholder="Calle 123 #45-67"
                                        />
                                    </div>

                                    <div className="checkout-form-row">
                                        <div className="checkout-form-group">
                                            <label htmlFor="ciudad">Ciudad *</label>
                                            <input
                                                type="text"
                                                id="ciudad"
                                                required
                                                value={nuevaDireccion.ciudad}
                                                onChange={(e) =>
                                                    setNuevaDireccion({
                                                        ...nuevaDireccion,
                                                        ciudad: e.target.value,
                                                    })
                                                }
                                                placeholder="Bogotá"
                                            />
                                        </div>

                                        <div className="checkout-form-group">
                                            <label htmlFor="departamento">Departamento *</label>
                                            <input
                                                type="text"
                                                id="departamento"
                                                required
                                                value={nuevaDireccion.departamento}
                                                onChange={(e) =>
                                                    setNuevaDireccion({
                                                        ...nuevaDireccion,
                                                        departamento: e.target.value,
                                                    })
                                                }
                                                placeholder="Cundinamarca"
                                            />
                                        </div>
                                    </div>

                                    <div className="checkout-form-group">
                                        <label htmlFor="codigo_postal">Código postal</label>
                                        <input
                                            type="text"
                                            id="codigo_postal"
                                            value={nuevaDireccion.codigo_postal}
                                            onChange={(e) =>
                                                setNuevaDireccion({
                                                    ...nuevaDireccion,
                                                    codigo_postal: e.target.value,
                                                })
                                            }
                                            placeholder="110111"
                                        />
                                    </div>

                                    <div className="checkout-form-actions">
                                        <button
                                            type="button"
                                            className="checkout-secondary-button"
                                            onClick={() => setMostrarFormularioDireccion(false)}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="checkout-primary-button"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 size={16} className="spin" />
                                                    Guardando...
                                                </>
                                            ) : (
                                                "Guardar dirección"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Teléfono */}
                        <div className="checkout-card">
                            <div className="checkout-card-header">
                                <Phone size={18} />
                                <h2>Teléfono de contacto</h2>
                            </div>

                            <div className="checkout-form-group">
                                <label htmlFor="telefono">Teléfono *</label>
                                <input
                                    type="tel"
                                    id="telefono"
                                    required
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value)}
                                    placeholder="3001234567"
                                />
                                <small>Número para contactarte sobre tu pedido</small>
                            </div>
                        </div>

                        {/* Aceptaciones legales */}
                        <div className="checkout-card">
                            <div className="checkout-card-header">
                                <Check size={18} />
                                <h2>Términos y condiciones</h2>
                            </div>

                            <div className="checkout-checkbox-group">
                                <label className="checkout-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={terminosAceptados}
                                        onChange={(e) =>
                                            setTerminosAceptados(e.target.checked)
                                        }
                                    />
                                    <span>
                                        Acepto los términos y condiciones de Baúl Mágico Shop *
                                    </span>
                                </label>

                                <label className="checkout-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={datosAceptados}
                                        onChange={(e) => setDatosAceptados(e.target.checked)}
                                    />
                                    <span>
                                        Autorizo el tratamiento de mis datos personales (Habeas Data) *
                                    </span>
                                </label>
                            </div>
                        </div>
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
                                                    <span>{formatearPesos(item.producto_precio)} c/u</span>
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
                                    <small>Impuestos incluidos</small>
                                </div>
                                <strong>{formatearPesos(total)}</strong>
                            </div>

                            <button
                                type="button"
                                className="checkout-submit-button"
                                onClick={handleSubmit}
                                disabled={
                                    !carritoSincronizado ||
                                    isSubmitting ||
                                    cartLoading ||
                                    !direccionSeleccionada ||
                                    !telefono ||
                                    !terminosAceptados ||
                                    !datosAceptados
                                }
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        Confirmar pedido y enviar por WhatsApp
                                        <ArrowRight size={17} />
                                    </>
                                )}
                            </button>

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
