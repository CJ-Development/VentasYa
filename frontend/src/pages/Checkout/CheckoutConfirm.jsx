import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { consultarEstadoPago, confirmarPago } from "../../services/paymentService";

import "./Checkout.css";

function CheckoutConfirm() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [estado, setEstado] = useState("cargando");
    const [error, setError] = useState(null);
    const [intentos, setIntentos] = useState(0);
    const MAX_INTENTOS = 15; // Máximo 30 segundos (15 intentos × 2 segundos)

    useEffect(() => {
        const verificarPago = async () => {
            const compraId = searchParams.get("compra_id");
            const isSimulated =
                searchParams.get("simulated") === "1";

            if (!compraId) {
                setError("No se encontró el ID de la compra");
                setEstado("error");
                return;
            }

            try {
                // Si viene el flag de simulación o el pago es
                // SIM-*, aprobamos directamente sin pasar por
                // Wompi. Esto cubre dos casos:
                // 1. Wompi no configurado (simulación).
                // 2. Métodos distintos a Wompi (contra entrega,
                //    transferencia bancaria).
                if (isSimulated) {
                    try {
                        await confirmarPago(compraId);
                    } catch (e) {
                        // Si ya estaba aprobado o el pago no
                        // existe, ignoramos. El endpoint
                        // /wompi/status también lo aprobará.
                    }
                }

                // Consultar estado del pago (esto también
                // aprueba automáticamente las simulaciones).
                const { data } = await consultarEstadoPago(compraId);

                if (data.estado === "aprobado") {
                    setEstado("aprobado");
                    // Redirigir a mis pedidos después de 3 segundos
                    setTimeout(() => {
                        navigate("/orders", { replace: true });
                    }, 3000);
                } else if (data.estado === "rechazado") {
                    setEstado("rechazado");
                } else {
                    // Si sigue pendiente, reintentar después de 2 segundos
                    // pero con un límite de intentos para evitar loops infinitos
                    if (intentos < MAX_INTENTOS) {
                        setIntentos(prev => prev + 1);
                        setTimeout(() => verificarPago(), 2000);
                    } else {
                        // Si después de varios intentos sigue pendiente,
                        // mostramos un mensaje indicando que se está procesando
                        setError("El pago está siendo procesado. Te notificaremos cuando se confirme.");
                        setEstado("procesando");
                    }
                }
            } catch (err) {
                console.error("Error verificando pago:", err);
                setError("Error al verificar el estado del pago");
                setEstado("error");
            }
        };

        verificarPago();
    }, [searchParams, navigate, intentos]);

    return (
        <main className="checkout-page">
            <div className="checkout-container">
                <div className="checkout-confirm">
                    {estado === "cargando" && (
                        <>
                            <Loader2 size={48} className="checkout-spin" />
                            <h2>Verificando tu pago...</h2>
                            <p>Por favor espera mientras confirmamos la transacción con Wompi.</p>
                        </>
                    )}

                    {estado === "aprobado" && (
                        <>
                            <CheckCircle2 size={48} className="checkout-success" />
                            <h2>¡Pago exitoso!</h2>
                            <p>Tu pedido ha sido confirmado y será procesado.</p>
                            <p>Redirigiendo a tus pedidos...</p>
                        </>
                    )}

                    {estado === "rechazado" && (
                        <>
                            <XCircle size={48} className="checkout-error-icon" />
                            <h2>Pago rechazado</h2>
                            <p>La transacción fue rechazada. Por favor intenta nuevamente o usa otro método de pago.</p>
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
                            <p>{error || "El pago está siendo procesado por Wompi. Te notificaremos cuando se confirme."}</p>
                            <p>Puedes verificar el estado en tus pedidos.</p>
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
