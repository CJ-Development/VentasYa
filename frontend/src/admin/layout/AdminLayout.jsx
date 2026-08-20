import "./AdminLayout.css";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

import { ToastProvider } from "../components/Toast/ToastHost";

function AdminLayout() {

    return (

        <ToastProvider>

            <div className="admin-layout">

                <Sidebar />

                <main className="admin-content">

                    <Outlet />

                </main>

            </div>

        </ToastProvider>

    );

}

export default AdminLayout;