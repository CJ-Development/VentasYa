import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";

import "./Legal.css";

function PoliticaDatos() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="legal-back-link">
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>

        <h1>Política de Tratamiento de Datos Personales</h1>
        <p className="legal-updated">Última actualización: Enero 2026</p>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Responsable del Tratamiento</h2>
            <p>
              Baúl Mágico Shop, identificado con NIT xxxxxxxxxxx-x, es responsable del tratamiento 
              de sus datos personales conforme a la Ley 1581 de 2012 de Habeas Data en Colombia.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Datos Personales que Recopilamos</h2>
            <p>
              Recopilamos los siguientes datos personales para facilitar sus compras:
            </p>
            <ul>
              <li><strong>Datos de identificación:</strong> Nombre completo, email, teléfono</li>
              <li><strong>Datos de ubicación:</strong> Dirección de envío, ciudad, departamento</li>
              <li><strong>Datos de pago:</strong> Información necesaria para procesar pagos</li>
              <li><strong>Datos de cuenta:</strong> Usuario y contraseña para autenticación</li>
              <li><strong>Datos de navegación:</strong> Historial de compras, productos favoritos</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Finalidad del Tratamiento</h2>
            <p>
              Sus datos personales son tratados para las siguientes finalidades:
            </p>
            <ul>
              <li>Procesar sus pedidos y pagos</li>
              <li>Enviar confirmaciones y actualizaciones de estado</li>
              <li>Personalizar su experiencia de compra</li>
              <li>Mejorar nuestros servicios y productos</li>
              <li>Cumplir con obligaciones legales y fiscales</li>
              <li>Prevenir fraudes y asegurar la seguridad de la plataforma</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Base Legal del Tratamiento</h2>
            <p>
              El tratamiento de sus datos personales se fundamenta en:
            </p>
            <ul>
              <li><strong>Consentimiento:</strong> Usted autoriza expresamente el tratamiento al aceptar esta política</li>
              <li><strong>Contrato:</strong> Ejecución del contrato de compra</li>
              <li><strong>Obligación legal:</strong> Cumplimiento de la Ley 1581 de 2012</li>
              <li><strong>Interés legítimo:</strong> Procesamiento de pagos y entregas</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Derechos de los Titulares</h2>
            <p>
              Como titular de sus datos personales, usted tiene los siguientes derechos:
            </p>
            <ul>
              <li><strong>Derecho de acceso:</strong> Solicitar información sobre sus datos personales</li>
              <li><strong>Derecho de rectificación:</strong> Solicitar corrección de datos inexactos</li>
              <li><strong>Derecho de supresión:</strong> Solicitar eliminación de sus datos</li>
              <li><strong>Derecho de revocación:</strong> Retirar su consentimiento en cualquier momento</li>
              <li><strong>Derecho de oposición:</strong> Oponerse al tratamiento de sus datos</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Medidas de Seguridad</h2>
            <p>
              Implementamos medidas técnicas y organizativas para proteger sus datos personales:
            </p>
            <ul>
              <li>Encriptación de datos sensibles</li>
              <li>Control de acceso a la información</li>
              <li>Protocolos seguros de transmisión de datos (HTTPS)</li>
              <li>Monitoreo continuo de sistemas de seguridad</li>
              <li>Capacitación del personal en protección de datos</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Transferencia Internacional de Datos</h2>
            <p>
              Sus datos pueden ser transferidos y procesados en servidores ubicados fuera de Colombia 
              para fines de almacenamiento y procesamiento de pagos. Nos aseguramos de que 
              estos datos sean tratados con el mismo nivel de protección que en Colombia.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Cookies y Tecnologías Similares</h2>
            <p>
              Utilizamos cookies y tecnologías similares para mejorar su experiencia:
            </p>
            <ul>
              <li>Cookies esenciales para el funcionamiento del sitio</li>
              <li>Cookies de análisis para entender el uso de nuestra plataforma</li>
              <li>Cookies de marketing para personalizar publicidad</li>
            </ul>
            <p>
              Puede configurar su navegador para rechazar cookies, aunque esto puede afectar 
              algunas funcionalidades del sitio.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Menores de Edad</h2>
            <p>
              No recopilamos deliberadamente datos personales de menores de edad. Si descubrimos 
              que hemos recopilado datos de un menor sin consentimiento parental, tomaremos medidas 
              para eliminarlos inmediatamente.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Cambios en esta Política</h2>
            <p>
              Podemos actualizar esta política de tratamiento de datos en cualquier momento. 
              Le notificaremos sobre cambios significativos a través de nuestra plataforma 
              o por email. El uso continuo del servicio después de los cambios constituye 
              aceptación de la política actualizada.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Contacto para Datos Personales</h2>
            <p>
              Para ejercer sus derechos de protección de datos o para cualquier pregunta sobre 
              esta política, puede contactarnos en:
            </p>
            <p className="legal-contact">
              <strong>Email:</strong> privacidad@baulmagicoshop.com<br />
              <strong>Teléfono:</strong> +57 1 234 5678<br />
              <strong>Dirección:</strong> [Dirección física de Baúl Mágico Shop]<br />
              <strong>Correo físico:</strong> Carrera xx # xx-xx, Bogotá, Colombia
            </p>
          </section>
        </div>

        <div className="legal-footer">
          <p>© 2026 Baúl Mágico Shop. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}

export default PoliticaDatos;
