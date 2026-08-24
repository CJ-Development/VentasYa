import { Link } from "react-router-dom";
import { Home, FileText, ArrowLeft } from "lucide-react";

import "./Legal.css";

function TerminosCondiciones() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="legal-back-link">
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>

        <h1>Términos y Condiciones de VentasYa</h1>
        <p className="legal-updated">Última actualización: Enero 2026</p>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar VentasYa, usted acepta estos Términos y Condiciones. 
              Si no está de acuerdo con estos términos, por favor no utilice nuestra plataforma.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Descripción del Servicio</h2>
            <p>
              VentasYa es una plataforma de comercio electrónico que permite a los usuarios 
              explorar, seleccionar y adquirir productos de diversos vendedores. Nosotros facilitamos 
              la plataforma pero no somos responsables de los productos ni servicios ofrecidos 
              por los vendedores.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. Registro y Cuenta de Usuario</h2>
            <p>
              Para realizar compras en VentasYa, debe crear una cuenta. Usted es responsable de:
            </p>
            <ul>
              <li>Mantener la confidencialidad de su contraseña</li>
              <li>Proporcionar información veraz y actual</li>
              <li>Notificarnos cualquier uso no autorizado de su cuenta</li>
              <li>Tener al menos 18 años de edad o capacidad legal para contratar</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Proceso de Compra</h2>
            <p>
              Al realizar una compra en VentasYa, usted:
            </p>
            <ul>
              <li>Revisa la información del producto antes de comprar</li>
              <li>Selecciona el método de pago disponible</li>
              <li>Proporciona información de envío precisa</li>
              <li>Acepta los términos del vendedor específico si aplica</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Precios y Pagos</h2>
            <p>
              Todos los precios mostrados en VentasYa están establecidos por los vendedores 
              y pueden cambiar sin previo aviso. Nosotros no somos responsables por los precios 
              ni por cambios en los mismos.
            </p>
            <p>
              Ofrecemos varios métodos de pago seguros incluyendo pasarelas de pago certificadas. 
              Al realizar un pago, usted autoriza el cargo correspondiente.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Envíos y Entregas</h2>
            <p>
              Los tiempos y costos de envío son responsabilidad del vendedor. VentasYa no 
              garantiza tiempos de entrega exactos ni se hace responsable por retrasos en 
              las entregas.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Devoluciones y Reembolsos</h2>
            <p>
              Las políticas de devolución son establecidas por cada vendedor. VentasYa actúa 
              como intermediario pero no se hace responsable por las políticas de devolución 
              de terceros.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Propiedad Intelectual</h2>
            <p>
              Todo el contenido de VentasYa (imágenes, textos, logotipos, diseño) está protegido 
              por derechos de autor. No está permitido copiar, reproducir o distribuir nuestro 
              contenido sin autorización expresa.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Limitación de Responsabilidad</h2>
            <p>
              VentasYa no se hace responsable por:
            </p>
            <ul>
              <li>Calidad, seguridad o idoneidad de los productos</li>
              <li>Daños directos o indirectos causados por el uso de productos</li>
              <li>Interrupciones del servicio o problemas técnicos</li>
              <li>Contenido proporcionado por vendedores o usuarios</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>10. Modificaciones de los Términos</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. 
              Las modificaciones entrarán en vigor tan pronto como se publiquen en 
              nuestra plataforma. El uso continuado del servicio constituye aceptación 
              de los términos modificados.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Contacto</h2>
            <p>
              Para cualquier pregunta sobre estos Términos y Condiciones, puede contactarnos en:
            </p>
            <p className="legal-contact">
              <strong>Email:</strong> soporte@ventasya.com<br />
              <strong>Sitio web:</strong> https://ventasya.com
            </p>
          </section>
        </div>

        <div className="legal-footer">
          <p>© 2026 VentasYa. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}

export default TerminosCondiciones;
