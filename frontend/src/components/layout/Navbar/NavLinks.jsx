import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

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
                            {cat.nombre}
                            {hasChildren && <span className="nav-arrow">▾</span>}
                        </Link>

                        {isActive && hasChildren && (
                            <div className="mega-menu mega-menu--productos">
                                <div className="mega-menu-cols">
                                    <div className="mega-column">
                                        <h3>{cat.nombre}</h3>
                                        {categorias
                                            .filter((c) => c.categoria_padre?.id_categoria === cat.id_categoria)
                                            .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                                            .map((sub) => (
                                                <Link
                                                    key={sub.id_categoria}
                                                    to={itemHref(sub.nombre)}
                                                    className="mega-item"
                                                >
                                                    {sub.nombre}
                                                </Link>
                                            ))}
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
                                        return (
                                            <div key={cat.id_categoria}>
                                                <Link
                                                    to={itemHref(cat.nombre)}
                                                    className="mega-item"
                                                >
                                                    {cat.nombre}
                                                </Link>
                                                {hasChildren && (
                                                    <div className="mega-subitems">
                                                        {categorias
                                                            .filter((c) => c.categoria_padre?.id_categoria === cat.id_categoria)
                                                            .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                                                            .map((sub) => (
                                                                <Link
                                                                    key={sub.id_categoria}
                                                                    to={itemHref(sub.nombre)}
                                                                    className="mega-item mega-item--sub"
                                                                >
                                                                    {sub.nombre}
                                                                </Link>
                                                            ))}
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