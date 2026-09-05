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
   categorías/subcategorías/sub-subcategorías a la derecha.

   Soporta hasta 3 niveles de jerarquía:
   - Nivel 1: Categoría principal
   - Nivel 2: Subcategoría
   - Nivel 3: Sub-subcategoría
===================================================== */

const itemHref = (slug) => `/categoria/${slug}`;

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


/* Acepta la respuesta jerárquica de /categories/ y devuelve una lista
 * de columnas con { titulo, href, items }. Una columna por cada
 * categoría padre; sus subcategorías y sub-subcategorías se vuelven items. */
const armarColumnasProductos = (categorias) => {

    const activas = (categorias || []).filter((c) => c.estado !== "archivado");

    // Filtrar solo categorías raíz (sin padre)
    const raices = activas.filter((c) => !c.categoria_padre);

    if (raices.length === 0) {
        return [
            {
                titulo: "Categorías",
                items: activas.map((c) => ({ 
                    label: c.nombre, 
                    slug: c.slug 
                })),
            },
        ];
    }

    return raices.map((raiz) => {
        const items = [];
        
        // Agregar subcategorías del backend
        const subs = raiz.subcategorias || [];
        
        subs.forEach((sub) => {
            // Agregar subcategoría
            items.push({
                label: sub.nombre,
                slug: sub.slug,
                isSub: true
            });
            
            // Agregar sub-subcategorías
            const subsubs = sub.subcategorias || [];
            subsubs.forEach((subsub) => {
                items.push({
                    label: subsub.nombre,
                    slug: subsub.slug,
                    isSubSub: true
                });
            });
        });
        
        // Si no tiene subcategorías, agregar la categoría raíz como item
        if (items.length === 0) {
            items.push({
                label: raiz.nombre,
                slug: raiz.slug
            });
        }
        
        return {
            titulo: raiz.nombre,
            href: itemHref(raiz.slug),
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
                                const href = itemHref(it.slug);
                                return (
                                    <Link 
                                        to={href} 
                                        key={`${col.titulo}-${idx}`} 
                                        className={`mega-item ${it.isSub ? 'mega-item--sub' : ''} ${it.isSubSub ? 'mega-item--subsub' : ''}`}
                                    >
                                        <span>{it.label}</span>
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
