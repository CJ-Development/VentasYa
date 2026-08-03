import "./ProductTable.css";

import {
    Search,
    Eye,
    Pencil,
    Trash2
} from "lucide-react";

function ProductTable() {

    return (

        <div className="product-table">

            <div className="table-toolbar">

                <div className="table-search">

                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Buscar producto..."
                    />

                </div>

                <div className="table-filters">

                    <select>

                        <option>Todas las categorías</option>

                    </select>

                    <select>

                        <option>Todos los estados</option>

                    </select>

                </div>

            </div>

            <table>

                <thead>

                    <tr>

                        <th>Producto</th>

                        <th>Categoría</th>

                        <th>Precio</th>

                        <th>Stock</th>

                        <th>Estado</th>

                        <th>Acciones</th>

                    </tr>

                </thead>

                <tbody>

                    <tr>

                        <td>

                            <div className="product-info">

                                <div className="product-image">

                                    🖼

                                </div>

                                <div>

                                    <strong>

                                        Camiseta Oversize

                                    </strong>

                                    <span>

                                        REF-001

                                    </span>

                                </div>

                            </div>

                        </td>

                        <td>

                            Hombre

                        </td>

                        <td>

                            $120.000

                        </td>

                        <td>

                            <span className="stock">

                                18 unidades

                            </span>

                        </td>

                        <td>

                            <span className="status active">

                                Activo

                            </span>

                        </td>

                        <td>

                            <div className="actions">

                                <button className="view">

                                    <Eye size={18}/>

                                </button>

                                <button className="edit">

                                    <Pencil size={18}/>

                                </button>

                                <button className="delete">

                                    <Trash2 size={18}/>

                                </button>

                            </div>

                        </td>

                    </tr>

                </tbody>

            </table>

        </div>

    );

}

export default ProductTable;