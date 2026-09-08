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

const itemHref = (slug, id) => {
    if (slug) return `/categoria/${slug}`;
    return `/categoria/${id}`;
};

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
                const hasChildren = (cat.subcategorias || []).length > 0;
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
                            to={itemHref(cat.slug, cat.id_categoria)}
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
                                        {(cat.subcategorias || []).map((sub) => {
                                            const SubIcon = getCategoryIcon(sub.nombre);
                                            const hasSubSubs = (sub.subcategorias || []).length > 0;
                                            return (
                                                <div key={sub.id_categoria}>
                                                    <Link
                                                        to={itemHref(sub.slug, sub.id_categoria)}
                                                        className="mega-item"
                                                    >
                                                        <SubIcon size={14} className="mega-item-icon" />
                                                        {sub.nombre}
                                                    </Link>
                                                    {hasSubSubs && (
                                                        <div className="mega-subitems">
                                                            {(sub.subcategorias || []).map((subsub) => {
                                                                const SubSubIcon = getCategoryIcon(subsub.nombre);
                                                                return (
                                                                    <Link
                                                                        key={subsub.id_categoria}
                                                                        to={itemHref(subsub.slug, subsub.id_categoria)}
                                                                        className="mega-item mega-item--sub"
                                                                    >
                                                                        <SubSubIcon size={12} className="mega-item-icon" />
                                                                        {subsub.nombre}
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
                                        const hasChildren = (cat.subcategorias || []).length > 0;
                                        const CatIcon = getCategoryIcon(cat.nombre);
                                        return (
                                            <div key={cat.id_categoria}>
                                                <Link
                                                    to={itemHref(cat.slug, cat.id_categoria)}
                                                    className="mega-item"
                                                >
                                                    <CatIcon size={14} className="mega-item-icon" />
                                                    {cat.nombre}
                                                </Link>
                                                {hasChildren && (
                                                    <div className="mega-subitems">
                                                        {(cat.subcategorias || []).map((sub) => {
                                                            const SubIcon = getCategoryIcon(sub.nombre);
                                                            const hasSubSubs = (sub.subcategorias || []).length > 0;
                                                            return (
                                                                <div key={sub.id_categoria}>
                                                                    <Link
                                                                        to={itemHref(sub.slug, sub.id_categoria)}
                                                                        className="mega-item mega-item--sub"
                                                                    >
                                                                        <SubIcon size={12} className="mega-item-icon" />
                                                                        {sub.nombre}
                                                                    </Link>
                                                                    {hasSubSubs && (
                                                                        <div className="mega-subitems">
                                                                            {(sub.subcategorias || []).map((subsub) => {
                                                                                const SubSubIcon = getCategoryIcon(subsub.nombre);
                                                                                return (
                                                                                    <Link
                                                                                        key={subsub.id_categoria}
                                                                                        to={itemHref(subsub.slug, subsub.id_categoria)}
                                                                                        className="mega-item mega-item--sub"
                                                                                    >
                                                                                        <SubSubIcon size={10} className="mega-item-icon" />
                                                                                        {subsub.nombre}
                                                                                    </Link>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
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