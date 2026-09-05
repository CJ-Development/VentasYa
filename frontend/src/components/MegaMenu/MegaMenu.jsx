import { useEffect, useMemo, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import api from "../../services/api";

import "./MegaMenu.css";

/* =====================================================
   MegaMenu
   ----------------------------------------------------
   - variant="productos": catalogo, categorias + panel
     destacado con CTA.

   Layout: panel destacado a la izquierda, columnas de
   categorías/subcategorías a la derecha con menos peso
   visual.

   Cada item de menú tiene la forma { label, href, badge? }.
===================================================== */

const slugify = (label) => label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const itemHref = (label) => `/categoria/${slugify(label)}`;

const toItem = (entry) =>
    typeof entry === "string" ? { label: entry, href: itemHref(entry) } : { ...entry, href: entry.href || itemHref(entry.label) };

/* =====================================================
   Cache simple en memoria para no re-fetchar en cada hover.
===================================================== */
const cacheCategorias = { data: null, promise: null };

const fetchCategorias = async () => {
    if (cacheCategorias.data) return cacheCategorias.data;
    if (cacheCategorias.promise) return cacheCategorias.promise;
    cacheCategorias.promise = api.get("/categories/")
        .then((res) => {
            cacheCategorias.data = res.data || [];
            return cacheCategorias.data;
        })
        .finally(() => {
            cacheCategorias.promise = null;
        });
    return cacheCategorias.promise;
};


/* Acepta la respuesta plana de /categories/ y devuelve una lista
 * de columnas con { titulo, href, items }. Una columna por cada
 * categoría padre; sus subcategorías se vuelven items. */
const armarColumnasProductos = (categorias) => {

    const activas = (categorias || []).filter((c) => c.estado !== "archivado");

    const raices = activas.filter((c) => !c.categoria_padre);

    const hijosDe = (idPadre) => activas
        .filter((c) => c.categoria_padre?.id_categoria === idPadre)
        .sort((a, b) => (a.orden || 0) - (b.orden || 0));

    if (raices.length === 0) {
        return [
            {
                titulo: "Categorías",
                items: activas.map((c) => ({ label: c.nombre })),
            },
        ];
    }

    return raices.map((raiz) => {
        const subs = hijosDe(raiz.id_categoria);
        const items = subs.length > 0
            ? subs.map((s) => ({ label: s.nombre }))
            : [{ label: raiz.nombre }];
        return {
            titulo: raiz.nombre,
            href: itemHref(raiz.nombre),
            items,
        };
    });

};


function MegaMenu({ variant = "productos" }) {

    const [categorias, setCategorias] = useState(cacheCategorias.data || []);

    useEffect(() => {

        let cancelado = false;

        fetchCategorias()
            .then((data) => {
                if (!cancelado) setCategorias(data);
            })
            .catch((err) => console.error("MegaMenu: error categorías", err));

        return () => {
            cancelado = true;
        };

    }, []);

    const data = useMemo(() => {
        return {
            columns: armarColumnasProductos(categorias),
            panel: {
                tag: "Catálogo",
                title: "Explora nuestras categorías",
                description: "Encuentra productos de calidad para toda la familia.",
                cta: "Ver todos los productos",
                href: "/products",
            },
        };

    }, [categorias]);

    const Icon = Sparkles;

    const tieneDatos = categorias.length > 0;

    return (
        <div className="mega-menu mega-menu--productos">

            {/* Columnas de categorías/subcategorías (a la izquierda) */}
            <div className="mega-menu-cols">
                {data.columns.map((col) => (
                    <div className="mega-column" key={col.titulo}>
                        {col.href ? (
                            <Link to={col.href} className="mega-column-title">
                                <h3>
                                    {col.titulo}
                                </h3>
                            </Link>
                        ) : (
                            <h3>
                                {col.titulo}
                            </h3>
                        )}
                        {col.items.length === 0 ? (
                            <span className="mega-item mega-item--empty">
                                {tieneDatos
                                    ? "Próximamente"
                                    : "Cargando..."}
                            </span>
                        ) : (
                            col.items.map((it, idx) => {
                                const item = toItem(it);
                                return (
                                    <Link to={item.href} key={`${col.titulo}-${idx}`} className="mega-item">
                                        <span>{item.label}</span>
                                        {item.badge && (
                                            <span className={`mega-badge mega-badge--${item.badge.toLowerCase().replace(/[^a-z0-9]/g, "")}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })
                        )}
                    </div>
                ))}
            </div>

            {/* Panel destacado (a la derecha, en ambas variantes) */}
            <aside className="mega-menu-panel">
                <div className="mega-panel-head">
                    <span className="mega-panel-tag">
                        <Icon size={14} />
                        {data.panel.tag}
                    </span>
                    <h4>{data.panel.title}</h4>
                    <p>{data.panel.description}</p>
                    <a href={data.panel.href} className="mega-panel-cta">
                        {data.panel.cta}
                        <ArrowRight size={16} />
                    </a>
                </div>
            </aside>

        </div>
    );
}

export default MegaMenu;
