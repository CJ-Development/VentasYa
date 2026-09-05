import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    Shirt,
    User,
    Baby,
    PawPrint,
    Laptop,
    Watch,
    Home,
    Trophy,
    Sparkles,
    Package,
    Smartphone,
    ShoppingBag,
    Utensils,
    Car,
    Book,
    Music,
    Camera,
    Gamepad2,
    Heart,
    Flower2,
    Dumbbell,
    Plane,
    Coffee,
    Wine,
    Gift,
    Layers,
    Grid3x3
} from "lucide-react";

import api from "../../../services/api";
import MegaMenu from "../../MegaMenu/MegaMenu";

const slugify = (label) => label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const itemHref = (label) => `/categoria/${slugify(label)}`;

const getCategoryIcon = (nombre) => {
    const nombreLower = nombre.toLowerCase();
    
    if (nombreLower.includes('hombre') || nombreLower.includes('caballero')) return User;
    if (nombreLower.includes('mujer') || nombreLower.includes('dama') || nombreLower.includes('señora')) return Heart;
    if (nombreLower.includes('niñ') || nombreLower.includes('bebé') || nombreLower.includes('bebe')) return Baby;
    if (nombreLower.includes('mascot') || nombreLower.includes('perro') || nombreLower.includes('gato')) return PawPrint;
    if (nombreLower.includes('tecnolog') || nombreLower.includes('electrónic') || nombreLower.includes('computador') || nombreLower.includes('laptop')) return Laptop;
    if (nombreLower.includes('accesorio') || nombreLower.includes('reloj') || nombreLower.includes('gafas')) return Watch;
    if (nombreLower.includes('hogar') || nombreLower.includes('casa') || nombreLower.includes('mueble') || nombreLower.includes('decoración')) return Home;
    if (nombreLower.includes('deport') || nombreLower.includes('fitness') || nombreLower.includes('gimnasio')) return Trophy;
    if (nombreLower.includes('belleza') || nombreLower.includes('cosmétic') || nombreLower.includes('maquillaje')) return Sparkles;
    if (nombreLower.includes('ropa') || nombreLower.includes('vestido') || nombreLower.includes('camisa')) return Shirt;
    if (nombreLower.includes('calzado') || nombreLower.includes('zapato')) return ShoppingBag;
    if (nombreLower.includes('teléfono') || nombreLower.includes('celular') || nombreLower.includes('movil')) return Smartphone;
    if (nombreLower.includes('cocina') || nombreLower.includes('aliment') || nombreLower.includes('comida')) return Utensils;
    if (nombreLower.includes('vehículo') || nombreLower.includes('auto') || nombreLower.includes('carro')) return Car;
    if (nombreLower.includes('libro') || nombreLower.includes('lectura')) return Book;
    if (nombreLower.includes('música') || nombreLower.includes('sonido')) return Music;
    if (nombreLower.includes('cámara') || nombreLower.includes('foto')) return Camera;
    if (nombreLower.includes('juego') || nombreLower.includes('videojuego')) return Gamepad2;
    if (nombreLower.includes('flor') || nombreLower.includes('jardín') || nombreLower.includes('planta')) return Flower2;
    if (nombreLower.includes('ejercicio') || nombreLower.includes('pesa')) return Dumbbell;
    if (nombreLower.includes('viaje') || nombreLower.includes('turismo')) return Plane;
    if (nombreLower.includes('café') || nombreLower.includes('bebida')) return Coffee;
    if (nombreLower.includes('vino') || nombreLower.includes('licor')) return Wine;
    if (nombreLower.includes('regalo')) return Gift;
    
    return Package; // Icono por defecto
};

function NavLinks() {
    const [categorias, setCategorias] = useState([]);
    const [activeMenu, setActiveMenu] = useState(null);

    useEffect(() => {
        api.get("/categories/")
            .then((res) => {
                const activas = (res.data || []).filter((c) => c.estado !== "archivado");
                const raices = activas.filter((c) => !c.categoria_padre);
                setCategorias(raices);
            })
            .catch((err) => console.error("Error cargando categorías:", err));
    }, []);

    // Mostrar primeras 6 categorías en navegación principal, resto en "Más"
    const mainCategories = useMemo(() => categorias.slice(0, 6), [categorias]);
    const moreCategories = useMemo(() => categorias.slice(6), [categorias]);

    return (
        <nav className="navbar-bottom">

            {/* ==================================================
                INICIO
            ================================================== */}

            <div className="nav-item nav-item-home">

                <Link
                    to="/"
                    className="nav-link"
                >
                    Inicio
                </Link>

            </div>


            {/* ==================================================
                CATEGORÍAS PRINCIPALES
            ================================================== */}

            {mainCategories.map((cat) => {
                const hasChildren = categorias.some(
                    (c) => c.categoria_padre?.id_categoria === cat.id_categoria
                );
                const isActive = activeMenu === cat.id_categoria;
                const Icon = getCategoryIcon(cat.nombre);

                return (
                    <div
                        key={cat.id_categoria}
                        className="nav-item"
                        onMouseEnter={() => setActiveMenu(cat.id_categoria)}
                        onMouseLeave={() => setActiveMenu(null)}
                    >
                        <Link
                            to={itemHref(cat.nombre)}
                            className="nav-link"
                        >
                            <Icon size={16} className="nav-category-icon" />
                            {cat.nombre}
                            {hasChildren && <span className="nav-arrow">▾</span>}
                        </Link>

                        {isActive && hasChildren && (
                            <div className="mega-menu mega-menu--productos">
                                <div className="mega-menu-cols">
                                    <div className="mega-column">
                                        <h3><Icon size={16} className="mega-column-icon" />{cat.nombre}</h3>
                                        {categorias
                                            .filter((c) => c.categoria_padre?.id_categoria === cat.id_categoria)
                                            .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                                            .map((sub) => {
                                                const SubIcon = getCategoryIcon(sub.nombre);
                                                return (
                                                    <Link
                                                        key={sub.id_categoria}
                                                        to={itemHref(sub.nombre)}
                                                        className="mega-item"
                                                    >
                                                        <SubIcon size={14} className="mega-item-icon" />
                                                        {sub.nombre}
                                                    </Link>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* ==================================================
                MÁS
            ================================================== */}

            {moreCategories.length > 0 && (
                <div
                    className="nav-item"
                    onMouseEnter={() => setActiveMenu("more")}
                    onMouseLeave={() => setActiveMenu(null)}
                >
                    <span className="nav-link">
                        Más
                        <span className="nav-arrow">▾</span>
                    </span>

                    {activeMenu === "more" && (
                        <div className="mega-menu mega-menu--productos">
                            <div className="mega-menu-cols">
                                <div className="mega-column">
                                    <h3>Más categorías</h3>
                                    {moreCategories.map((cat) => {
                                        const hasChildren = categorias.some(
                                            (c) => c.categoria_padre?.id_categoria === cat.id_categoria
                                        );
                                        const CatIcon = getCategoryIcon(cat.nombre);
                                        return (
                                            <div key={cat.id_categoria}>
                                                <Link
                                                    to={itemHref(cat.nombre)}
                                                    className="mega-item"
                                                >
                                                    <CatIcon size={14} className="mega-item-icon" />
                                                    {cat.nombre}
                                                </Link>
                                                {hasChildren && (
                                                    <div className="mega-subitems">
                                                        {categorias
                                                            .filter((c) => c.categoria_padre?.id_categoria === cat.id_categoria)
                                                            .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                                                            .map((sub) => {
                                                                const SubIcon = getCategoryIcon(sub.nombre);
                                                                return (
                                                                    <Link
                                                                        key={sub.id_categoria}
                                                                        to={itemHref(sub.nombre)}
                                                                        className="mega-item mega-item--sub"
                                                                    >
                                                                        <SubIcon size={12} className="mega-item-icon" />
                                                                        {sub.nombre}
                                                                    </Link>
                                                                );
                                                            })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </nav>
    );
}

export default NavLinks;