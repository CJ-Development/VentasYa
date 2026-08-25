import { useEffect, useRef } from "react";

/**
 * Widget de Wompi embebido.
 *
 * Renderiza el <script> oficial de Wompi DENTRO del JSX. Wompi reemplaza
 * este script por su propio botón + modal. El botón aparece justo aquí,
 * no en document.body.
 *
 * Docs: https://docs.wompi.co/docs/widget-de-pagos
 *
 * Props (todas vienen del backend /payments/wompi/widget-data/):
 *   - publicKey
 *   - currency          (ej: "COP")
 *   - amountInCents     (entero)
 *   - reference         (string único)
 *   - signatureIntegrity (SHA256 del backend)
 *   - redirectUrl       (a dónde volver tras pagar)
 *   - customerEmail     (opcional, antifraude)
 */
function WompiWidget({
    publicKey,
    currency,
    amountInCents,
    reference,
    signatureIntegrity,
    redirectUrl,
    customerEmail,
}) {
    const containerRef = useRef(null);

    useEffect(() => {
        // Limpiar contenedor antes de inyectar (evitar duplicados si
        // las props cambian).
        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = "";

        // Crear <form><script data-...></script></form> que Wompi reemplaza.
        const form = document.createElement("form");
        const script = document.createElement("script");
        script.src = "https://checkout.wompi.co/widget.js";
        script.async = true;
        script.setAttribute("data-render", "button");
        script.setAttribute("data-public-key", publicKey);
        script.setAttribute("data-currency", currency);
        script.setAttribute("data-amount-in-cents", String(amountInCents));
        script.setAttribute("data-reference", reference);
        script.setAttribute("data-signature:integrity", signatureIntegrity);

        if (customerEmail) {
            script.setAttribute("data-customer-email", customerEmail);
        }

        if (redirectUrl) {
            script.setAttribute("data-redirect-url", redirectUrl);
        }

        form.appendChild(script);
        container.appendChild(form);

        // Cleanup: si el componente se desmonta, quitar el form.
        return () => {
            if (container) container.innerHTML = "";
        };
    }, [
        publicKey,
        currency,
        amountInCents,
        reference,
        signatureIntegrity,
        redirectUrl,
        customerEmail,
    ]);

    return (
        <div
            ref={containerRef}
            className="wompi-widget-container"
        />
    );
}

export default WompiWidget;
