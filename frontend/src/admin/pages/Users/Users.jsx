import "./Users.css";

import UserTable from "../../components/UserTable/UserTable";

function Users() {

    return (

        <div className="users-page">

            <div className="page-header">

                <div>

                    <h1>

                        Usuarios

                    </h1>

                    <p>

                        Administra todos los usuarios registrados en la plataforma.

                    </p>

                </div>

            </div>

            <UserTable />

        </div>

    );

}

export default Users;