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

    if (usuario.rol !== 2) {

        return <Navigate to="/" replace />;

    }

    return children;

}

export default AdminRoute;