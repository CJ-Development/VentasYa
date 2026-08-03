import "./Dashboard.css";

import {
    Package,
    ShoppingCart,
    Users,
    DollarSign,
    ArrowRight,
    AlertTriangle
} from "lucide-react";

import DashboardCard from "../components/DashboardCard";

function Dashboard() {

    return (

        <div className="dashboard">

            {/* ================= HEADER ================= */}

            <section className="dashboard-header">

                <div className="dashboard-title">

                    <span className="dashboard-tag">

                        Panel Administrativo

                    </span>

                    <h1>

                        Hola, John 

                    </h1>

                    <p>

                        Administra productos, pedidos y usuarios de tu tienda desde un solo lugar.

                    </p>

                </div>

                <button className="dashboard-button">

                    Nuevo producto

                </button>

            </section>

            {/* ================= TARJETAS ================= */}

            <section className="dashboard-cards">

                <DashboardCard
                    icon={<Package size={28} />}
                    title="Productos"
                    value="320"
                    extra="+18 este mes"
                />

                <DashboardCard
                    icon={<ShoppingCart size={28} />}
                    title="Pedidos"
                    value="46"
                    extra="8 pendientes"
                />

                <DashboardCard
                    icon={<Users size={28} />}
                    title="Usuarios"
                    value="1.284"
                    extra="+54 nuevos"
                />

                <DashboardCard
                    icon={<DollarSign size={28} />}
                    title="Ventas"
                    value="$8.250.000"
                    extra="Este mes"
                />

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

                            <tr>

                                <td>#1045</td>

                                <td>Juan Pérez</td>

                                <td>$180.000</td>

                                <td>

                                    <span className="status success">

                                        Pagado

                                    </span>

                                </td>

                            </tr>

                            <tr>

                                <td>#1044</td>

                                <td>Laura Díaz</td>

                                <td>$95.000</td>

                                <td>

                                    <span className="status warning">

                                        Pendiente

                                    </span>

                                </td>

                            </tr>

                            <tr>

                                <td>#1043</td>

                                <td>Camilo Ruiz</td>

                                <td>$420.000</td>

                                <td>

                                    <span className="status shipping">

                                        Enviado

                                    </span>

                                </td>

                            </tr>

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

                        <div className="stock-item">

                            <div>

                                <strong>

                                    Camiseta Oversize

                                </strong>

                                <span>

                                    Solo quedan 3 unidades

                                </span>

                            </div>

                            <AlertTriangle color="#d97706"/>

                        </div>

                        <div className="stock-item">

                            <div>

                                <strong>

                                    Jean Cargo

                                </strong>

                                <span>

                                    Solo quedan 5 unidades

                                </span>

                            </div>

                            <AlertTriangle color="#d97706"/>

                        </div>

                        <div className="stock-item">

                            <div>

                                <strong>

                                    Chaqueta Denim

                                </strong>

                                <span>

                                    Solo quedan 2 unidades

                                </span>

                            </div>

                            <AlertTriangle color="#dc2626"/>

                        </div>

                    </div>

                </div>

            </section>

        </div>

    );

}

export default Dashboard;