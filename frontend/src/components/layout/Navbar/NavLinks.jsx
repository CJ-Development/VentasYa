import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    User,
    Baby,
    PawPrint,
    Laptop,
    Watch,
    Heart,
    Package,
    Shirt,
    ShoppingBag,
    ChevronDown,
} from "lucide-react";

import api from "../../../services/api";
import MegaMenu from "../../MegaMenu/MegaMenu";

const itemHref = (slug, id) => {
    if (slug) return `/categoria/${slug}`;
    return `/categoria/${id}`;
};

const getCategoryIcon = (nombre = "") => {
    const nombreLower = nombre.toLowerCase();

    if (
        nombreLower.includes("hombre") ||
        nombreLower.includes("caballero")
    ) {
        return User;
    }

    if (
        nombreLower.includes("mujer") ||
        nombreLower.includes("dama") ||
        nombreLower.includes("señora")
    ) {
        return Heart;
    }

    if (
        nombreLower.includes("niñ") ||
        nombreLower.includes("bebé") ||
        nombreLower.includes("bebe")
    ) {
        return Baby;
    }

    if (
        nombreLower.includes("mascot") ||
        nombreLower.includes("perro") ||
        nombreLower.includes("gato")
    ) {
        return PawPrint;
    }

    if (
        nombreLower.includes("tecnolog") ||
        nombreLower.includes("electrónic") ||
        nombreLower.includes("computador") ||
        nombreLower.includes("laptop")
    ) {
        return Laptop;
    }

    if (
        nombreLower.includes("accesorio") ||
        nombreLower.includes("reloj") ||
        nombreLower.includes("gafas")
    ) {
        return Watch;
    }

    if (
        nombreLower.includes("ropa") ||
        nombreLower.includes("vestido") ||
        nombreLower.includes("camisa")
    ) {
        return Shirt;
    }

    if (
        nombreLower.includes("calzado") ||
        nombreLower.includes("zapato")
    ) {
        return ShoppingBag;
    }

    return Package;
};

/*
 * Obtiene el ID del padre de forma tolerante.
 * Soporta respuestas que utilicen:
 * - id_categoria_padre
 * - categoria_padre como objeto
 * - categoria_padre como ID
 */
const getParentId = (categoria) => {
    if (!categoria) return null;

    if (categoria.id_categoria_padre != null) {
        return categoria.id_categoria_padre;
    }

    if (categoria.categoria_padre?.id_categoria != null) {
        return categoria.categoria_padre.id_categoria;
    }

    if (
        typeof categoria.categoria_padre === "number" ||
        typeof categoria.categoria_padre === "string"
    ) {
        return categoria.categoria_padre;
    }

    return null;
};

const normalizeCategories = (categories) => {
    const lista = Array.isArray(categories) ? categories : [];

    return lista
        .filter((categoria) => categoria?.estado !== "archivado")
        .map((categoria) => ({
            ...categoria,
            subcategorias: Array.isArray(categoria.subcategorias)
                ? categoria.subcategorias
                    .filter((sub) => sub?.estado !== "archivado")
                    .map((sub) => ({
                        ...sub,
                        subcategorias: Array.isArray(sub.subcategorias)
                            ? sub.subcategorias.filter(
                                (subsub) =>
                                    subsub?.estado !== "archivado"
                            )
                            : [],
                    }))
                : [],
        }));
};

function NavLinks({ mobileMenuOpen, setMobileMenuOpen }) {
    const [categorias, setCategorias] = useState([]);
    const [activeMenu, setActiveMenu] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [activeAnchor, setActiveAnchor] = useState(null);

    useEffect(() => {
        let cancelado = false;

        api.get("/categories/")
            .then((res) => {
                if (cancelado) return;

                const data = normalizeCategories(res.data || []);

                /*
                 * Cuando la API ya entrega la jerarquía anidada,
                 * usamos directamente las categorías raíz.
                 *
                 * Si eventualmente devuelve una lista plana,
                 * también intentamos detectar raíces mediante el padre.
                 */
                const raices = data.filter(
                    (categoria) => getParentId(categoria) == null
                );

                setCategorias(raices);
            })
            .catch((err) => {
                console.error("Error cargando categorías:", err);
            });

        return () => {
            cancelado = true;
        };
    }, []);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 900);
        };

        checkMobile();

        window.addEventListener("resize", checkMobile);

        return () => {
            window.removeEventListener("resize", checkMobile);
        };
    }, []);

    const handleMenuEnter = (categoryId, element) => {
        if (isMobile) return;

        setActiveMenu(categoryId);
        setActiveAnchor(element);
    };

    const handleMenuLeave = () => {
        if (isMobile) return;

        setActiveMenu(null);
        setActiveAnchor(null);
    };

    const handleMenuToggle = (categoryId, event) => {
        if (!isMobile) return;

        event.preventDefault();

        setActiveMenu((current) =>
            current === categoryId ? null : categoryId
        );

        setActiveAnchor(event.currentTarget);
    };

    const handleLinkClick = () => {
        setActiveMenu(null);
        setActiveAnchor(null);

        if (setMobileMenuOpen) {
            setMobileMenuOpen(false);
        }
    };

    const mainCategories = useMemo(
        () => categorias.slice(0, 6),
        [categorias]
    );

    const moreCategories = useMemo(
        () => categorias.slice(6),
        [categorias]
    );

    return (
        <nav className="navbar-bottom">

            {/* ==================================================
                INICIO
            ================================================== */}
            <div className="nav-item nav-item-home">
                <Link
                    to="/"
                    className="nav-link"
                    onClick={handleLinkClick}
                >
                    Inicio
                </Link>
            </div>

            {/* ==================================================
                CATEGORÍAS PRINCIPALES
            ================================================== */}
            {mainCategories.map((cat) => {
                const hasChildren =
                    Array.isArray(cat.subcategorias) &&
                    cat.subcategorias.length > 0;

                const isActive =
                    activeMenu === cat.id_categoria;

                const Icon = getCategoryIcon(cat.nombre);

                return (
                    <div
                        key={cat.id_categoria}
                        className={`nav-item ${
                            isActive ? "nav-item--mega-open" : ""
                        }`}
                        onMouseEnter={(event) =>
                            handleMenuEnter(
                                cat.id_categoria,
                                event.currentTarget
                            )
                        }
                        onMouseLeave={handleMenuLeave}
                        onClick={(event) =>
                            hasChildren &&
                            handleMenuToggle(
                                cat.id_categoria,
                                event
                            )
                        }
                    >
                        <Link
                            to={itemHref(
                                cat.slug,
                                cat.id_categoria
                            )}
                            className={`nav-link ${
                                isActive ? "is-active" : ""
                            }`}
                            onClick={(event) => {
                                if (isMobile && hasChildren) {
                                    event.preventDefault();
                                } else {
                                    handleLinkClick();
                                }
                            }}
                        >
                            <Icon
                                size={16}
                                className="nav-category-icon"
                            />

                            {cat.nombre}

                            {hasChildren && (
                                <ChevronDown
                                    size={14}
                                    className={`nav-arrow-icon ${
                                        isActive
                                            ? "nav-arrow-icon--open"
                                            : ""
                                    }`}
                                />
                            )}
                        </Link>

                        {isActive && hasChildren && (
                            <MegaMenu
                                category={cat}
                                anchorElement={activeAnchor}
                                onNavigate={handleLinkClick}
                            />
                        )}
                    </div>
                );
            })}

            {/* ==================================================
                MÁS
            ================================================== */}
            {moreCategories.length > 0 && (
                <div
                    className={`nav-item ${
                        activeMenu === "more"
                            ? "nav-item--mega-open"
                            : ""
                    }`}
                    onMouseEnter={(event) =>
                        handleMenuEnter(
                            "more",
                            event.currentTarget
                        )
                    }
                    onMouseLeave={handleMenuLeave}
                    onClick={(event) =>
                        handleMenuToggle("more", event)
                    }
                >
                    <button
                        type="button"
                        className={`nav-link nav-link-button ${
                            activeMenu === "more"
                                ? "is-active"
                                : ""
                        }`}
                        onClick={(event) =>
                            handleMenuToggle("more", event)
                        }
                    >
                        Más
                        <ChevronDown
                            size={14}
                            className="nav-arrow-icon"
                        />
                    </button>

                    {activeMenu === "more" && (
                        <MegaMenu
                            categories={moreCategories}
                            anchorElement={activeAnchor}
                            onNavigate={handleLinkClick}
                            isMore
                        />
                    )}
                </div>
            )}
        </nav>
    );
}

export default NavLinks;