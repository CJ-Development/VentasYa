import "./CategoryTable.css";

function CategoryTable() {

    return (

        <div className="category-table">

            <h2>

                Categorías registradas

            </h2>

            <table>

                <thead>

                    <tr>

                        <th>ID</th>

                        <th>Imagen</th>

                        <th>Nombre</th>

                        <th>Estado</th>

                        <th>Acciones</th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td>1</td>

                        <td>🖼️</td>

                        <td>Hombre</td>

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

export default CategoryTable;