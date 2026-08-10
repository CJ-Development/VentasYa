import "./Dashboard.css";

import {
    Package,
    ShoppingCart,
    Users,
    DollarSign,
    ArrowRight,
    AlertTriangle
} from "lucide-react";

import { useEffect, useState } from "react";

import DashboardCard from "../components/DashboardCard";

import api, { getLowStockVariants } from "../../services/api";

const formatearPesos = (valor) => {
    if (typeof valor !== "number" || Number.isNaN(valor)) return "$0";
    return `$${valor.toLocaleString("es-CO")}`;
};

function Dashboard() {

    const [stats, setStats] = useState({
        productos: null,
        pedidos: null,
        usuarios: null,
        ventasMes: null,
        ultimosPedidos: [],
        pocoStock: [],
    });

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const cargarDatos = async () => {

        setLoading(true);
        setError(null);

        const inicioMes = new Date();

        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);

        try {

            const [productos, pedidos, usuarios, pocoStock] = await Promise.all([
                api.get("products/"),
                api.get("orders/"),
                api.get("users/"),
                getLowStockVariants(),
            ]);

            const compras = pedidos.data || [];

            const ventasMes = compras
                .filter((compra) => new Date(compra.fecha_compra) >= inicioMes)
                .reduce((acc, compra) => acc + Number(compra.total || 0), 0);

            setStats({
                productos: productos.data?.length ?? 0,
                pedidos: compras.length,
                usuarios: usuarios.data?.length ?? 0,
                ventasMes,
                ultimosPedidos: compras.slice(0, 5),
                pocoStock: pocoStock.data || [],
            });

        }

        catch(err){

            console.error(err);
            setError("No fue posible cargar los datos del panel.");

        }

        finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        cargarDatos();

    }, []);

    const tarjetas = [
        {
            icon: <Package size={28} />,
            title: "Productos",
            value: stats.productos ?? "—",
            extra: "Registrados en la tienda",
        },
        {
            icon: <ShoppingCart size={28} />,
            title: "Pedidos",
            value: stats.pedidos ?? "—",
            extra: `${stats.ultimosPedidos.filter((p) => p.estado_compra === "pendiente").length} pendientes`,
        },
        {
            icon: <Users size={28} />,
            title: "Usuarios",
            value: stats.usuarios ?? "—",
            extra: "Cuentas activas",
        },
        {
            icon: <DollarSign size={28} />,
            title: "Ventas",
            value: formatearPesos(stats.ventasMes ?? 0),
            extra: "Este mes",
        },
    ];

    if (loading) {

        return <div className="dashboard">Cargando panel...</div>;

    }

    return (

        <div className="dashboard">

            {/* ================= HEADER ================= */}

            <section className="dashboard-header">

                <div className="dashboard-title">

                    <span className="dashboard-tag">

                        Panel Administrativo

                    </span>

                    <h1>

                        Resumen general

                    </h1>

                    <p>

                        Administra productos, pedidos y usuarios de tu tienda desde un solo lugar.

                    </p>

                </div>

                <button
                    className="dashboard-button"
                    onClick={cargarDatos}
                >

                    Actualizar

                </button>

            </section>

            {error && (
                <div className="dashboard-error">
                    {error}
                </div>
            )}

            {/* ================= TARJETAS ================= */}

            <section className="dashboard-cards">

                {tarjetas.map((tarjeta) => (
                    <DashboardCard
                        key={tarjeta.title}
                        icon={tarjeta.icon}
                        title={tarjeta.title}
                        value={tarjeta.value}
                        extra={tarjeta.extra}
                    />
                ))}

            </section>

            {/* ================= CONTENIDO ================= */}

            <section className="dashboard-grid">

                {/* Últimos pedidos */}

                <div className="dashboard-panel">

                    <div className="panel-header">

                        <h2>

                            Últimos pedidos

                        </h2>

                        <button>

                            Ver todos

                            <ArrowRight size={18} />

                        </button>

                    </div>

                    <table className="dashboard-table">

                        <thead>

                            <tr>

                                <th>#</th>

                                <th>Cliente</th>

                                <th>Total</th>

                                <th>Estado</th>

                            </tr>

                        </thead>

                        <tbody>

                            {stats.ultimosPedidos.length === 0 ? (

                                <tr>

                                    <td colSpan="4" style={{ textAlign: "center" }}>

                                        Aún no hay pedidos registrados.

                                    </td>

                                </tr>

                            ) : (
                                stats.ultimosPedidos.map((pedido) => {

                                    const cliente = pedido.usuario_info
                                        ? `${pedido.usuario_info.nombres} ${pedido.usuario_info.apellidos}`
                                        : `Usuario #${pedido.usuario}`;

                                    const estado = pedido.estado_compra || "pendiente";

                                    const claseEstado = {
                                        pagado: "success",
                                        pendiente: "warning",
                                        enviado: "shipping",
                                        entregado: "success",
                                        cancelado: "danger",
                                    }[estado] || "warning";

                                    return (

                                        <tr key={pedido.id_compra}>

                                            <td>#{pedido.id_compra}</td>

                                            <td>{cliente}</td>

                                            <td>{formatearPesos(Number(pedido.total))}</td>

                                            <td>

                                                <span className={`status ${claseEstado}`}>

                                                    {estado.charAt(0).toUpperCase() + estado.slice(1)}

                                                </span>

                                            </td>

                                        </tr>

                                    );

                                })
                            )}

                        </tbody>

                    </table>

                </div>

                {/* Stock */}

                <div className="dashboard-panel">

                    <div className="panel-header">

                        <h2>

                            Poco stock

                        </h2>

                    </div>

                    <div className="stock-list">

                        {stats.pocoStock.length === 0 ? (

                            <div className="stock-item">

                                <div>

                                    <strong>Sin variantes con bajo stock</strong>

                                    <span>Todas las variantes tienen al menos 5 unidades.</span>

                                </div>

                            </div>

                        ) : (
                            stats.pocoStock.map((variante) => (

                                <div
                                    key={variante.id_variante}
                                    className="stock-item"
                                >

                                    <div>

                                        <strong>

                                            {variante.producto_nombre}

                                        </strong>

                                        <span>

                                            SKU {variante.sku} — Quedan {variante.stock} unidades

                                        </span>

                                    </div>

                                    <AlertTriangle
                                        color={variante.stock <= 2 ? "#dc2626" : "#d97706"}
                                    />

                                </div>

                            ))
                        )}

                    </div>

                </div>

            </section>

        </div>

    );

}

export default Dashboard;