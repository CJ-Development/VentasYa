import { useEffect, useState } from "react";

import "./ProductTable.css";

import {
    Search,
    Eye,
    Pencil,
    Trash2
} from "lucide-react";

import { getProducts } from "../../../services/adminService";

function ProductTable() {

    const [productos, setProductos] = useState([]);

    const cargarProductos = async () => {

        try {

            const { data } = await getProducts();

            setProductos(data);

        }

        catch(error){

            console.error(error);

        }

    };

    useEffect(() => {

        cargarProductos();

    }, []);

    return (

        <div className="product-table">

            <div className="table-toolbar">

                <div className="table-search">

                    <Search size={18}/>

                    <input
                        type="text"
                        placeholder="Buscar producto..."
                    />

                </div>

                <div className="table-filters">

                    <select>

                        <option>

                            Todas las categorías

                        </option>

                    </select>

                    <select>

                        <option>

                            Todos los estados

                        </option>

                    </select>

                </div>

            </div>

            <table>

                <thead>

                    <tr>

                        <th>

                            Producto

                        </th>

                        <th>

                            Categoría

                        </th>

                        <th>

                            Precio

                        </th>

                        <th>

                            Estado

                        </th>

                        <th>

                            Acciones

                        </th>

                    </tr>

                </thead>

                <tbody>

                    {

                        productos.length === 0 ?

                        (

                            <tr>

                                <td
                                    colSpan="5"
                                    style={{
                                        textAlign:"center",
                                        padding:"40px"
                                    }}
                                >

                                    No existen productos registrados.

                                </td>

                            </tr>

                        )

                        :

                        productos.map((producto)=>(

                            <tr
                                key={producto.id_producto}
                            >

                                <td>

                                    <div className="product-info">

                                        <div className="product-image">

                                            📦

                                        </div>

                                        <div>

                                            <strong>

                                                {producto.nombre}

                                            </strong>

                                            <span>

                                                {producto.slug}

                                            </span>

                                        </div>

                                    </div>

                                </td>

                                <td>
                                    {producto.categoria?.nombre}
                                </td>

                                <td>

                                    $

                                    {Number(producto.precio).toLocaleString()}

                                </td>

                                <td>

                                    <span

                                        className={
                                            producto.estado === "activo"

                                            ? "status active"

                                            : "status inactive"
                                        }

                                    >

                                        {producto.estado}

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

                        ))

                    }

                </tbody>

            </table>

        </div>

    );

}

export default ProductTable;