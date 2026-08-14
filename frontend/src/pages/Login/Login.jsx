import "./Login.css";

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

import ModaImage from "../../assets/images/Moda.png";

import {
    Mail,
    LockKeyhole,
    Eye,
    EyeOff,
    ShoppingBag,
    ShieldCheck,
    Truck,
    Tag
} from "lucide-react";

import { login } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { useNotification } from "../../components/Notifications/NotificationProvider";


function Login() {

    const navigate = useNavigate();
    const location = useLocation();

    const { login: loginContext } = useAuth();

    const { syncOnLogin } = useCart();

    const { success, error: showError } = useNotification();


    /* =====================================================
       ESTADOS
    ===================================================== */

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [cargando, setCargando] = useState(false);

    const [mostrarPassword, setMostrarPassword] = useState(false);

    const [recordarme, setRecordarme] = useState(false);


    /* =====================================================
       CAMBIAR INPUT
    ===================================================== */

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

    };


    /* =====================================================
       INICIAR SESIÓN
    ===================================================== */

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            setCargando(true);


            const { data } = await login(formData);


            /* =============================================
               GUARDAR SESIÓN
            ============================================= */

            loginContext(data);


            /* =============================================
               SINCRONIZAR CARRITO
            ============================================= */

            const usuarioData = data.usuario || data;
            if (usuarioData?.id) {

                try {

                    await syncOnLogin(usuarioData.id);

                } catch (syncErr) {

                    console.error(
                        "Error sincronizando carrito:",
                        syncErr
                    );

                }

            }


            /* =============================================
               MENSAJE
            ============================================= */

            success(`¡Bienvenido de nuevo, ${usuarioData.nombres}!`);


            /* =============================================
               REDIRECCIÓN
            ============================================= */

            const params = new URLSearchParams(
                location.search
            );


            const destino =
                params.get("from") ||
                params.get("redirect");


            if (destino) {

                navigate(destino, {
                    replace: true
                });

                return;

            }


            /* =============================================
               REDIRECCIÓN POR ROL
            ============================================= */

            if (usuarioData.es_administrador) {

                navigate("/admin");

            } else {

                navigate("/");

            }


        } catch (error) {

            showError("No fue posible iniciar sesión. Verifica tus credenciales.");

        } finally {

            setCargando(false);

        }

    };


    return (

        <main className="login-page">

            <div className="login-card">


                {/* =================================================
                   PANEL IZQUIERDO
                ================================================= */}

                <section className="login-image">

                    <img
                        src={ModaImage}
                        alt="Moda VentasYa"
                    />


                    <div className="image-content">


                        <h2>
                            ¡Bienvenido{" "}
                            <span>de nuevo!</span>
                        </h2>


                        <p className="image-description">
                            Inicia sesión para continuar
                            comprando tus productos favoritos.
                        </p>


                        <div className="image-features">


                            {/* PRODUCTOS */}

                            <div className="feature">

                                <div className="feature-icon">

                                    <ShoppingBag
                                        size={24}
                                        strokeWidth={2}
                                    />

                                </div>


                                <div className="feature-info">

                                    <strong>
                                        Miles de productos
                                    </strong>

                                    <span>
                                        Descubre lo mejor para ti
                                    </span>

                                </div>

                            </div>


                            {/* COMPRAS SEGURAS */}

                            <div className="feature">

                                <div className="feature-icon">

                                    <ShieldCheck
                                        size={24}
                                        strokeWidth={2}
                                    />

                                </div>


                                <div className="feature-info">

                                    <strong>
                                        Compras seguras
                                    </strong>

                                    <span>
                                        Protegemos tu información
                                    </span>

                                </div>

                            </div>


                            {/* ENVÍOS */}

                            <div className="feature">

                                <div className="feature-icon">

                                    <Truck
                                        size={24}
                                        strokeWidth={2}
                                    />

                                </div>


                                <div className="feature-info">

                                    <strong>
                                        Envíos rápidos
                                    </strong>

                                    <span>
                                        A toda Colombia
                                    </span>

                                </div>

                            </div>


                            {/* OFERTAS */}

                            <div className="feature">

                                <div className="feature-icon">

                                    <Tag
                                        size={24}
                                        strokeWidth={2}
                                    />

                                </div>


                                <div className="feature-info">

                                    <strong>
                                        Ofertas exclusivas
                                    </strong>

                                    <span>
                                        Descuentos solo para miembros
                                    </span>

                                </div>

                            </div>


                        </div>

                    </div>

                </section>


                {/* =================================================
                   PANEL DERECHO
                ================================================= */}

                <section className="login-form">


                    {/* =================================================
                       ENCABEZADO
                    ================================================= */}

                    <div className="form-header">

                        <h1>
                            Iniciar sesión
                        </h1>


                        <div className="title-line"></div>


                        <p>
                            Ingresa tus datos para acceder
                            a tu cuenta y continuar comprando.
                        </p>

                    </div>


                    {/* =================================================
                       FORMULARIO
                    ================================================= */}

                    <form onSubmit={handleSubmit}>


                        {/* =========================================
                           CORREO
                        ========================================== */}

                        <div className="form-group">

                            <label htmlFor="email">
                                Correo electrónico
                            </label>


                            <div className="input-wrapper">


                                <Mail
                                    className="login-input-icon"
                                    size={20}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                />


                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="ejemplo@correo.com"
                                    disabled={cargando}
                                    autoComplete="email"
                                    required
                                />


                            </div>

                        </div>


                        {/* =========================================
                           CONTRASEÑA
                        ========================================== */}

                        <div className="form-group">


                            <div className="label-row">

                                <label htmlFor="password">
                                    Contraseña
                                </label>


                                <span className="forgot-password">
                                    ¿Olvidaste tu contraseña?
                                </span>

                            </div>


                            <div className="input-wrapper">


                                <LockKeyhole
                                    className="login-input-icon"
                                    size={20}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                />


                                <input
                                    id="password"
                                    type={
                                        mostrarPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••••"
                                    disabled={cargando}
                                    autoComplete="current-password"
                                    required
                                />


                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setMostrarPassword(
                                            !mostrarPassword
                                        )
                                    }
                                    aria-label={
                                        mostrarPassword
                                            ? "Ocultar contraseña"
                                            : "Mostrar contraseña"
                                    }
                                >

                                    {mostrarPassword ? (

                                        <EyeOff
                                            size={20}
                                            strokeWidth={2}
                                        />

                                    ) : (

                                        <Eye
                                            size={20}
                                            strokeWidth={2}
                                        />

                                    )}

                                </button>


                            </div>

                        </div>


                        {/* =========================================
                           RECORDARME
                        ========================================== */}

                        <div className="remember-row">

                            <label className="remember-label">

                                <input
                                    type="checkbox"
                                    checked={recordarme}
                                    onChange={(e) =>
                                        setRecordarme(
                                            e.target.checked
                                        )
                                    }
                                />


                                <span className="custom-checkbox">
                                    ✓
                                </span>


                                <span>
                                    Recordarme
                                </span>

                            </label>

                        </div>


                        {/* =========================================
                           BOTÓN
                        ========================================== */}

                        <button
                            type="submit"
                            className="login-button"
                            disabled={cargando}
                        >

                            {cargando
                                ? "Ingresando..."
                                : "Iniciar sesión"
                            }

                        </button>


                    </form>


                    {/* =================================================
                       DIVISOR
                    ================================================= */}

                    <div className="divider">

                        <span>
                            o continúa con
                        </span>

                    </div>


                    {/* =================================================
                       REDES
                    ================================================= */}

                    <div className="social-buttons">


                        <button
                            type="button"
                            className="social-button"
                        >

                            <span>
                                Google
                            </span>

                        </button>


                        <button
                            type="button"
                            className="social-button"
                        >

                            <span>
                                Facebook
                            </span>

                        </button>


                    </div>


                    {/* =================================================
                       REGISTRO
                    ================================================= */}

                    <p className="register-text">

                        ¿No tienes cuenta?

                        <Link to="/register">
                            Regístrate aquí
                        </Link>

                    </p>


                </section>


            </div>

        </main>

    );

}


export default Login;