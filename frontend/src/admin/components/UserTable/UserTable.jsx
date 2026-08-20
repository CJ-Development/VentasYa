import "./UserTable.css";

import { useEffect, useState } from "react";

import {
    Pencil,
    Trash2,
    X,
    Search,
    UserRound
} from "lucide-react";

import {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
} from "../../../services/adminService";

import { esAdmin } from "../../../utils/esAdmin";


const ROLES = [
    {
        id: 1,
        nombre: "Cliente"
    },
    {
        id: 2,
        nombre: "Administrador"
    },
];


const ESTADOS = [
    "activo",
    "inactivo"
];


function UserTable({ refreshKey, onAction }) {

    const [usuarios, setUsuarios] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [busqueda, setBusqueda] = useState("");

    const [filtroRol, setFiltroRol] = useState("");

    const [filtroEstado, setFiltroEstado] = useState("");

    const [editTarget, setEditTarget] = useState(null);

    const [editForm, setEditForm] = useState(null);

    const [submitting, setSubmitting] = useState(false);


    /* =====================================================
       CARGAR USUARIOS
       ===================================================== */

    const cargarUsuarios = async () => {

        try {

            setLoading(true);

            const { data } = await getUsers();

            setUsuarios(data);

            setError(null);

        }

        catch (err) {

            console.error(err);

            setError(
                "No fue posible cargar los usuarios."
            );

        }

        finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        cargarUsuarios();

    }, [refreshKey]);


    /* =====================================================
       EDITAR
       ===================================================== */

    const abrirEdicion = async (usuario) => {

        try {

            const { data } = await getUser(
                usuario.id_usuario
            );

            setEditTarget(data);

            setEditForm({

                nombres:
                    data.nombres || "",

                apellidos:
                    data.apellidos || "",

                tipo_documento:
                    data.tipo_documento || "CC",

                numero_documento:
                    data.numero_documento || "",

                email:
                    data.email || "",

                fecha_nacimiento:
                    data.fecha_nacimiento || "",

                telefono:
                    data.telefono || "",

                estado:
                    data.estado || "activo",

                rol:
                    data.rol || 1,

            });

        }

        catch (err) {

            console.error(err);

            alert(
                "No fue posible cargar el usuario."
            );

        }

    };


    const cancelarEdicion = () => {

        setEditTarget(null);

        setEditForm(null);

    };


    const handleEditChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setEditForm((prev) => ({

            ...prev,

            [name]: value

        }));

    };


    /* =====================================================
       GUARDAR EDICIÓN
       ===================================================== */

    const guardarEdicion = async (e) => {

        e.preventDefault();

        if (!editTarget) {
            return;
        }

        setSubmitting(true);

        try {

            await updateUser(
                editTarget.id_usuario,
                {

                    ...editForm,

                    rol: Number(
                        editForm.rol
                    ),

                }
            );

            cancelarEdicion();

            if (onAction) {
                onAction();
            }

        }

        catch (err) {

            console.error(err);

            alert(
                "No fue posible actualizar el usuario."
            );

        }

        finally {

            setSubmitting(false);

        }

    };


    /* =====================================================
       ELIMINAR
       ===================================================== */

    const eliminarUsuario = async (id) => {

        const confirmar = window.confirm(
            "¿Eliminar este usuario?"
        );

        if (!confirmar) {
            return;
        }

        try {

            await deleteUser(id);

            if (onAction) {
                onAction();
            }

        }

        catch (err) {

            console.error(err);

            alert(
                "No fue posible eliminar el usuario."
            );

        }

    };


    /* =====================================================
       FILTROS
       ===================================================== */

    const usuariosFiltrados =
        usuarios.filter((usuario) => {

            const texto =
                busqueda
                    .trim()
                    .toLowerCase();

            const nombreCompleto =
                `${usuario.nombres || ""} ${usuario.apellidos || ""}`
                    .toLowerCase();

            const coincideBusqueda =
                !texto ||
                nombreCompleto.includes(texto) ||
                (usuario.email || "")
                    .toLowerCase()
                    .includes(texto) ||
                String(
                    usuario.id_usuario
                ).includes(texto);

            const coincideRol =
                !filtroRol ||
                (filtroRol === "2" && esAdmin(usuario)) ||
                (filtroRol === "1" && !esAdmin(usuario));

            const coincideEstado =
                !filtroEstado ||
                usuario.estado ===
                    filtroEstado;

            return (
                coincideBusqueda &&
                coincideRol &&
                coincideEstado
            );

        });


    /* =====================================================
       LOADING
       ===================================================== */

    if (loading) {

        return (

            <div className="user-table">

                <div className="user-table-message">

                    Cargando usuarios...

                </div>

            </div>

        );

    }


    /* =====================================================
       ERROR
       ===================================================== */

    if (error) {

        return (

            <div className="user-table">

                <div className="user-table-message user-table-message--error">

                    {error}

                </div>

            </div>

        );

    }


    return (

        <div className="user-table">

            {/* =====================================================
                BARRA SUPERIOR
                ===================================================== */}

            <div className="user-table-toolbar">

                <div className="user-search">

                    <Search
                        size={17}
                        className="user-search-icon"
                    />

                    <input
                        type="text"
                        placeholder="Buscar por nombre, correo o ID..."
                        value={busqueda}
                        onChange={(e) =>
                            setBusqueda(
                                e.target.value
                            )
                        }
                    />

                </div>


                <div className="user-filters">

                    <select
                        value={filtroRol}
                        onChange={(e) =>
                            setFiltroRol(
                                e.target.value
                            )
                        }
                    >

                        <option value="">
                            Todos los roles
                        </option>

                        {ROLES.map((rol) => (

                            <option
                                key={rol.id}
                                value={rol.id}
                            >

                                {rol.nombre}

                            </option>

                        ))}

                    </select>


                    <select
                        value={filtroEstado}
                        onChange={(e) =>
                            setFiltroEstado(
                                e.target.value
                            )
                        }
                    >

                        <option value="">
                            Todos los estados
                        </option>

                        {ESTADOS.map(
                            (estado) => (

                                <option
                                    key={estado}
                                    value={estado}
                                >

                                    {
                                        estado
                                            .charAt(0)
                                            .toUpperCase() +
                                        estado.slice(1)
                                    }

                                </option>

                            )
                        )}

                    </select>

                </div>

            </div>


            {/* =====================================================
                TÍTULO
                ===================================================== */}

            <h2 className="user-table-title">

                Usuarios registrados

            </h2>


            {/* =====================================================
                TABLA
                ===================================================== */}

            <div className="user-table-wrapper">

                <table className="users-data-table">

                    <thead>

                        <tr>

                            <th>ID</th>

                            <th>Usuario</th>

                            <th>Email</th>

                            <th>Teléfono</th>

                            <th>Rol</th>

                            <th>Estado</th>

                            <th>Acciones</th>

                        </tr>

                    </thead>


                    <tbody>

                        {usuariosFiltrados.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="7"
                                    className="user-empty-cell"
                                >

                                    No hay usuarios que coincidan
                                    con la búsqueda.

                                </td>

                            </tr>

                        ) : (

                            usuariosFiltrados.map(
                                (usuario) => (

                                    <tr
                                        key={
                                            usuario.id_usuario
                                        }
                                    >

                                        {/* ID */}

                                        <td className="user-id">

                                            #{usuario.id_usuario}

                                        </td>


                                        {/* Usuario */}

                                        <td>

                                            <div className="user-name-cell">

                                                <div className="user-avatar">

                                                    <UserRound
                                                        size={16}
                                                    />

                                                </div>

                                                <div>

                                                    <span className="user-name">

                                                        {
                                                            usuario.nombres
                                                        }{" "}

                                                        {
                                                            usuario.apellidos
                                                        }

                                                    </span>

                                                </div>

                                            </div>

                                        </td>


                                        {/* Email */}

                                        <td className="user-email">

                                            {
                                                usuario.email ||
                                                "—"
                                            }

                                        </td>


                                        {/* Teléfono */}

                                        <td className="user-phone">

                                            {
                                                usuario.telefono ||
                                                "—"
                                            }

                                        </td>


                                        {/* Rol */}

                                        <td>

                                            <span
                                                className={
                                                    esAdmin(usuario)
                                                        ? "user-role user-role--admin"
                                                        : "user-role user-role--client"
                                                }
                                            >

                                                {
                                                    esAdmin(usuario)
                                                        ? "Administrador"
                                                        : "Cliente"
                                                }

                                            </span>

                                        </td>


                                        {/* Estado */}

                                        <td>

                                            <span
                                                className={
                                                    usuario.estado ===
                                                    "activo"

                                                        ? "user-status user-status--active"

                                                        : "user-status user-status--inactive"
                                                }
                                            >

                                                {
                                                    usuario.estado
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                    usuario.estado.slice(1)
                                                }

                                            </span>

                                        </td>


                                        {/* Acciones */}

                                        <td>

                                            <div className="user-actions">

                                                <button
                                                    type="button"
                                                    className="user-action user-action--edit"
                                                    title="Editar usuario"
                                                    onClick={() =>
                                                        abrirEdicion(
                                                            usuario
                                                        )
                                                    }
                                                >

                                                    <Pencil
                                                        size={16}
                                                    />

                                                </button>


                                                <button
                                                    type="button"
                                                    className="user-action user-action--delete"
                                                    title="Eliminar usuario"
                                                    onClick={() =>
                                                        eliminarUsuario(
                                                            usuario.id_usuario
                                                        )
                                                    }
                                                >

                                                    <Trash2
                                                        size={16}
                                                    />

                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                )
                            )

                        )}

                    </tbody>

                </table>

            </div>


            {/* =====================================================
                MODAL DE EDICIÓN
                ===================================================== */}

            {editTarget && editForm && (

                <div
                    className="modal-overlay"
                    onClick={cancelarEdicion}
                >

                    <form
                        className="user-form"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                        onSubmit={guardarEdicion}
                    >

                        <div className="modal-header">

                            <div>

                                <h2>
                                    Editar usuario
                                </h2>

                                <p>
                                    Actualiza la información
                                    del usuario.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="close-button"
                                onClick={
                                    cancelarEdicion
                                }
                                disabled={
                                    submitting
                                }
                            >

                                <X size={20} />

                            </button>

                        </div>


                        <div className="form-grid">

                            <div className="form-group">

                                <label>
                                    Nombres
                                </label>

                                <input
                                    type="text"
                                    name="nombres"
                                    value={
                                        editForm.nombres
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Apellidos
                                </label>

                                <input
                                    type="text"
                                    name="apellidos"
                                    value={
                                        editForm.apellidos
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Tipo documento
                                </label>

                                <select
                                    name="tipo_documento"
                                    value={
                                        editForm.tipo_documento
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                >

                                    <option value="CC">
                                        CC
                                    </option>

                                    <option value="CE">
                                        CE
                                    </option>

                                    <option value="PASAPORTE">
                                        Pasaporte
                                    </option>

                                </select>

                            </div>


                            <div className="form-group">

                                <label>
                                    Número documento
                                </label>

                                <input
                                    type="text"
                                    name="numero_documento"
                                    value={
                                        editForm.numero_documento
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={
                                        editForm.email
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Teléfono
                                </label>

                                <input
                                    type="text"
                                    name="telefono"
                                    value={
                                        editForm.telefono
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Fecha de nacimiento
                                </label>

                                <input
                                    type="date"
                                    name="fecha_nacimiento"
                                    value={
                                        editForm.fecha_nacimiento
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Rol
                                </label>

                                <select
                                    name="rol"
                                    value={
                                        editForm.rol
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                >

                                    {ROLES.map(
                                        (rol) => (

                                            <option
                                                key={rol.id}
                                                value={rol.id}
                                            >

                                                {rol.nombre}

                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            <div className="form-group">

                                <label>
                                    Estado
                                </label>

                                <select
                                    name="estado"
                                    value={
                                        editForm.estado
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                >

                                    {ESTADOS.map(
                                        (estado) => (

                                            <option
                                                key={estado}
                                                value={estado}
                                            >

                                                {
                                                    estado
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                    estado.slice(1)
                                                }

                                            </option>

                                        )
                                    )}

                                </select>

                            </div>

                        </div>


                        <div className="form-buttons">

                            <button
                                type="button"
                                className="cancel-button"
                                onClick={
                                    cancelarEdicion
                                }
                                disabled={
                                    submitting
                                }
                            >

                                Cancelar

                            </button>


                            <button
                                type="submit"
                                className="save-button"
                                disabled={
                                    submitting
                                }
                            >

                                {
                                    submitting
                                        ? "Guardando..."
                                        : "Guardar cambios"
                                }

                            </button>

                        </div>

                    </form>

                </div>

            )}

        </div>

    );

}

export default UserTable;