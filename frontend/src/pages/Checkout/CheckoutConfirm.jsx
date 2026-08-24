import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { consultarEstadoPago } from "../../services/paymentService";

import "./Checkout.css";

/**
 * Pantalla a la que Wompi redirige al cliente después del pago.
 *
 * Hace polling a /payments/wompi/status/ hasta que el webhook haya
 * procesado el pago (estado: aprobado | rechazado | expirado).
 */
function CheckoutConfirm() {

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [estado, setEstado] = useState("cargando");
    const [detalle, setDetalle] = useState(null);
    const [error, setError] = useState(null);

    const intentosRef = useRef(0);
    const MAX_INTENTOS = 20; // ~40s de polling (20 × 2s)

    useEffect(() => {
        const compraId = searchParams.get("compra_id");

        if (!compraId) {
            setError("No se encontró el ID de la compra.");
            setEstado("error");
            return;
        }

        const verificar = async () => {
            try {
                const { data } = await consultarEstadoPago(compraId);

                if (data.estado === "aprobado") {
                    setEstado("aprobado");
                    setDetalle(data);
                    setTimeout(() => {
                        navigate("/orders", { replace: true });
                    }, 3000);
                    return;
                }

                if (data.estado === "rechazado") {
                    setEstado("rechazado");
                    setDetalle(data);
                    return;
                }

                if (data.estado === "expirado") {
                    setEstado("expirado");
                    setDetalle(data);
                    return;
                }

                // Sigue pendiente → reintentar
                intentosRef.current += 1;
                if (intentosRef.current < MAX_INTENTOS) {
                    setTimeout(verificar, 2000);
                } else {
                    setError(
                        "Tu pago está siendo procesado. Te avisaremos cuando se confirme."
                    );
                    setEstado("procesando");
                }
            } catch (err) {
                console.error("Error verificando pago:", err);
                setError("Error al verificar el estado del pago.");
                setEstado("error");
            }
        };

        verificar();
    }, [searchParams, navigate]);

    return (
        <main className="checkout-page">
            <div className="checkout-container">
                <div className="checkout-confirm">

                    {estado === "cargando" && (
                        <>
                            <Loader2 size={48} className="checkout-spin" />
                            <h2>Verificando tu pago...</h2>
                            <p>
                                Estamos confirmando la transacción con Wompi.
                                No cierres esta ventana.
                            </p>
                        </>
                    )}

                    {estado === "aprobado" && (
                        <>
                            <CheckCircle2 size={48} className="checkout-success" />
                            <h2>¡Pago exitoso!</h2>
                            <p>
                                Tu pedido por{" "}
                                <strong>
                                    {detalle?.monto
                                        ? `$${Number(detalle.monto).toLocaleString("es-CO")}`
                                        : ""}
                                </strong>{" "}
                                fue confirmado.
                            </p>
                            <p>Redirigiendo a tus pedidos...</p>
                        </>
                    )}

                    {estado === "rechazado" && (
                        <>
                            <XCircle size={48} className="checkout-error-icon" />
                            <h2>Pago rechazado</h2>
                            <p>
                                La transacción fue rechazada por Wompi o tu banco.
                                Por favor intenta nuevamente o usa otro método de
                                pago.
                            </p>
                            <button
                                className="checkout-pay"
                                onClick={() => navigate("/cart")}
                            >
                                Volver al carrito
                            </button>
                        </>
                    )}

                    {estado === "expirado" && (
                        <>
                            <XCircle size={48} className="checkout-error-icon" />
                            <h2>Pago expirado</h2>
                            <p>
                                No recibimos confirmación del pago dentro del
                                tiempo establecido. Tu pedido fue cancelado y el
                                stock liberado. Intenta de nuevo.
                            </p>
                            <button
                                className="checkout-pay"
                                onClick={() => navigate("/cart")}
                            >
                                Volver al carrito
                            </button>
                        </>
                    )}

                    {estado === "procesando" && (
                        <>
                            <Loader2 size={48} className="checkout-spin" />
                            <h2>Tu pago está siendo procesado</h2>
                            <p>
                                {error ||
                                    "Wompi está procesando tu pago. Te avisaremos cuando se confirme."}
                            </p>
                            <button
                                className="checkout-pay"
                                onClick={() => navigate("/orders")}
                            >
                                Ir a mis pedidos
                            </button>
                        </>
                    )}

                    {estado === "error" && (
                        <>
                            <XCircle size={48} className="checkout-error-icon" />
                            <h2>Error</h2>
                            <p>{error || "Ocurrió un error al procesar tu pago."}</p>
                            <button
                                className="checkout-pay"
                                onClick={() => navigate("/cart")}
                            >
                                Volver al carrito
                            </button>
                        </>
                    )}

                </div>
            </div>
        </main>
    );
}

export default CheckoutConfirm;
