import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { consultarEstadoPago } from "../../services/paymentService";

import "./Checkout.css";

function CheckoutConfirm() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [estado, setEstado] = useState("cargando");
    const [error, setError] = useState(null);

    useEffect(() => {
        const verificarPago = async () => {
            const compraId = searchParams.get("compra_id");
            
            if (!compraId) {
                setError("No se encontró el ID de la compra");
                setEstado("error");
                return;
            }

            try {
                // Consultar estado del pago en Wompi
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
                    setTimeout(() => verificarPago(), 2000);
                }
            } catch (err) {
                console.error("Error verificando pago:", err);
                setError("Error al verificar el estado del pago");
                setEstado("error");
            }
        };

        verificarPago();
    }, [searchParams, navigate]);

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
