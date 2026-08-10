import "./Profile.css";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import ProductDetail from "../Products/ProductDetail/ProductDetail";

import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Calendar,
    CreditCard,
    MapPin,
    ShieldCheck,
    Lock,
    Pencil,
    BadgeCheck
} from "lucide-react";

function Profile() {

    const { usuario } = useAuth();

    // Estado listo para cuando se listen productos del usuario (pedidos/direcciones).
    const [selectedProductId, setSelectedProductId] = useState(null);

    return (

        <main className="profile-page">

            <div className="profile-container">

                <div className="profile-topbar">

                    <Link to="/" className="back-home">

                        <ArrowLeft size={18} />

                        Volver al inicio

                    </Link>

                </div>

                <section className="profile-header">

                    <div className="profile-avatar">

                        {usuario?.nombres?.charAt(0).toUpperCase()}

                    </div>

                    <div className="profile-info">

                        <span className="profile-badge">

                            <BadgeCheck size={18} />

                            Cliente Verificado

                        </span>

                        <h1>

                            {usuario?.nombres} {usuario?.apellidos}

                        </h1>

                        <p>

                            Administra tu información personal, direcciones,
                            métodos de acceso y mantén tu cuenta siempre segura.

                        </p>

                    </div>

                </section>

                <section className="profile-card">

                    <div className="card-header">

                        <div>

                            <h2>

                                Información Personal

                            </h2>

                            <p>

                                Estos datos identifican tu cuenta dentro de VentasYa.

                            </p>

                        </div>

                        <button className="profile-button">

                            <Pencil size={18} />

                            Editar

                        </button>

                    </div>

                    <div className="profile-grid">

                        <div className="profile-item">

                            <User size={20} />

                            <div>

                                <small>Nombre completo</small>

                                <span>

                                    {usuario?.nombres} {usuario?.apellidos}

                                </span>

                            </div>

                        </div>

                        <div className="profile-item">

                            <Mail size={20} />

                            <div>

                                <small>Correo electrónico</small>

                                <span>

                                    {usuario?.email}

                                </span>

                            </div>

                        </div>

                        <div className="profile-item">

                            <Phone size={20} />

                            <div>

                                <small>Celular</small>

                                <span>

                                    {usuario?.telefono}

                                </span>

                            </div>

                        </div>

                        <div className="profile-item">

                            <CreditCard size={20} />

                            <div>

                                <small>Documento</small>

                                <span>

                                    {usuario?.tipo_documento} {usuario?.numero_documento}

                                </span>

                            </div>

                        </div>

                        <div className="profile-item">

                            <Calendar size={20} />

                            <div>

                                <small>Fecha de nacimiento</small>

                                <span>

                                    {usuario?.fecha_nacimiento}

                                </span>

                            </div>

                        </div>

                    </div>

                </section>

                <section className="profile-card">

                    <div className="card-header">

                        <div>

                            <h2>

                                Direcciones

                            </h2>

                            <p>

                                Guarda tus direcciones para comprar mucho más rápido.

                            </p>

                        </div>

                    </div>

                    <div className="empty-box">

                        <MapPin size={45} />

                        <h3>

                            Aún no tienes direcciones registradas

                        </h3>

                        <p>

                            Agrega una dirección y evita escribirla nuevamente
                            en cada compra.

                        </p>

                        <button className="profile-button">

                            Agregar dirección

                        </button>

                    </div>

                </section>

                <section className="profile-card">

                    <div className="card-header">

                        <div>

                            <h2>

                                Seguridad

                            </h2>

                            <p>

                                Protege tu cuenta y mantén tus datos seguros.

                            </p>

                        </div>

                    </div>

                    <div className="security-card">

                        <div className="security-left">

                            <Lock size={24} />

                            <div>

                                <h3>

                                    Contraseña

                                </h3>

                                <span>

                                    ••••••••••••••

                                </span>

                            </div>

                        </div>

                        <button className="profile-button">

                            Cambiar contraseña

                        </button>

                    </div>

                </section>

            </div>

            {selectedProductId !== null && (
                <ProductDetail
                    productId={selectedProductId}
                    onClose={() => setSelectedProductId(null)}
                />
            )}

        </main>

    );

}

export default Profile;