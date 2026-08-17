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

/* Columna "Por categoría" del mega-menú de ofertas:
 * sólo aparecen las categorías con al menos una oferta
 * activa y vigente. */
const armarColumnaCategoriasOferta = (ofertas, categorias) => {

    const hoy = new Date().toISOString().split("T")[0];

    const ofertaVigente = (o) => {
        if (o.activa === false) return false;
        if (o.fecha_inicio && hoy < o.fecha_inicio) return false;
        if (o.fecha_fin && hoy > o.fecha_fin) return false;
        return true;
    };

    const vigentes = (ofertas || []).filter(ofertaVigente);

    if (vigentes.length === 0) return [];

    const mapaCategorias = new Map(
        (categorias || []).map((c) => [c.id_categoria, c.nombre])
    );

    const nombresUnicos = new Set();

    vigentes.forEach((oferta) => {
        const detalle = Array.isArray(oferta.categorias_detalle)
            ? oferta.categorias_detalle
            : null;
        if (detalle && detalle.length > 0) {
            detalle.forEach((c) => nombresUnicos.add(c.nombre));
            return;
        }
        const cat = oferta.producto_detalle?.categoria;
        if (cat?.nombre) {
            nombresUnicos.add(cat.nombre);
            return;
        }
        if (Array.isArray(oferta.categorias_ids)) {
            oferta.categorias_ids.forEach((id) => {
                const nombre = mapaCategorias.get(id);
                if (nombre) nombresUnicos.add(nombre);
            });
        }
    });

    return Array.from(nombresUnicos)
        .sort((a, b) => a.localeCompare(b))
        .map((nombre) => ({ label: nombre }));

};

const OFERTAS_BASE = {
    columns: [
        {
            titulo: "Flash 24h",
            items: [
                { label: "Solo hoy", href: "/offers", badge: "Hoy" },
                { label: "Últimas unidades", href: "/offers", badge: "Stock" },
                { label: "Hasta 70% off", href: "/offers", badge: "-70%" },
                { label: "Envío gratis", href: "/offers", badge: "Free" },
            ],
        },
        {
            titulo: "Por categoría",
            items: [],
        },
        {
            titulo: "Más vendidos",
            items: [
                { label: "Top 10 semanal" },
                { label: "Tendencia" },
                { label: "Mejor valorados" },
                { label: "Recomendados" },
            ],
        },
    ],
    panel: {
        tag: "Top de la semana",
        title: "Hasta 60% OFF en miles de productos",
        description: "Aprovecha descuentos exclusivos por tiempo limitado.",
        cta: "Ver todas las ofertas",
        href: "/offers",
    },
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
            const colsCategoria = armarColumnaCategoriasOferta(ofertas, categorias);
            return {
                ...OFERTAS_BASE,
                columns: OFERTAS_BASE.columns.map((col) =>
                    col.titulo === "Por categoría"
                        ? { ...col, items: colsCategoria }
                        : col
                ),
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
        ? true
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
