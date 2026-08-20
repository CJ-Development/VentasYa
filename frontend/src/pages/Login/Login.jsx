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

import { login, getCsrfToken } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { useNotification } from "../../components/Notifications/NotificationProvider";
import { esAdmin } from "../../utils/esAdmin";


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


            /* =============================================
               OBTENER TOKEN CSRF
            ============================================= */

            try {
                await getCsrfToken();
                console.log("Token CSRF obtenido exitosamente");
            } catch (csrfError) {
                console.error("Error obteniendo token CSRF:", csrfError);
                // No fallamos el login si falla el CSRF, el interceptor lo manejará
            }


            /* =============================================
               LOGIN
            ============================================= */

            const { data } = await login(formData);


            console.log("Respuesta login:", data);


            /* =============================================
               USUARIO

               El backend actualmente devuelve directamente:

               {
                   id_usuario,
                   nombres,
                   ...
                   is_superuser,
                   is_staff,
                   tipo_usuario
               }

               También dejamos compatibilidad con respuestas
               que vengan dentro de "usuario".
            ============================================= */

            const usuarioData = data.usuario || data;


            /* =============================================
               GUARDAR SESIÓN
            ============================================= */

            loginContext(usuarioData);


            /* =============================================
               SINCRONIZAR CARRITO
            ============================================= */

            const usuarioId =
                usuarioData?.id_usuario ||
                usuarioData?.id;


            if (usuarioId) {

                try {

                    await syncOnLogin(usuarioId);

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

            success(
                `¡Bienvenido de nuevo, ${usuarioData.nombres}!`
            );


            /* =============================================
               DETERMINAR SI ES ADMINISTRADOR
            ============================================= */

            const esAdministrador = esAdmin(usuarioData);


            console.log(
                "Usuario administrador:",
                esAdministrador
            );


            /* =============================================
               REDIRECCIÓN SOLICITADA
               
               Solo usamos "from" / "redirect" si existe
               y el usuario NO está intentando entrar a
               una zona administrativa.

               Esto evita que un redirect viejo mande al
               usuario a una ruta incorrecta.
            ============================================= */

            const params = new URLSearchParams(
                location.search
            );

            const destino =
                params.get("from") ||
                params.get("redirect");


            /* =============================================
               ADMIN
            ============================================= */

            if (esAdministrador) {

                navigate("/admin", {
                    replace: true
                });

                return;

            }


            /* =============================================
               CLIENTE
            ============================================= */

            if (destino) {

                navigate(destino, {
                    replace: true
                });

                return;

            }


            navigate("/", {
                replace: true
            });


        } catch (error) {

            console.error(
                "Error iniciando sesión:",
                error
            );


            const backendError =
                error?.response?.data;


            if (backendError) {

                const mensaje =
                    backendError.detail ||
                    backendError.error ||
                    backendError.non_field_errors?.[0] ||
                    "Correo o contraseña incorrectos.";

                showError(mensaje);

            } else {

                showError(
                    "No fue posible iniciar sesión. Verifica tus credenciales."
                );

            }

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