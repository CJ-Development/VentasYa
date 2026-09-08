import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Loader2 } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";

import "./Login.css";

function AdminLogin() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setError("Por favor completa todos los campos");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const userData = await login(email, password);

            // Verificar si el usuario es admin antes de navegar
            if (userData && (userData.is_staff === true || userData.is_superuser === true || userData.tipo_usuario === "admin")) {
                navigate("/admin");
            } else {
                setError("No tienes permisos de administrador.");
                logout();
            }
        } catch (err) {
            console.error("Error al iniciar sesión:", err);
            setError(err.response?.data?.detail || "Error al iniciar sesión. Verifica tus credenciales.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-container">
                <div className="admin-login-card">
                    <div className="admin-login-header">
                        <h1>Panel Administrativo</h1>
                        <p>Inicia sesión para acceder al panel</p>
                    </div>

                    {error && (
                        <div className="admin-login-error">
                            {error}
                        </div>
                    )}

                    <form className="admin-login-form" onSubmit={handleSubmit}>
                        <div className="admin-login-field">
                            <label htmlFor="email">Correo electrónico</label>
                            <div className="admin-login-input-wrapper">
                                <User size={18} />
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@ejemplo.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="admin-login-field">
                            <label htmlFor="password">Contraseña</label>
                            <div className="admin-login-input-wrapper">
                                <Lock size={18} />
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="admin-login-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                "Iniciar sesión"
                            )}
                        </button>
                    </form>

                    <div className="admin-login-footer">
                        <button
                            type="button"
                            className="admin-login-back-button"
                            onClick={() => navigate("/")}
                        >
                            Volver a la tienda
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;
