import "./UserTable.css";

import { useEffect, useState } from "react";

import {
    Pencil,
    Trash2,
    X,
} from "lucide-react";

import {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
} from "../../../services/adminService";



const ESTADOS = ["activo", "inactivo"];

function UserTable({ refreshKey, onAction }) {

    const [usuarios, setUsuarios] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [busqueda, setBusqueda] = useState("");

    const [editTarget, setEditTarget] = useState(null);

    const [editForm, setEditForm] = useState(null);

    const [submitting, setSubmitting] = useState(false);

    const cargarUsuarios = async () => {

        try {

            const { data } = await getUsers();

            setUsuarios(data);

            setError(null);

        }

        catch (err) {

            console.error(err);

            setError("No fue posible cargar los usuarios.");

        }

        finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        cargarUsuarios();

    }, [refreshKey]);

    const abrirEdicion = async (usuario) => {

        try {

            const { data } = await getUser(usuario.id);

            setEditTarget(data);

            setEditForm({

                nombres: data.nombres || "",
                apellidos: data.apellidos || "",
                tipo_documento: data.tipo_documento || "CC",
                numero_documento: data.numero_documento || "",
                email: data.email || "",
                fecha_nacimiento: data.fecha_nacimiento || "",
                telefono: data.telefono || "",
                estado: data.estado || "activo",
                es_administrador: data.es_administrador || false,

            });

        }

        catch (err) {

            console.error(err);

            alert("No fue posible cargar el usuario.");

        }

    };

    const cancelarEdicion = () => {

        setEditTarget(null);

        setEditForm(null);

    };

    const handleEditChange = (e) => {

        const { name, value } = e.target;

        setEditForm((prev) => ({ ...prev, [name]: value }));

    };

    const guardarEdicion = async (e) => {

        e.preventDefault();

        if (!editTarget) return;

        setSubmitting(true);

        try {

            await updateUser(editTarget.id, {

                ...editForm,
                es_administrador: Boolean(editForm.es_administrador),

            });

            cancelarEdicion();

            if (onAction) onAction();

        }

        catch (err) {

            console.error(err);

            alert("No fue posible actualizar el usuario.");

        }

        finally {

            setSubmitting(false);

        }

    };

    const eliminarUsuario = async (id) => {

        const confirmar = window.confirm("¿Eliminar este usuario?");

        if (!confirmar) return;

        try {

            await deleteUser(id);

            if (onAction) onAction();

        }

        catch (err) {

            console.error(err);

            alert("No fue posible eliminar el usuario.");

        }

    };

    const usuariosFiltrados = usuarios.filter((usuario) => {

        const texto = busqueda.toLowerCase();

        return (
            !busqueda
            || `${usuario.nombres} ${usuario.apellidos}`.toLowerCase().includes(texto)
            || (usuario.email || "").toLowerCase().includes(texto)
        );

    });

    if (loading) {

        return <div className="user-table">Cargando usuarios...</div>;

    }

    if (error) {

        return <div className="user-table">{error}</div>;

    }

    return (

        <div className="user-table">

            <div className="table-header">

                <input
                    type="text"
                    placeholder="Buscar usuario..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />

            </div>

            <table>

                <thead>

                    <tr>

                        <th>ID</th>

                        <th>Nombre</th>

                        <th>Email</th>

                        <th>Teléfono</th>

                        <th>Rol</th>

                        <th>Estado</th>

                        <th>Acciones</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        usuariosFiltrados.length === 0 ?

                        (

                            <tr>

                                <td
                                    colSpan="7"
                                    style={{ textAlign: "center", padding: "40px" }}
                                >

                                    No hay usuarios que coincidan con la búsqueda.

                                </td>

                            </tr>

                        )

                        :

                        usuariosFiltrados.map((usuario) => (

                            <tr key={usuario.id}>

                                <td>{usuario.id}</td>

                                <td>

                                    {usuario.nombres} {usuario.apellidos}

                                </td>

                                <td>{usuario.email}</td>

                                <td>{usuario.telefono || "—"}</td>

                                <td>

                                    {usuario.es_administrador

                                        ? "Administrador"

                                        : "Cliente"}

                                </td>

                                <td>{usuario.estado}</td>

                                <td className="actions">

                                    <button
                                        className="edit"
                                        title="Editar"
                                        onClick={() => abrirEdicion(usuario)}
                                    >
                                        <Pencil size={18} />
                                    </button>

                                    <button
                                        className="delete"
                                        title="Eliminar"
                                        onClick={() => eliminarUsuario(usuario.id)}
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

            {

                editTarget && editForm && (

                    <div className="modal-overlay" onClick={cancelarEdicion}>

                        <form
                            className="user-form"
                            onClick={(e) => e.stopPropagation()}
                            onSubmit={guardarEdicion}
                        >

                            <div className="modal-header">

                                <h2>Editar usuario</h2>

                                <button
                                    type="button"
                                    className="close-button"
                                    onClick={cancelarEdicion}
                                    disabled={submitting}
                                >
                                    <X size={20} />
                                </button>

                            </div>

                            <div className="form-grid">

                                <div className="form-group">

                                    <label>Nombres</label>

                                    <input
                                        type="text"
                                        name="nombres"
                                        value={editForm.nombres}
                                        onChange={handleEditChange}
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>Apellidos</label>

                                    <input
                                        type="text"
                                        name="apellidos"
                                        value={editForm.apellidos}
                                        onChange={handleEditChange}
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>Tipo documento</label>

                                    <select
                                        name="tipo_documento"
                                        value={editForm.tipo_documento}
                                        onChange={handleEditChange}
                                    >

                                        <option value="CC">CC</option>
                                        <option value="CE">CE</option>
                                        <option value="PASAPORTE">Pasaporte</option>

                                    </select>

                                </div>

                                <div className="form-group">

                                    <label>Número documento</label>

                                    <input
                                        type="text"
                                        name="numero_documento"
                                        value={editForm.numero_documento}
                                        onChange={handleEditChange}
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>Email</label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={editForm.email}
                                        onChange={handleEditChange}
                                        required
                                    />

                                </div>

                                <div className="form-group">

                                    <label>Teléfono</label>

                                    <input
                                        type="text"
                                        name="telefono"
                                        value={editForm.telefono}
                                        onChange={handleEditChange}
                                    />

                                </div>

                                <div className="form-group">

                                    <label>Fecha de nacimiento</label>

                                    <input
                                        type="date"
                                        name="fecha_nacimiento"
                                        value={editForm.fecha_nacimiento}
                                        onChange={handleEditChange}
                                    />

                                </div>

                                <div className="form-group">

                                    <label>Administrador</label>

                                    <select
                                        name="es_administrador"
                                        value={editForm.es_administrador}
                                        onChange={handleEditChange}
                                    >

                                        <option value="false">No</option>
                                        <option value="true">Sí</option>

                                    </select>

                                </div>

                                <div className="form-group">

                                    <label>Estado</label>

                                    <select
                                        name="estado"
                                        value={editForm.estado}
                                        onChange={handleEditChange}
                                    >

                                        {ESTADOS.map((estado) => (
                                            <option key={estado} value={estado}>
                                                {estado.charAt(0).toUpperCase() + estado.slice(1)}
                                            </option>
                                        ))}

                                    </select>

                                </div>

                            </div>

                            <div className="form-buttons">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={cancelarEdicion}
                                    disabled={submitting}
                                >

                                    Cancelar

                                </button>

                                <button
                                    type="submit"
                                    className="save-button"
                                    disabled={submitting}
                                >

                                    {submitting ? "Guardando..." : "Guardar cambios"}

                                </button>

                            </div>

                        </form>

                    </div>

                )

            }

        </div>

    );

}

export default UserTable;