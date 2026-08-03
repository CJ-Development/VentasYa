import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import LoginImage from "../../assets/images/Login.png";
import { ArrowLeft, Truck, ShieldCheck, Package } from "lucide-react";
import { login } from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";

function Login() {

    const navigate = useNavigate();

    const { login: loginContext } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {
            const { data } = await login(formData);
            loginContext(data);

alert(`Bienvenido ${data.nombres}`);

        if (data.rol === 2) {
            navigate("/admin");
        } else {
            navigate("/");

        }
        } catch (error) {

            if (error.response) {

                alert(error.response.data.error);

            } else {

                alert("No fue posible iniciar sesión");

            }

        }

    };
    return (
        <main className="login-page">
            <div className="login-card">
                {/* Imagen */}
                <section className="login-image">
                    <img src={LoginImage} alt="Login" />
                    <div className="image-overlay">
                        <span className="welcome-badge"> Tu tienda de confianza </span>
                        <h2> Bienvenido a <span>VentasYa</span> </h2>
                        <p>
                            Accede a miles de productos, ofertas exclusivas y
                            una experiencia de compra rápida y segura.
                        </p>
                        <div className="image-features">
                            <div className="feature">
                                <Truck size={18} />
                                <span>
                                    Envíos rápidos a toda Colombia
                                </span>
                            </div>
                            <div className="feature">
                                <ShieldCheck size={18} />
                                <span>
                                    Pagos 100% seguros
                                </span>
                            </div>
                            <div className="feature">
                                <Package size={18} />
                                <span>
                                    Miles de productos para toda la familia
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Formulario */}
                <section className="login-form">
                    <Link to="/" className="back-home" >
                        <ArrowLeft size={18} />
                        Volver al inicio
                    </Link>
                    <div className="login-header">
                        <h1>Iniciar sesión</h1>
                        <p>
                            ¿No tienes una cuenta?
                            <Link to="/register"> Crear cuenta </Link>
                        </p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Correo electrónico</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="tu@gmail.com" />
                        </div>
                        <div className="form-group">
                            <div className="label-row">
                                <label>Contraseña</label>
                                <Link to="/recuperar-password" className="forgot-password" >¿Olvidaste tu contraseña? </Link>
                            </div>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="********" />
                        </div>
                        <button type="submit" className="login-button" > Iniciar sesión </button>
                    </form>
                    <div className="divider">
                        <span>o continúa con</span>
                    </div>
                    <div className="social-buttons">
                        <button type="button" className="google-button" > Google </button>
                        <button type="button" className="facebook-button"> Facebook </button>
                    </div>
                    <p className="terms">
                        Al iniciar sesión aceptas nuestros
                        <Link to="#">
                            Términos y Condiciones
                        </Link>
                        {" "}y{" "}
                        <Link to="#">
                            Política de Privacidad
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}

export default Login;