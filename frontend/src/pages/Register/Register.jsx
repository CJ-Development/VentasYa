import "./Register.css";

import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import {
    ArrowLeft,
    User,
    Mail,
    Lock,
    Phone,
    Calendar,
    ShieldCheck,
    CheckCircle,
    XCircle
} from "lucide-react";

import { register } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../components/Notifications/NotificationProvider";


function Register() {

    const navigate = useNavigate();
    const { login: loginContext } = useAuth();
    const { success, error: showError } = useNotification();

    const [form, setForm] = useState({
        nombres: "",
        apellidos: "",
        fecha_nacimiento: "",
        email: "",
        telefono: "",
        password: "",
        confirmPassword: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [showSuccess, setShowSuccess] = useState(false);


    /* =========================================
       CAMBIAR CAMPOS
    ========================================= */

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value
        });

        // Validar campo en tiempo real
        validateField(name, value);
    };

    const validateField = (name, value) => {
        const errors = { ...fieldErrors };

        switch (name) {
            case 'nombres':
                if (!value.trim()) {
                    errors.nombres = "Los nombres son obligatorios";
                } else if (value.trim().length < 2) {
                    errors.nombres = "Mínimo 2 caracteres";
                } else {
                    delete errors.nombres;
                }
                break;

            case 'apellidos':
                if (!value.trim()) {
                    errors.apellidos = "Los apellidos son obligatorios";
                } else if (value.trim().length < 2) {
                    errors.apellidos = "Mínimo 2 caracteres";
                } else {
                    delete errors.apellidos;
                }
                break;

            case 'fecha_nacimiento':
                if (!value) {
                    errors.fecha_nacimiento = "La fecha de nacimiento es obligatoria";
                } else {
                    const birthDate = new Date(value);
                    const today = new Date();
                    const age = today.getFullYear() - birthDate.getFullYear();
                    if (age < 13) {
                        errors.fecha_nacimiento = "Debes tener al menos 13 años";
                    } else {
                        delete errors.fecha_nacimiento;
                    }
                }
                break;

            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value.trim()) {
                    errors.email = "El correo es obligatorio";
                } else if (!emailRegex.test(value)) {
                    errors.email = "Formato de correo inválido";
                } else {
                    delete errors.email;
                }
                break;

            case 'telefono':
                const phoneRegex = /^[0-9+\s-]{7,15}$/;
                if (!value.trim()) {
                    errors.telefono = "El celular es obligatorio";
                } else if (!phoneRegex.test(value)) {
                    errors.telefono = "Formato inválido (solo números)";
                } else {
                    delete errors.telefono;
                }
                break;

            case 'password':
                const passwordErrors = validatePassword(value);
                if (passwordErrors.length > 0) {
                    errors.password = passwordErrors.join(", ");
                } else {
                    delete errors.password;
                }
                break;

            case 'confirmPassword':
                if (!value) {
                    errors.confirmPassword = "Confirma tu contraseña";
                } else if (value !== form.password) {
                    errors.confirmPassword = "Las contraseñas no coinciden";
                } else {
                    delete errors.confirmPassword;
                }
                break;

            default:
                break;
        }

        setFieldErrors(errors);
    };


    /* =========================================
       VALIDAR CONTRASEÑA
    ========================================= */

    const validatePassword = (password) => {
        const errors = [];

        if (password.length < 8) {
            errors.push("Mínimo 8 caracteres");
        }

        if (!/[A-Z]/.test(password)) {
            errors.push("Una mayúscula");
        }

        if (!/[a-z]/.test(password)) {
            errors.push("Una minúscula");
        }

        if (!/[0-9]/.test(password)) {
            errors.push("Un número");
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push("Un carácter especial (!@#$%^&*(),.?\":{}|<>)");
        }

        return errors;
    };


    /* =========================================
       ENVIAR FORMULARIO
    ========================================= */

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        // Validar todos los campos
        const errors = {};
        Object.keys(form).forEach(key => {
            if (key !== 'confirmPassword') {
                validateField(key, form[key]);
            }
        });

        // Validar confirmar contraseña
        if (form.password !== form.confirmPassword) {
            setFieldErrors(prev => ({ ...prev, confirmPassword: "Las contraseñas no coinciden" }));
        }

        // Verificar si hay errores
        if (Object.keys(fieldErrors).length > 0) {
            setError("Por favor corrige los errores antes de continuar");
            return;
        }

        setLoading(true);

        try {

            const { data } = await register({
                nombres: form.nombres,
                apellidos: form.apellidos,
                fecha_nacimiento: form.fecha_nacimiento,
                email: form.email,
                telefono: form.telefono,
                password: form.password
            });

            loginContext(data);

            setShowSuccess(true);

            setTimeout(() => {
                navigate("/");
            }, 3000);

        } catch (error) {

            console.error(error);

            if (error.response?.data) {
                console.log(error.response.data);

                // Mostrar error específico del backend
                const errorMsg = error.response.data.detail ||
                                  error.response.data.error ||
                                  error.response.data.email ||
                                  error.response.data.password ||
                                  "No fue posible crear la cuenta";

                setError(errorMsg);
            } else {
                setError("Error de conexión con el servidor");
            }

        } finally {

            setLoading(false);

        }
    };


    return (

        <main className="register-page">

            {/* =====================================
                DECORACIÓN DE FONDO
            ====================================== */}

            <div className="register-decoration register-decoration-one"></div>

            <div className="register-decoration register-decoration-two"></div>


            {/* =====================================
                TARJETA
            ====================================== */}

            <div className="register-card">


                {/* Línea decorativa superior */}

                <div className="register-card-accent"></div>


                <section className="register-form">


                    {/* =================================
                        VOLVER
                    ================================== */}

                    <Link
                        to="/"
                        className="back-home"
                    >

                        <ArrowLeft size={16} />

                        <span>
                            Volver al inicio
                        </span>

                    </Link>


                    {/* =================================
                        ENCABEZADO
                    ================================== */}

                    <div className="register-header">

                        <div className="register-title-row">

                            <div className="register-title-mark"></div>

                            <div>

                                <h1>
                                    Crear cuenta
                                </h1>

                                <p className="subtitle">
                                    Completa tus datos para comenzar
                                    a comprar en VentasYa.
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* =================================
                        ERROR
                    ================================== */}

                    {error && (
                        <div className="register-error">
                            {error}
                        </div>
                    )}


                    {/* =================================
                        FORMULARIO
                    ================================== */}

                    <form onSubmit={handleSubmit}>


                        {/* =================================
                            NOMBRES + APELLIDOS
                        ================================== */}

                        <div className="form-row">

                            {/* Nombres */}

                            <div className="form-group">

                                <label htmlFor="nombres">
                                    Nombres
                                </label>

                                <div className="input-icon">

                                    <User size={17} />

                                    <input
                                        id="nombres"
                                        type="text"
                                        name="nombres"
                                        value={form.nombres}
                                        onChange={handleChange}
                                        placeholder="Nombres completos"
                                        autoComplete="given-name"
                                        required
                                        className={fieldErrors.nombres ? 'input-error' : ''}
                                    />

                                </div>

                                {fieldErrors.nombres && (
                                    <span className="field-error">
                                        <XCircle size={12} />
                                        {fieldErrors.nombres}
                                    </span>
                                )}

                            </div>


                            {/* Apellidos */}

                            <div className="form-group">

                                <label htmlFor="apellidos">
                                    Apellidos
                                </label>

                                <div className="input-icon">

                                    <User size={17} />

                                    <input
                                        id="apellidos"
                                        type="text"
                                        name="apellidos"
                                        value={form.apellidos}
                                        onChange={handleChange}
                                        placeholder="Apellidos completos"
                                        autoComplete="family-name"
                                        required
                                        className={fieldErrors.apellidos ? 'input-error' : ''}
                                    />

                                </div>

                                {fieldErrors.apellidos && (
                                    <span className="field-error">
                                        <XCircle size={12} />
                                        {fieldErrors.apellidos}
                                    </span>
                                )}

                            </div>

                        </div>


                        {/* =================================
                            FECHA DE NACIMIENTO
                        ================================== */}

                        <div className="form-group">

                            <label htmlFor="fecha_nacimiento">
                                Fecha de nacimiento
                            </label>

                            <div className="input-icon">

                                <Calendar size={17} />

                                <input
                                    id="fecha_nacimiento"
                                    type="date"
                                    name="fecha_nacimiento"
                                    value={form.fecha_nacimiento}
                                    onChange={handleChange}
                                    autoComplete="bday"
                                    required
                                    className={fieldErrors.fecha_nacimiento ? 'input-error' : ''}
                                />

                            </div>

                            {fieldErrors.fecha_nacimiento && (
                                <span className="field-error">
                                    <XCircle size={12} />
                                    {fieldErrors.fecha_nacimiento}
                                </span>
                            )}

                        </div>


                        {/* =================================
                            EMAIL + CELULAR
                        ================================== */}

                        <div className="form-row">

                            {/* Email */}

                            <div className="form-group">

                                <label htmlFor="email">
                                    Correo electrónico
                                </label>

                                <div className="input-icon">

                                    <Mail size={17} />

                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="correo@ejemplo.com"
                                        autoComplete="email"
                                        required
                                        className={fieldErrors.email ? 'input-error' : ''}
                                    />

                                </div>

                                {fieldErrors.email && (
                                    <span className="field-error">
                                        <XCircle size={12} />
                                        {fieldErrors.email}
                                    </span>
                                )}

                            </div>


                            {/* Celular */}

                            <div className="form-group">

                                <label htmlFor="telefono">
                                    Celular
                                </label>

                                <div className="input-icon">

                                    <Phone size={17} />

                                    <input
                                        id="telefono"
                                        type="tel"
                                        name="telefono"
                                        value={form.telefono}
                                        onChange={handleChange}
                                        placeholder="300 000 0000"
                                        autoComplete="tel"
                                        required
                                        className={fieldErrors.telefono ? 'input-error' : ''}
                                    />

                                </div>

                                {fieldErrors.telefono && (
                                    <span className="field-error">
                                        <XCircle size={12} />
                                        {fieldErrors.telefono}
                                    </span>
                                )}

                            </div>

                        </div>


                        {/* =================================
                            CONTRASEÑAS
                        ================================== */}

                        <div className="form-row">

                            {/* Contraseña */}

                            <div className="form-group">

                                <label htmlFor="password">
                                    Contraseña
                                </label>

                                <div className="input-icon">

                                    <Lock size={17} />

                                    <input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        required
                                        className={fieldErrors.password ? 'input-error' : ''}
                                    />

                                </div>

                                {fieldErrors.password && (
                                    <span className="field-error">
                                        <XCircle size={12} />
                                        {fieldErrors.password}
                                    </span>
                                )}

                            </div>


                            {/* Confirmar contraseña */}

                            <div className="form-group">

                                <label htmlFor="confirmPassword">
                                    Confirmar contraseña
                                </label>

                                <div className="input-icon">

                                    <Lock size={17} />

                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        name="confirmPassword"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        required
                                        className={fieldErrors.confirmPassword ? 'input-error' : ''}
                                    />

                                </div>

                                {fieldErrors.confirmPassword && (
                                    <span className="field-error">
                                        <XCircle size={12} />
                                        {fieldErrors.confirmPassword}
                                    </span>
                                )}

                            </div>

                        </div>


                        {/* =================================
                            REQUISITOS DE CONTRASEÑA
                        ================================== */}

                        {form.password && (
                            <div className="password-requirements">
                                <div className={`requirement ${form.password.length >= 8 ? 'met' : ''}`}>
                                    Mínimo 8 caracteres
                                </div>
                                <div className={`requirement ${/[A-Z]/.test(form.password) ? 'met' : ''}`}>
                                    Una mayúscula
                                </div>
                                <div className={`requirement ${/[a-z]/.test(form.password) ? 'met' : ''}`}>
                                    Una minúscula
                                </div>
                                <div className={`requirement ${/[0-9]/.test(form.password) ? 'met' : ''}`}>
                                    Un número
                                </div>
                                <div className={`requirement ${/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? 'met' : ''}`}>
                                    Un carácter especial
                                </div>
                            </div>
                        )}


                        {/* =================================
                            INFORMACIÓN DE SEGURIDAD
                        ================================== */}

                        <div className="register-security">

                            <ShieldCheck size={17} />

                            <div>

                                <strong>
                                    Tus datos están protegidos
                                </strong>

                                <span>
                                    Utilizamos tus datos únicamente para
                                    gestionar tu cuenta y tus compras.
                                </span>

                            </div>

                        </div>


                        {/* =================================
                            BOTÓN
                        ================================== */}

                        <button
                            className="register-button"
                            type="submit"
                            disabled={loading}
                        >

                            {loading
                                ? "Creando cuenta..."
                                : "Crear cuenta"
                            }

                        </button>

                    </form>


                    {/* =================================
                        DIVISOR
                    ================================== */}

                    <div className="divider">

                        <span>
                            o regístrate con
                        </span>

                    </div>


                    {/* =================================
                        REDES
                    ================================== */}

                    <div className="social-buttons">

                        <button type="button">
                            Google
                        </button>

                        <button type="button">
                            Facebook
                        </button>

                    </div>


                    {/* =================================
                        LOGIN
                    ================================== */}

                    <div className="login-link">

                        <span>
                            ¿Ya tienes una cuenta?
                        </span>

                        <Link to="/login">
                            Iniciar sesión
                        </Link>

                    </div>

                </section>

            </div>


            {/* =================================
                MODAL DE ÉXITO
            ================================== */}

            {showSuccess && (
                <div className="success-modal">
                    <div className="success-modal-content">
                        <div className="success-icon">
                            <CheckCircle size={48} />
                        </div>
                        <h2>¡Cuenta creada con éxito!</h2>
                        <p>
                            Bienvenido a VentasYa. Te estamos redirigiendo a la página principal...
                        </p>
                        <div className="success-spinner"></div>
                    </div>
                </div>
            )}

        </main>
    );
}


export default Register;