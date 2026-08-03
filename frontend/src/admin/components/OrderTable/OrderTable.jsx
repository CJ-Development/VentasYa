import "./OrderTable.css";

function OrderTable() {

    return (

        <div className="order-table">

            <h2>

                Pedidos registrados

            </h2>

            <table>

                <thead>

                    <tr>

                        <th># Pedido</th>

                        <th>Cliente</th>

                        <th>Fecha</th>

                        <th>Total</th>

                        <th>Pago</th>

                        <th>Estado</th>

                        <th>Acciones</th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td>#1001</td>

                        <td>John Cortes</td>

                        <td>02/08/2026</td>

                        <td>$240.000</td>

                        <td>Wompi</td>

                        <td>

                            <span className="pending">

                                Pendiente

                            </span>

                        </td>

                        <td>

                            <button>

                                Ver

                            </button>

                            <button>

                                Editar

                            </button>

                        </td>

                    </tr>

                    <tr>

                        <td>#1002</td>

                        <td>María López</td>

                        <td>02/08/2026</td>

                        <td>$120.000</td>

                        <td>PSE</td>

                        <td>

                            <span className="completed">

                                Entregado

                            </span>

                        </td>

                        <td>

                            <button>

                                Ver

                            </button>

                            <button>

                                Editar

                            </button>

                        </td>

                    </tr>

                </tbody>

            </table>

        </div>

    );

}

export default OrderTable;