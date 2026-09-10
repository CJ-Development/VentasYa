import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import "./MegaMenu.css";

const itemHref = (slug, id) => {
    if (slug) return `/categoria/${slug}`;
    return `/categoria/${id}`;
};

const getChildren = (category) => {
    if (!category) return [];

    if (Array.isArray(category.subcategorias)) {
        return category.subcategorias.filter(
            (item) => item?.estado !== "archivado"
        );
    }

    if (Array.isArray(category.hijos)) {
        return category.hijos.filter(
            (item) => item?.estado !== "archivado"
        );
    }

    return [];
};

const getDirectChildren = (category) => {
    return getChildren(category);
};

/*
 * El MegaMenu visualiza:
 *
 * Nivel 1 → categoría seleccionada en Navbar
 * Nivel 2 → columnas
 * Nivel 3 → elementos de cada columna
 *
 * Los niveles 4, 5 y 6 siguen existiendo en la estructura,
 * pero no se fuerzan dentro del MegaMenu porque eso dañaría
 * su composición horizontal. "Ver todo" lleva a la categoría
 * correspondiente para continuar navegando.
 */

function MegaMenu({
    category = null,
    categories = [],
    anchorElement = null,
    onNavigate,
    isMore = false,
}) {
    const menuRef = useRef(null);
    const [position, setPosition] = useState({
        left: 16,
        top: 0,
    });

    const roots = useMemo(() => {
        if (category) {
            return [category];
        }

        return Array.isArray(categories) ? categories : [];
    }, [category, categories]);

    /*
     * Cuando existe una categoría principal seleccionada:
     *
     * HOMBRE
     *   ↓
     * ROPA | CALZADO | ROPA DEPORTIVA
     *
     * Cada subcategoría se transforma en una columna.
     */
    const columns = useMemo(() => {
        if (category) {
            return getDirectChildren(category);
        }

        /*
         * "Más" muestra las categorías restantes como columnas.
         * Cada raíz puede mostrar sus subcategorías como items.
         */
        return roots;
    }, [category, roots]);

    const updatePosition = () => {
        if (!anchorElement || !menuRef.current) return;

        const rect = anchorElement.getBoundingClientRect();
        const menuRect = menuRef.current.getBoundingClientRect();

        const viewportWidth = window.innerWidth;

        const safeMargin = 16;

        /*
         * Posición ideal:
         * comienza alineado con la izquierda del elemento
         * que abrió el MegaMenu.
         */
        const idealLeft = rect.left;

        /*
         * Límite derecho:
         * nunca permitir que el menú se salga del viewport.
         */
        const maxLeft = Math.max(
            safeMargin,
            viewportWidth - menuRect.width - safeMargin
        );

        const finalLeft = Math.min(
            Math.max(idealLeft, safeMargin),
            maxLeft
        );

        setPosition({
            left: finalLeft,
            top: rect.bottom + 8,
        });
    };

    useLayoutEffect(() => {
        updatePosition();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [anchorElement, columns.length]);

    useEffect(() => {
        const handleViewportChange = () => {
            updatePosition();
        };

        window.addEventListener("resize", handleViewportChange);
        window.addEventListener(
            "scroll",
            handleViewportChange,
            true
        );

        return () => {
            window.removeEventListener(
                "resize",
                handleViewportChange
            );

            window.removeEventListener(
                "scroll",
                handleViewportChange,
                true
            );
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [anchorElement]);

    if (!columns.length) {
        return null;
    }

    return (
        <div
            ref={menuRef}
            className={`mega-menu mega-menu--horizontal ${
                isMore ? "mega-menu--more" : ""
            }`}
            style={{
                left: `${position.left}px`,
                top: `${position.top}px`,
            }}
            onMouseDown={(event) => event.stopPropagation()}
        >
            <div className="mega-menu-scroll">

                {columns.map((column) => {
                    const childItems = getChildren(column);

                    /*
                     * Para un MegaMenu abierto desde una categoría:
                     *
                     * column = Ropa
                     * childItems = Camisas, Pantalones, Jeans...
                     */
                    if (category) {
                        return (
                            <div
                                key={column.id_categoria}
                                className="mega-column"
                            >
                                <Link
                                    to={itemHref(
                                        column.slug,
                                        column.id_categoria
                                    )}
                                    className="mega-column-title"
                                    onClick={onNavigate}
                                >
                                    <span>
                                        {column.nombre}
                                    </span>

                                    <ChevronRight
                                        size={14}
                                        aria-hidden="true"
                                    />
                                </Link>

                                <div className="mega-column-items">
                                    {childItems.length > 0 ? (
                                        childItems.map((item) => (
                                            <Link
                                                key={item.id_categoria}
                                                to={itemHref(
                                                    item.slug,
                                                    item.id_categoria
                                                )}
                                                className="mega-item"
                                                onClick={onNavigate}
                                            >
                                                <span>
                                                    {item.nombre}
                                                </span>
                                            </Link>
                                        ))
                                    ) : (
                                        <Link
                                            to={itemHref(
                                                column.slug,
                                                column.id_categoria
                                            )}
                                            className="mega-item mega-item--empty"
                                            onClick={onNavigate}
                                        >
                                            Ver productos
                                        </Link>
                                    )}
                                </div>

                                <Link
                                    to={itemHref(
                                        column.slug,
                                        column.id_categoria
                                    )}
                                    className="mega-column-all"
                                    onClick={onNavigate}
                                >
                                    Ver todo
                                    <ArrowRight
                                        size={13}
                                        aria-hidden="true"
                                    />
                                </Link>
                            </div>
                        );
                    }

                    /*
                     * "Más":
                     * cada categoría restante se convierte en una
                     * columna.
                     */
                    return (
                        <div
                            key={column.id_categoria}
                            className="mega-column"
                        >
                            <Link
                                to={itemHref(
                                    column.slug,
                                    column.id_categoria
                                )}
                                className="mega-column-title"
                                onClick={onNavigate}
                            >
                                <span>{column.nombre}</span>

                                <ChevronRight
                                    size={14}
                                    aria-hidden="true"
                                />
                            </Link>

                            <div className="mega-column-items">
                                {childItems.length > 0 ? (
                                    childItems.map((item) => (
                                        <Link
                                            key={item.id_categoria}
                                            to={itemHref(
                                                item.slug,
                                                item.id_categoria
                                            )}
                                            className="mega-item"
                                            onClick={onNavigate}
                                        >
                                            {item.nombre}
                                        </Link>
                                    ))
                                ) : (
                                    <Link
                                        to={itemHref(
                                            column.slug,
                                            column.id_categoria
                                        )}
                                        className="mega-item mega-item--empty"
                                        onClick={onNavigate}
                                    >
                                        Ver productos
                                    </Link>
                                )}
                            </div>

                            <Link
                                to={itemHref(
                                    column.slug,
                                    column.id_categoria
                                )}
                                className="mega-column-all"
                                onClick={onNavigate}
                            >
                                Ver todo
                                <ArrowRight
                                    size={13}
                                    aria-hidden="true"
                                />
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default MegaMenu;