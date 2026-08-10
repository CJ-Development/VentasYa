import { Info, Sparkles, Tag, Flame, Crown, ArrowRight } from "lucide-react";
import "./MegaMenu.css";

/* =====================================================
   MegaMenu
   ----------------------------------------------------
   - variant="productos": catalogo, categorias + panel
     destacado con CTA. Editable por el admin.
   - variant="ofertas":   promos, badges llamativos,
     gradiente y CTAs a /offers. Editable por el admin.
===================================================== */

const MENUS = {
    productos: {
        columns: [
            {
                titulo: "Mujer",
                items: ["Vestidos", "Blusas", "Jeans", "Chaquetas", "Zapatos"],
            },
            {
                titulo: "Hombre",
                items: ["Camisas", "Jeans", "Chaquetas", "Tenis", "Sudaderas"],
            },
            {
                titulo: "Niños",
                items: ["Niño", "Niña", "Bebés"],
            },
        ],
        panel: {
            tag: "Novedades",
            title: "Colección primavera 2026",
            description: "Textiles frescos, colores vibrantes y la mejor calidad para toda la familia.",
            cta: "Descubrir",
            href: "/products",
        },
    },
    ofertas: {
        columns: [
            {
                titulo: "Flash 24h",
                items: [
                    { label: "Solo hoy", badge: "Hoy" },
                    { label: "Últimas unidades", badge: "Stock" },
                    { label: "Hasta 70% off", badge: "-70%" },
                    { label: "Envío gratis", badge: "Free" },
                ],
            },
            {
                titulo: "Por categoría",
                items: [
                    { label: "Ropa" },
                    { label: "Calzado" },
                    { label: "Accesorios" },
                    { label: "Tecnología" },
                    { label: "Hogar" },
                ],
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
    },
};

function MegaMenu({ variant = "productos" }) {
    const data = MENUS[variant] || MENUS.productos;
    const Icon = variant === "ofertas" ? Tag : Sparkles;

    return (
        <div className={`mega-menu mega-menu--${variant}`}>

            <div className="mega-menu-cols">
                {data.columns.map((col) => (
                    <div className="mega-column" key={col.titulo}>
                        <h3>
                            {variant === "ofertas" && <Flame size={16} />}
                            {col.titulo}
                        </h3>
                        {col.items.map((it, idx) => {
                            const item = typeof it === "string" ? { label: it } : it;
                            return (
                                <a href="#" key={`${col.titulo}-${idx}`} className="mega-item">
                                    <span>{item.label}</span>
                                    {item.badge && (
                                        <span className={`mega-badge mega-badge--${item.badge.toLowerCase().replace(/[^a-z0-9]/g, "")}`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </a>
                            );
                        })}
                    </div>
                ))}
            </div>

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

                {variant === "ofertas" && (
                    <div className="mega-panel-extras">
                        <div className="mega-mini">
                            <Crown size={18} />
                            <div>
                                <strong>Marcas top</strong>
                                <small>Las favoritas del momento</small>
                            </div>
                        </div>
                        <div className="mega-mini">
                            <Flame size={18} />
                            <div>
                                <strong>Tendencia</strong>
                                <small>Lo que todos están viendo</small>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            <div className="mega-menu-note">
                <Info size={14} />
                <span>
                    Esta sección puede ser editada por el equipo
                    administrador desde el panel admin.
                </span>
            </div>
        </div>
    );
}

export default MegaMenu;
