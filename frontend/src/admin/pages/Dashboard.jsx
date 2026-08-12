import "./Dashboard.css";

import {
    Package,
    ShoppingCart,
    Users,
    DollarSign,
    ArrowUpRight,
    ArrowRight,
    AlertTriangle,
    RefreshCw
} from "lucide-react";

import { useEffect, useState } from "react";

import DashboardCard from "../components/DashboardCard";

import api, { getLowStockVariants } from "../../services/api";


const formatearPesos = (valor) => {

    if (
        typeof valor !== "number" ||
        Number.isNaN(valor)
    ) {
        return "$0";
    }

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

            const [
                productos,
                pedidos,
                usuarios,
                pocoStock
            ] = await Promise.all([

                api.get("products/"),

                api.get("orders/"),

                api.get("users/"),

                getLowStockVariants(),

            ]);


            const compras = pedidos.data || [];


            const ventasMes = compras

                .filter(
                    (compra) =>
                        new Date(compra.fecha_compra) >= inicioMes
                )

                .reduce(
                    (acc, compra) =>
                        acc + Number(compra.total || 0),
                    0
                );


            setStats({

                productos: productos.data?.length ?? 0,

                pedidos: compras.length,

                usuarios: usuarios.data?.length ?? 0,

                ventasMes,

                ultimosPedidos: compras.slice(0, 5),

                pocoStock: pocoStock.data || [],

            });

        }


        catch (err) {

            console.error(err);

            setError(
                "No fue posible cargar los datos del panel."
            );

        }


        finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        cargarDatos();

    }, []);


    const pedidosPendientes =
        stats.ultimosPedidos.filter(
            (p) => p.estado_compra === "pendiente"
        ).length;


    const tarjetas = [

        {

            icon: <Package />,

            title: "Productos",

            value: stats.productos ?? "—",

            extra: "Productos registrados",

            type: "products",

        },

        {

            icon: <ShoppingCart />,

            title: "Pedidos",

            value: stats.pedidos ?? "—",

            extra: `${pedidosPendientes} pendientes`,

            type: "orders",

        },

        {

            icon: <Users />,

            title: "Usuarios",

            value: stats.usuarios ?? "—",

            extra: "Cuentas registradas",

            type: "users",

        },

        {

            icon: <DollarSign />,

            title: "Ventas",

            value: formatearPesos(
                stats.ventasMes ?? 0
            ),

            extra: "Ventas de este mes",

            type: "sales",

        },

    ];


    if (loading) {

        return (

            <div className="dashboard-loading">

                <RefreshCw size={22} />

                Cargando panel...

            </div>

        );

    }


    return (

        <main className="dashboard">


            {/* =====================================
                HEADER
            ===================================== */}

            <section className="dashboard-header">

                <div className="dashboard-title">

                    <span className="dashboard-tag">

                        Panel administrativo

                    </span>


                    <h1>
                        Resumen general
                    </h1>


                    <p>
                        Gestiona y supervisa el funcionamiento
                        de tu tienda desde un solo lugar.
                    </p>

                </div>


                <button
                    className="dashboard-button"
                    onClick={cargarDatos}
                >

                    <RefreshCw size={17} />

                    Actualizar

                </button>

            </section>


            {error && (

                <div className="dashboard-error">

                    <AlertTriangle size={18} />

                    {error}

                </div>

            )}


            {/* =====================================
                TARJETAS
            ===================================== */}

            <section className="dashboard-cards">

                {tarjetas.map((tarjeta) => (

                    <DashboardCard
                        key={tarjeta.title}
                        icon={tarjeta.icon}
                        title={tarjeta.title}
                        value={tarjeta.value}
                        extra={tarjeta.extra}
                        type={tarjeta.type}
                    />

                ))}

            </section>


            {/* =====================================
                CONTENIDO
            ===================================== */}

            <section className="dashboard-grid">


                {/* PEDIDOS */}

                <div className="dashboard-panel">

                    <div className="panel-header">

                        <div>

                            <h2>
                                Últimos pedidos
                            </h2>

                            <p>
                                Actividad reciente de tu tienda
                            </p>

                        </div>


                        <button
                            type="button"
                            onClick={() =>
                                window.location.href =
                                    "/admin/orders"
                            }
                        >

                            Ver todos

                            <ArrowRight size={17} />

                        </button>

                    </div>


                    <div className="table-wrapper">

                        <table className="dashboard-table">

                            <thead>

                                <tr>

                                    <th>
                                        Pedido
                                    </th>

                                    <th>
                                        Cliente
                                    </th>

                                    <th>
                                        Total
                                    </th>

                                    <th>
                                        Estado
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {stats.ultimosPedidos.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="4"
                                            className="empty-table"
                                        >

                                            Aún no hay pedidos registrados.

                                        </td>

                                    </tr>

                                ) : (

                                    stats.ultimosPedidos.map(
                                        (pedido) => {

                                            const cliente =
                                                pedido.usuario_info

                                                    ? `${pedido.usuario_info.nombres} ${pedido.usuario_info.apellidos}`

                                                    : `Usuario #${pedido.usuario}`;


                                            const estado =
                                                pedido.estado_compra ||
                                                "pendiente";


                                            const claseEstado = {

                                                pagado: "success",

                                                pendiente: "warning",

                                                enviado: "shipping",

                                                entregado: "success",

                                                cancelado: "danger",

                                            }[estado] || "warning";


                                            return (

                                                <tr
                                                    key={
                                                        pedido.id_compra
                                                    }
                                                >

                                                    <td>

                                                        <strong className="order-id">

                                                            #{pedido.id_compra}

                                                        </strong>

                                                    </td>


                                                    <td>

                                                        <span className="client-name">

                                                            {cliente}

                                                        </span>

                                                    </td>


                                                    <td>

                                                        <strong>

                                                            {
                                                                formatearPesos(
                                                                    Number(
                                                                        pedido.total
                                                                    )
                                                                )
                                                            }

                                                        </strong>

                                                    </td>


                                                    <td>

                                                        <span
                                                            className={
                                                                `status ${claseEstado}`
                                                            }
                                                        >

                                                            {
                                                                estado
                                                                    .charAt(0)
                                                                    .toUpperCase()
                                                                    +
                                                                estado.slice(1)
                                                            }

                                                        </span>

                                                    </td>

                                                </tr>

                                            );

                                        }
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>



                {/* STOCK */}

                <div className="dashboard-panel stock-panel">

                    <div className="panel-header">

                        <div>

                            <h2>
                                Poco stock
                            </h2>

                            <p>
                                Productos que requieren atención
                            </p>

                        </div>

                    </div>


                    <div className="stock-list">

                        {stats.pocoStock.length === 0 ? (

                            <div className="stock-empty">

                                <div className="stock-empty-icon">

                                    <Package size={20} />

                                </div>

                                <div>

                                    <strong>
                                        Todo en orden
                                    </strong>

                                    <span>
                                        No hay variantes con bajo stock.
                                    </span>

                                </div>

                            </div>

                        ) : (

                            stats.pocoStock.map(
                                (variante) => (

                                    <div
                                        key={
                                            variante.id_variante
                                        }
                                        className="stock-item"
                                    >

                                        <div className="stock-product-icon">

                                            <Package size={17} />

                                        </div>


                                        <div className="stock-info">

                                            <strong>

                                                {
                                                    variante.producto_nombre
                                                }

                                            </strong>

                                            <span>

                                                SKU {variante.sku}

                                            </span>

                                        </div>


                                        <div
                                            className={
                                                `stock-number ${
                                                    variante.stock <= 2
                                                        ? "critical"
                                                        : ""
                                                }`
                                            }
                                        >

                                            <strong>
                                                {variante.stock}
                                            </strong>

                                            <span>
                                                unidades
                                            </span>

                                        </div>


                                        <AlertTriangle
                                            size={18}
                                            className="stock-warning"
                                        />

                                    </div>

                                )
                            )

                        )}

                    </div>

                </div>

            </section>


            {/* =====================================
                RESUMEN INFERIOR
            ===================================== */}

            <section className="dashboard-bottom">

                <div className="dashboard-bottom-card">

                    <div className="bottom-icon">

                        <ArrowUpRight size={20} />

                    </div>

                    <div>

                        <span>
                            Ventas del mes
                        </span>

                        <strong>
                            {formatearPesos(
                                stats.ventasMes ?? 0
                            )}
                        </strong>

                    </div>

                </div>


                <div className="dashboard-bottom-card">

                    <div className="bottom-icon">

                        <ShoppingCart size={20} />

                    </div>

                    <div>

                        <span>
                            Pedidos registrados
                        </span>

                        <strong>
                            {stats.pedidos ?? 0}
                        </strong>

                    </div>

                </div>


                <div className="dashboard-bottom-card">

                    <div className="bottom-icon">

                        <Users size={20} />

                    </div>

                    <div>

                        <span>
                            Usuarios
                        </span>

                        <strong>
                            {stats.usuarios ?? 0}
                        </strong>

                    </div>

                </div>

            </section>

        </main>

    );

}


export default Dashboard;