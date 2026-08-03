import "./AdminLayout.css";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

function AdminLayout() {

    return (

        <div className="admin-layout">

            <Sidebar />

            <main className="admin-content">

                <Outlet />

            </main>

        </div>

    );

}

export default AdminLayout;