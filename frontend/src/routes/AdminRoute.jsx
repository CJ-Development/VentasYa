import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function AdminRoute({ children }) {

    const { usuario, loading } = useAuth();

    if (loading) {

        return <div>Cargando...</div>;

    }

    if (!usuario) {

        return <Navigate to="/login" replace />;

    }

    const esAdministrador =
        usuario?.is_superuser === true ||
        usuario?.tipo_usuario === "admin";

    if (!esAdministrador) {

        return <Navigate to="/" replace />;

    }

    return children;

}

export default AdminRoute;