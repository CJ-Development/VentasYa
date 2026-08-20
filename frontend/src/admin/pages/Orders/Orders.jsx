import { useState } from "react";

import "./Orders.css";

import OrderTable from "../../components/OrderTable/OrderTable";

function Orders() {

    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => {

        setRefreshKey((prev) => prev + 1);

    };

    return (

        <div className="orders-page">

            <div className="orders-page-header">

                <div>

                    <h1>Pedidos</h1>

                    <p>
                        Consulta y administra los pedidos realizados por los clientes.
                    </p>

                </div>

            </div>

            <OrderTable
                refreshKey={refreshKey}
                onAction={handleRefresh}
            />

        </div>

    );

}

export default Orders;