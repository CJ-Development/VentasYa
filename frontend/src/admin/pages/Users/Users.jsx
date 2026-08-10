import "./Users.css";

import { useState } from "react";

import UserTable from "../../components/UserTable/UserTable";

function Users() {

    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => {

        setRefreshKey((prev) => prev + 1);

    };

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

            <UserTable
                refreshKey={refreshKey}
                onAction={handleRefresh}
            />

        </div>

    );

}

export default Users;
