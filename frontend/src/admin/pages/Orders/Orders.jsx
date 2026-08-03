import "./Orders.css";

import OrderTable from "../../components/OrderTable/OrderTable";

function Orders() {

    return (

        <div className="orders-page">

            <div className="page-header">

                <div>

                    <h1>

                        Pedidos

                    </h1>

                    <p>

                        Consulta y administra los pedidos realizados por los clientes.

                    </p>

                </div>

            </div>

            <OrderTable />

        </div>

    );

}

export default Orders;