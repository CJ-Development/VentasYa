import { useEffect, useMemo, useState } from "react";
import { Sparkles, Tag, Flame, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import api from "../../services/api";

import "./MegaMenu.css";

/* =====================================================
   MegaMenu
   ----------------------------------------------------
   - variant="productos": catalogo, categorias + panel
     destacado con CTA.
   - variant="ofertas":   promos, badges llamativos,
     gradiente y CTAs a /offers.

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
const cacheOfertas = { data: null, promise: null };

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

const fetchOfertas = async () => {
    if (cacheOfertas.data) return cacheOfertas.data;
    if (cacheOfertas.promise) return cacheOfertas.promise;
    cacheOfertas.promise = api.get("/offers/")
        .then((res) => {
            cacheOfertas.data = res.data || [];
            return cacheOfertas.data;
        })
        .finally(() => {
            cacheOfertas.promise = null;
        });
    return cacheOfertas.promise;
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

/* Columnas del mega-menú de ofertas: misma estructura raíz/hijos
 * que armarColumnasProductos, pero filtrando las categorías a las
 * que tienen al menos una oferta activa y vigente. */
const armarColumnasOfertas = (categorias, ofertas) => {

    const ahora = Date.now();

    const ofertaVigente = (o) => {
        if (o.activa === false) return false;
        if (o.fecha_inicio) {
            const ts = new Date(o.fecha_inicio).getTime();
            if (Number.isNaN(ts)) return false;
            if (ahora < ts) return false;
        }
        if (o.fecha_fin) {
            const ts = new Date(o.fecha_fin).getTime();
            if (Number.isNaN(ts)) return false;
            if (ahora > ts) return false;
        }
        return true;
    };

    const idsConOferta = new Set();

    (ofertas || []).filter(ofertaVigente).forEach((o) => {
        const detalle = Array.isArray(o.categorias_detalle)
            ? o.categorias_detalle
            : null;
        if (detalle && detalle.length > 0) {
            detalle.forEach((c) => {
                if (c.id_categoria) idsConOferta.add(c.id_categoria);
                if (c.id_categoria_padre) {
                    idsConOferta.add(c.id_categoria_padre);
                }
            });
            return;
        }
        const idCat = o.producto_detalle?.categoria?.id_categoria;
        const idPadre = o.producto_detalle?.categoria?.categoria_padre?.id_categoria;
        if (idCat) idsConOferta.add(idCat);
        if (idPadre) idsConOferta.add(idPadre);
    });

    const activas = (categorias || [])
        .filter((c) => c.estado !== "archivado")
        .filter((c) => idsConOferta.has(c.id_categoria));

    if (activas.length === 0) return [];

    const raices = activas.filter((c) => !c.categoria_padre);
    const hijosDe = (idPadre) => activas
        .filter((c) => c.categoria_padre?.id_categoria === idPadre)
        .sort((a, b) => (a.orden || 0) - (b.orden || 0));

    if (raices.length === 0) {
        return [
            {
                titulo: "Categorías en oferta",
                items: activas
                    .sort((a, b) => a.nombre.localeCompare(b.nombre))
                    .map((c) => ({ label: c.nombre })),
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
    const [ofertas, setOfertas] = useState(cacheOfertas.data || []);

    useEffect(() => {

        let cancelado = false;

        if (variant === "productos") {
            fetchCategorias()
                .then((data) => {
                    if (!cancelado) setCategorias(data);
                })
                .catch((err) => console.error("MegaMenu: error categorías", err));
        }

        if (variant === "ofertas") {
            Promise.all([fetchCategorias(), fetchOfertas()])
                .then(([cats, ofs]) => {
                    if (cancelado) return;
                    setCategorias(cats);
                    setOfertas(ofs);
                })
                .catch((err) => console.error("MegaMenu: error ofertas", err));
        }

        return () => {
            cancelado = true;
        };

    }, [variant]);

    const data = useMemo(() => {

        if (variant === "ofertas") {
            return {
                columns: armarColumnasOfertas(categorias, ofertas),
                panel: {
                    tag: "Ofertas",
                    title: "Promociones vigentes",
                    description: "Descuentos activos organizados por categoría.",
                    cta: "Ver todas las ofertas",
                    href: "/offers",
                },
            };
        }

        return {
            columns: armarColumnasProductos(categorias),
            panel: {
                tag: "Novedades",
                title: "Colección primavera 2026",
                description: "Textiles frescos, colores vibrantes y la mejor calidad para toda la familia.",
                cta: "Descubrir",
                href: "/products",
            },
        };

    }, [variant, categorias, ofertas]);

    const Icon = variant === "ofertas" ? Tag : Sparkles;

    const tieneDatos = variant === "ofertas"
        ? ofertas.length > 0
        : categorias.length > 0;

    return (
        <div className={`mega-menu mega-menu--${variant}`}>

            {/* Columnas de categorías/subcategorías (a la izquierda) */}
            <div className="mega-menu-cols">
                {data.columns.map((col) => (
                    <div className="mega-column" key={col.titulo}>
                        {col.href ? (
                            <Link to={col.href} className="mega-column-title">
                                <h3>
                                    {variant === "ofertas" && <Flame size={16} />}
                                    {col.titulo}
                                </h3>
                            </Link>
                        ) : (
                            <h3>
                                {variant === "ofertas" && <Flame size={16} />}
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
