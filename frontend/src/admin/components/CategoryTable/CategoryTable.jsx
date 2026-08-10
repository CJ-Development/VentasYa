import { useEffect, useState } from "react";

import {
    getCategories,
    updateCategory,
    deleteCategory
} from "../../../services/adminService";

import "./CategoryTable.css";

function CategoryTable({ refreshKey }) {

    const [categorias, setCategorias] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [editTarget, setEditTarget] = useState(null);

    const [editForm, setEditForm] = useState({
        nombre: "",
        descripcion: "",
        estado: "activo"
    });

    const cargarCategorias = async () => {

        try {

            const { data } = await getCategories();

            setCategorias(data);

            setError(null);

        }

        catch(err){

            console.error(err);

            setError("No fue posible cargar las categorías.");

        }

        finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        cargarCategorias();

    }, [refreshKey]);

    const abrirEdicion = (categoria) => {

        setEditTarget(categoria);

        setEditForm({

            nombre: categoria.nombre,
            descripcion: categoria.descripcion || "",
            estado: categoria.estado

        });

    };

    const cancelarEdicion = () => {

        setEditTarget(null);

    };

    const handleEditChange = (e) => {

        const { name, value } = e.target;

        setEditForm({ ...editForm, [name]: value });

    };

    const guardarEdicion = async (e) => {

        e.preventDefault();

        try {

            await updateCategory(editTarget.id_categoria, editForm);

            setEditTarget(null);

            await cargarCategorias();

        }

        catch(err){

            console.error(err);

            alert("No fue posible actualizar la categoría.");

        }

    };

    const eliminarCategoria = async (id) => {

        const confirmar = window.confirm("¿Eliminar esta categoría?");

        if (!confirmar) return;

        try {

            await deleteCategory(id);

            await cargarCategorias();

        }

        catch(err){

            console.error(err);

            alert("No fue posible eliminar la categoría.");

        }

    };

    if (loading) {

        return <div className="category-table">Cargando categorías...</div>;

    }

    if (error) {

        return <div className="category-table">{error}</div>;

    }

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

                                    <button
                                        onClick={() => abrirEdicion(categoria)}
                                    >

                                        Editar

                                    </button>
                                    <button
                                        className="delete"
                                        onClick={() => eliminarCategoria(categoria.id_categoria)}
                                    >

                                        Quitar

                                    </button>

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

            {

                editTarget && (

                    <div className="modal-overlay">

                        <form
                            className="category-form"
                            onSubmit={guardarEdicion}
                        >

                            <h2>

                                Editar categoría

                            </h2>

                            <div className="form-group">

                                <label>Nombre</label>

                                <input
                                    type="text"
                                    name="nombre"
                                    value={editForm.nombre}
                                    onChange={handleEditChange}
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>Estado</label>

                                <select
                                    name="estado"
                                    value={editForm.estado}
                                    onChange={handleEditChange}
                                >

                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>

                                </select>

                            </div>

                            <div className="form-group">

                                <label>Descripción</label>

                                <textarea
                                    rows="5"
                                    name="descripcion"
                                    value={editForm.descripcion}
                                    onChange={handleEditChange}
                                />

                            </div>

                            <div className="form-buttons">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={cancelarEdicion}
                                >

                                    Cancelar

                                </button>

                                <button type="submit" className="save-button">

                                    Guardar cambios

                                </button>

                            </div>

                        </form>

                    </div>

                )

            }

        </div>

    );

}

export default CategoryTable;