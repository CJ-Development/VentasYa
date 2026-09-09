import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Lock,
    Mail,
    Loader2,
    LogIn,
    ShoppingBag,
    Package,
    BarChart3,
    ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";

import Logo from "../../../assets/images/Logo.png";
import LoginImage from "../../../assets/images/Login.png";

import "./Login.css";

function AdminLogin() {
    const { login, logout } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim() || !password) {
            setError("Por favor completa todos los campos.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const userData = await login(email.trim(), password);

            const isAdmin =
                userData?.is_staff === true ||
                userData?.is_superuser === true ||
                userData?.tipo_usuario === "admin";

            if (isAdmin) {
                navigate("/admin");
                return;
            }

            setError("No tienes permisos de administrador.");

            // Usar el logout existente del AuthProvider.
            if (typeof logout === "function") {
                await logout();
            }
        } catch (err) {
            console.error("Error al iniciar sesión:", err);

            setError(
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                "Error al iniciar sesión. Verifica tus credenciales."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="admin-login-page">
            <div className="admin-login-decoration admin-login-decoration-one" />
            <div className="admin-login-decoration admin-login-decoration-two" />
            <div className="admin-login-decoration admin-login-decoration-three" />

            <section className="admin-login-container">
                <div className="admin-login-card">

                    {/* =====================================================
                        PANEL IZQUIERDO
                    ===================================================== */}
                    <section className="admin-login-brand-panel">

                        <div className="admin-login-brand-content">

                            <div className="admin-login-logo">
                                <img
                                    src={Logo}
                                    alt="Baúl Mágico Shop"
                                />
                            </div>

                            <p className="admin-login-tagline">
                                TU TIENDA, UN MUNDO DE POSIBILIDADES
                            </p>

                            <h1 className="admin-login-brand-title">
                                Gestiona tu tienda
                                <span>de forma sencilla.</span>
                            </h1>

                            <p className="admin-login-brand-description">
                                Administra tus productos, pedidos y toda tu
                                tienda desde un solo lugar.
                            </p>

                            <div className="admin-login-features">

                                <div className="admin-login-feature">
                                    <div className="admin-login-feature-icon">
                                        <ShoppingBag size={24} />
                                    </div>

                                    <span>Productos</span>
                                </div>

                                <div className="admin-login-feature">
                                    <div className="admin-login-feature-icon">
                                        <Package size={24} />
                                    </div>

                                    <span>Pedidos</span>
                                </div>

                                <div className="admin-login-feature">
                                    <div className="admin-login-feature-icon">
                                        <BarChart3 size={24} />
                                    </div>

                                    <span>Ventas</span>
                                </div>

                            </div>
                        </div>

                        <div className="admin-login-illustration">
                            <img
                                src={LoginImage}
                                alt="Gestión de tienda Baúl Mágico Shop"
                            />
                        </div>
                    </section>

                    {/* =====================================================
                        PANEL DERECHO
                    ===================================================== */}
                    <section className="admin-login-form-panel">

                        <div className="admin-login-form-content">

                            <span className="admin-login-top-line" />

                            <div className="admin-login-heading">
                                <h2>Bienvenido</h2>

                                <p>
                                    Accede al panel administrativo
                                    <br />
                                    de tu tienda.
                                </p>
                            </div>

                            {error && (
                                <div
                                    className="admin-login-error"
                                    role="alert"
                                >
                                    {error}
                                </div>
                            )}

                            <form
                                className="admin-login-form"
                                onSubmit={handleSubmit}
                            >

                                {/* EMAIL */}
                                <div className="admin-login-field">

                                    <label htmlFor="email">
                                        Correo electrónico
                                    </label>

                                    <div className="admin-login-input-wrapper">
                                        <Mail
                                            size={21}
                                            aria-hidden="true"
                                        />

                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            autoComplete="username"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            placeholder="ejemplo@tudominio.com"
                                            disabled={loading}
                                            required
                                        />
                                    </div>

                                </div>

                                {/* PASSWORD */}
                                <div className="admin-login-field">

                                    <label htmlFor="password">
                                        Contraseña
                                    </label>

                                    <div className="admin-login-input-wrapper">
                                        <Lock
                                            size={21}
                                            aria-hidden="true"
                                        />

                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            placeholder="••••••••"
                                            disabled={loading}
                                            required
                                        />
                                    </div>

                                </div>

                                {/* BOTÓN */}
                                <button
                                    type="submit"
                                    className="admin-login-button"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2
                                                size={20}
                                                className="admin-login-spin"
                                            />
                                            <span>Iniciando sesión...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogIn size={20} />
                                            <span>Iniciar sesión</span>
                                        </>
                                    )}
                                </button>

                            </form>

                            {/* SEPARADOR */}
                            <div className="admin-login-divider">
                                <span />
                                <i />
                                <span />
                            </div>

                            {/* VOLVER */}
                            <button
                                type="button"
                                className="admin-login-back-button"
                                onClick={() => navigate("/")}
                                disabled={loading}
                            >
                                <ArrowLeft size={20} />
                                <span>Volver a la tienda</span>
                            </button>

                        </div>
                    </section>

                </div>
            </section>
        </main>
    );
}

export default AdminLogin;