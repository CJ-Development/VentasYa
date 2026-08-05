import { useEffect, useState } from "react";

import { getCategories } from "../../../services/adminService";

import "./CategoryTable.css";

function CategoryTable() {

    const [categorias, setCategorias] = useState([]);

    const cargarCategorias = async () => {

        try {

            const { data } = await getCategories();

            setCategorias(data);

        }

        catch(error){

            console.error(error);

        }

    };

    useEffect(() => {

        cargarCategorias();

    }, []);

    return (

        <div className="category-table">

            <h2>

                Categorías registradas

            </h2>

            <table>

                <thead>

                    <tr>

                        <th>ID</th>

                        <th>Nombre</th>

                        <th>Descripción</th>

                        <th>Estado</th>

                        <th>Acciones</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        categorias.length === 0 ?

                        (

                            <tr>

                                <td
                                    colSpan="5"
                                    style={{textAlign:"center"}}
                                >

                                    No existen categorías.

                                </td>

                            </tr>

                        )

                        :

                        categorias.map((categoria)=>(

                            <tr
                                key={categoria.id_categoria}
                            >

                                <td>

                                    {categoria.id_categoria}

                                </td>

                                <td>

                                    {categoria.nombre}

                                </td>

                                <td>

                                    {categoria.descripcion}

                                </td>

                                <td>

                                    <span
                                        className={
                                            categoria.estado === "activo"

                                            ? "active"

                                            : "inactive"
                                        }
                                    >

                                        {categoria.estado}

                                    </span>

                                </td>

                                <td>

                                    <button>

                                        Editar

                                    </button>

                                    <button
                                        className="delete"
                                    >

                                        Quitar

                                    </button>

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

        </div>

    );

}

export default CategoryTable;