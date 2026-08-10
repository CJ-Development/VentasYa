import "./Register.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import LoginImage from "../../assets/images/Login.png";
import {
    ArrowLeft,
    User,
    Mail,
    Lock,
    Phone,
    Calendar,
} from "lucide-react";
import { register } from "../../services/api";

function Register() {

    const navigate = useNavigate();

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

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            alert("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);

        try {
            await register({
                nombres: form.nombres,
                apellidos: form.apellidos,
                fecha_nacimiento: form.fecha_nacimiento,
                email: form.email,
                telefono: form.telefono,
                password: form.password
            });
            alert("Cuenta creada correctamente");
            navigate("/login");
        } catch (error) {
            console.error(error);
            if (error.response?.data) {
                console.log(error.response.data);
            }
            alert(
                error.response?.data
                    ? "No fue posible crear la cuenta. Revisa los datos."
                    : "Error de conexión con el servidor"
            );
        } finally {
            setLoading(false);
        }
    };

    return (

        <main className="register-page">
            <div className="register-card">
                <section className="register-image">
                    <img src={LoginImage} alt="VentasYa" />
                    <div className="register-overlay">
                        <span className="welcome-badge">
                            Crea tu cuenta gratis
                        </span>
                        <h2>
                            Empieza hoy en <span>VentasYa</span>
                        </h2>
                        <p>
                            Regístrate y descubre miles de productos,
                            ofertas exclusivas y una experiencia de compra
                            rápida, sencilla y totalmente segura.
                        </p>
                        <div className="image-features">
                            <div className="feature">
                                 Envíos rápidos a toda Colombia
                            </div>
                            <div className="feature">
                                 Pagos protegidos y seguros
                            </div>
                            <div className="feature">
                                 Miles de productos esperándote
                            </div>
                        </div>
                    </div>
                </section>
                <section className="register-form">
                    <Link to="/" className="back-home" >
                        <ArrowLeft size={18} />
                        Volver al inicio
                    </Link>
                    <h1>Crear cuenta</h1>
                    <p className="subtitle">
                        Completa tus datos para comenzar a comprar en VentasYa.
                    </p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Nombres</label>
                            <div className="input-icon">
                                <User size={18} />
                                <input type="text" name="nombres" value={form.nombres} onChange={handleChange} placeholder="Nombres Completos" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Apellidos</label>
                            <div className="input-icon">
                                <User size={18} />
                                <input type="text" name="apellidos" value={form.apellidos} onChange={handleChange} placeholder="Apellidos Completos" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Fecha de nacimiento</label>
                            <div className="input-icon">
                                <Calendar size={18} />
                                <input type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Correo electrónico</label>
                            <div className="input-icon">
                                <Mail size={18} />
                                <input type="email" name="email" value={form.email} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Celular</label>
                            <div className="input-icon">
                                <Phone size={18} />
                                <input type="text" name="telefono" value={form.telefono} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Contraseña</label>
                            <div className="input-icon">
                                <Lock size={18} />
                                <input type="password" name="password" value={form.password} onChange={handleChange} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Confirmar contraseña</label>
                            <div className="input-icon">
                                <Lock size={18} />
                                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required/>
                            </div>
                        </div>
                        <button className="register-button" type="submit"disabled={loading}>
                            {loading ? "Creando cuenta..." : "Crear cuenta"}
                        </button>
                    </form>
                    <div className="divider">
                        <span>o regístrate con</span>
                    </div>
                    <div className="social-buttons">
                        <button type="button"> Google </button>
                        <button type="button"> Facebook </button>
                    </div>
                    <div className="login-link">
                        ¿Ya tienes una cuenta?
                        <Link to="/login"> Iniciar sesión </Link>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default Register;
