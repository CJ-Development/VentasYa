import "./OfferTable.css";

function OfferTable() {

    return (

        <div className="offer-table">

            <h2>Ofertas registradas</h2>

            <table>

                <thead>

                    <tr>

                        <th>Oferta</th>

                        <th>Producto</th>

                        <th>Descuento</th>

                        <th>Inicio</th>

                        <th>Fin</th>

                        <th>Estado</th>

                        <th>Acciones</th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td>Black Friday</td>

                        <td>Camisa Oversize</td>

                        <td>20%</td>

                        <td>01/11/2026</td>

                        <td>30/11/2026</td>

                        <td>

                            <span className="active">

                                Activa

                            </span>

                        </td>

                        <td>

                            <button>

                                Editar

                            </button>

                            <button className="delete">

                                Eliminar

                            </button>

                        </td>

                    </tr>

                </tbody>

            </table>

        </div>

    );

}

export default OfferTable;