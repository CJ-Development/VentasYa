import "./BrandTable.css";

function BrandTable() {

    return (

        <div className="brand-table">

            <h2>Marcas registradas</h2>

            <table>

                <thead>

                    <tr>

                        <th>ID</th>

                        <th>Logo</th>

                        <th>Nombre</th>

                        <th>Estado</th>

                        <th>Acciones</th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td>1</td>

                        <td>🏷️</td>

                        <td>Nike</td>

                        <td>

                            <span className="active">

                                Activo

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

export default BrandTable;