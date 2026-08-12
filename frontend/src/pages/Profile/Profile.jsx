import "./Profile.css";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

import {
    User,
    Mail,
    Phone,
    Calendar,
    CreditCard,
    MapPin,
    Lock,
    Pencil,
    BadgeCheck,
    Package,
    Heart,
    Bell,
    LogOut,
    ChevronRight,
    Plus,
    Headphones,
    ShieldCheck,
    ShoppingCart,
} from "lucide-react";

function Profile() {

    const { usuario, logout } = useAuth();

    const [selectedSection, setSelectedSection] = useState("datos");

    const handleLogout = () => {
        logout();
    };

    return (

        <main className="profile-page">

            {/* =========================
                ENCABEZADO DE PERFIL
            ========================= */}

            <section className="profile-hero">

                <div className="profile-hero-container">

                    <div className="profile-hero-text">

                        <span className="profile-hero-tag">
                            Mi cuenta
                        </span>

                        <h1>
                            Mi cuenta
                        </h1>

                        <p>
                            Administra tu información personal y
                            tus preferencias de compra.
                        </p>

                    </div>

                    <div className="profile-user-summary">

                        <div className="profile-summary-avatar">

                            {usuario?.nombres?.charAt(0).toUpperCase() || "U"}

                        </div>

                        <div className="profile-summary-info">

                            <h2>
                                {usuario?.nombres} {usuario?.apellidos}
                            </h2>

                            <span className="profile-verified">

                                <BadgeCheck size={15} />

                                Cliente verificado

                            </span>

                            <small>
                                Miembro de VentasYa
                            </small>

                        </div>

                    </div>

                </div>

            </section>


            {/* =========================
                CONTENIDO PRINCIPAL
            ========================= */}

            <div className="profile-layout">

                {/* =========================
                    MENÚ LATERAL
                ========================= */}

                <aside className="profile-sidebar">

                    <nav className="profile-navigation">

                        <button
                            className={selectedSection === "datos" ? "active" : ""}
                            onClick={() => setSelectedSection("datos")}
                        >

                            <User size={18} />

                            <span>
                                Datos personales
                            </span>

                        </button>

                        <button
                            className={selectedSection === "direcciones" ? "active" : ""}
                            onClick={() => setSelectedSection("direcciones")}
                        >

                            <MapPin size={18} />

                            <span>
                                Direcciones
                            </span>

                        </button>

                        <Link to="/orders">

                            <Package size={18} />

                            <span>
                                Mis pedidos
                            </span>

                        </Link>

                        <Link to="/cart">

                            <ShoppingCart size={18} />

                            <span>
                                Mi carrito
                            </span>

                        </Link>

                        <Link to="/favorites">

                            <Heart size={18} />

                            <span>
                                Favoritos
                            </span>

                        </Link>

                        <button
                            className={selectedSection === "notificaciones" ? "active" : ""}
                            onClick={() => setSelectedSection("notificaciones")}
                        >

                            <Bell size={18} />

                            <span>
                                Notificaciones
                            </span>

                        </button>

                        <button
                            className={selectedSection === "seguridad" ? "active" : ""}
                            onClick={() => setSelectedSection("seguridad")}
                        >

                            <Lock size={18} />

                            <span>
                                Seguridad
                            </span>

                        </button>

                        <button
                            className="profile-logout-link"
                            onClick={handleLogout}
                        >

                            <LogOut size={18} />

                            <span>
                                Cerrar sesión
                            </span>

                        </button>

                    </nav>


                    {/* AYUDA */}

                    <div className="profile-help">

                        <div className="profile-help-icon">

                            <Headphones size={25} />

                        </div>

                        <h3>
                            ¿Necesitas ayuda?
                        </h3>

                        <p>
                            Estamos para ayudarte
                        </p>

                        <button>
                            Centro de ayuda
                        </button>

                    </div>

                </aside>


                {/* =========================
                    CONTENIDO
                ========================= */}

                <div className="profile-content">

                    {/* =========================
                        INFORMACIÓN PERSONAL
                    ========================= */}

                    <section className="profile-card">

                        <div className="profile-card-header">

                            <div>

                                <h2>
                                    Información personal
                                </h2>

                                <p>
                                    Administra los datos asociados a tu cuenta.
                                </p>

                            </div>

                            <button className="profile-outline-button">

                                <Pencil size={16} />

                                Editar

                            </button>

                        </div>


                        <div className="profile-information-grid">

                            <div className="profile-information-item">

                                <div className="profile-information-icon">

                                    <User size={20} />

                                </div>

                                <div>

                                    <small>
                                        Nombre completo
                                    </small>

                                    <strong>
                                        {usuario?.nombres} {usuario?.apellidos}
                                    </strong>

                                </div>

                            </div>


                            <div className="profile-information-item">

                                <div className="profile-information-icon">

                                    <Mail size={20} />

                                </div>

                                <div>

                                    <small>
                                        Correo electrónico
                                    </small>

                                    <strong>
                                        {usuario?.email || "No registrado"}
                                    </strong>

                                </div>

                            </div>


                            <div className="profile-information-item">

                                <div className="profile-information-icon">

                                    <Phone size={20} />

                                </div>

                                <div>

                                    <small>
                                        Celular
                                    </small>

                                    <strong>
                                        {usuario?.telefono || "No registrado"}
                                    </strong>

                                </div>

                            </div>


                            <div className="profile-information-item">

                                <div className="profile-information-icon">

                                    <CreditCard size={20} />

                                </div>

                                <div>

                                    <small>
                                        Documento
                                    </small>

                                    <strong>
                                        {usuario?.tipo_documento || ""}
                                        {" "}
                                        {usuario?.numero_documento || "No registrado"}
                                    </strong>

                                </div>

                            </div>


                            <div className="profile-information-item profile-information-full">

                                <div className="profile-information-icon">

                                    <Calendar size={20} />

                                </div>

                                <div>

                                    <small>
                                        Fecha de nacimiento
                                    </small>

                                    <strong>
                                        {usuario?.fecha_nacimiento || "No registrada"}
                                    </strong>

                                </div>

                            </div>

                        </div>

                    </section>


                    {/* =========================
                        DIRECCIONES
                    ========================= */}

                    <section className="profile-card">

                        <div className="profile-card-header">

                            <div>

                                <h2>
                                    Mis direcciones
                                </h2>

                                <p>
                                    Gestiona tus direcciones de envío.
                                </p>

                            </div>

                            <button className="profile-primary-button">

                                <Plus size={18} />

                                Agregar dirección

                            </button>

                        </div>


                        <div className="profile-address-empty">

                            <div className="profile-empty-icon">

                                <MapPin size={28} />

                            </div>

                            <div>

                                <h3>
                                    Aún no tienes direcciones
                                </h3>

                                <p>
                                    Agrega una dirección para realizar tus
                                    compras de forma más rápida.
                                </p>

                            </div>

                            <button className="profile-address-add">

                                <Plus size={18} />

                                Agregar nueva dirección

                                <ChevronRight size={18} />

                            </button>

                        </div>

                    </section>


                    {/* =========================
                        SEGURIDAD
                    ========================= */}

                    <section className="profile-card">

                        <div className="profile-card-header">

                            <div>

                                <h2>
                                    Seguridad de la cuenta
                                </h2>

                                <p>
                                    Protege tu cuenta y mantén tus datos seguros.
                                </p>

                            </div>

                        </div>


                        <div className="profile-security">

                            <div className="profile-security-left">

                                <div className="profile-security-icon">

                                    <Lock size={21} />

                                </div>

                                <div>

                                    <small>
                                        Contraseña
                                    </small>

                                    <span>
                                        ••••••••••••••
                                    </span>

                                </div>

                            </div>

                            <button className="profile-security-button">

                                Cambiar contraseña

                            </button>

                        </div>

                    </section>


                    {/* =========================
                        ACCESOS RÁPIDOS
                    ========================= */}

                    <section className="profile-card profile-quick-card">

                        <div className="profile-card-header">

                            <div>

                                <h2>
                                    Accesos rápidos
                                </h2>

                            </div>

                        </div>


                        <div className="profile-quick-grid">

                            <Link to="/orders" className="profile-quick-item">

                                <div className="quick-icon quick-orders">

                                    <Package size={20} />

                                </div>

                                <div>

                                    <strong>
                                        Mis pedidos
                                    </strong>

                                    <span>
                                        Ver historial y estado
                                        de tus pedidos
                                    </span>

                                </div>

                                <ChevronRight size={18} />

                            </Link>


                            <Link to="/cart" className="profile-quick-item">

                                <div className="quick-icon quick-cart">

                                    <ShoppingCart size={20} />

                                </div>

                                <div>

                                    <strong>
                                        Mi carrito
                                    </strong>

                                    <span>
                                        Revisa productos y
                                        finaliza tu compra
                                    </span>

                                </div>

                                <ChevronRight size={18} />

                            </Link>


                            <Link to="/favorites" className="profile-quick-item">

                                <div className="quick-icon quick-favorites">

                                    <Heart size={20} />

                                </div>

                                <div>

                                    <strong>
                                        Mis favoritos
                                    </strong>

                                    <span>
                                        Productos que guardaste
                                        para después
                                    </span>

                                </div>

                                <ChevronRight size={18} />

                            </Link>


                            <div className="profile-quick-item">

                                <div className="quick-icon quick-security">

                                    <ShieldCheck size={20} />

                                </div>

                                <div>

                                    <strong>
                                        Seguridad
                                    </strong>

                                    <span>
                                        Protege y administra
                                        tu cuenta
                                    </span>

                                </div>

                                <ChevronRight size={18} />

                            </div>


                            <div className="profile-quick-item">

                                <div className="quick-icon quick-notifications">

                                    <Bell size={20} />

                                </div>

                                <div>

                                    <strong>
                                        Notificaciones
                                    </strong>

                                    <span>
                                        Preferencias y alertas
                                        de tu cuenta
                                    </span>

                                </div>

                                <ChevronRight size={18} />

                            </div>

                        </div>

                    </section>

                </div>

            </div>

        </main>

    );
}

export default Profile;