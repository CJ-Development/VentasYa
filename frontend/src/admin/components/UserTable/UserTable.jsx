import "./UserTable.css";
import { useEffect, useState } from "react";
import { getUsers } from "../../../api/axios";

function UserTable() {

    const [usuarios, setUsuarios] = useState([]);

    const [busqueda, setBusqueda] = useState("");

    useEffect(() => {

        cargarUsuarios();

    }, []);

    const cargarUsuarios = async () => {

        try {

            const response = await getUsers();

            setUsuarios(response.data);

        } catch (error) {

            console.error(error);

        }

    };

    const usuariosFiltrados = usuarios.filter((usuario) =>

        `${usuario.nombres} ${usuario.apellidos}`
            .toLowerCase()
            .includes(busqueda.toLowerCase())

    );

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

                        usuariosFiltrados.map((usuario) => (

                            <tr key={usuario.id_usuario}>

                                <td>{usuario.id_usuario}</td>

                                <td>

                                    {usuario.nombres} {usuario.apellidos}

                                </td>

                                <td>{usuario.email}</td>

                                <td>{usuario.telefono}</td>

                                <td>

                                    {usuario.rol === 2

                                        ? "Administrador"

                                        : "Cliente"}

                                </td>

                                <td>{usuario.estado}</td>

                                <td className="actions">

                                    <button>

                                        Editar

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

export default UserTable;