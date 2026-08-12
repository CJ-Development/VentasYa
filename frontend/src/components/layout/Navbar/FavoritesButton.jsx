import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

import { useAuth } from "../../../hooks/useAuth";

function FavoritesButton() {
    const { usuario } = useAuth();

    const destino = usuario
        ? "/favorites"
        : "/login";

    const title = usuario
        ? "Tus favoritos"
        : "Inicia sesión para guardar favoritos";

    return (
        <Link
            to={destino}
            className="icon-button favorites-button"
            title={title}
            aria-label={title}
        >
            <Heart />
        </Link>
    );
}

export default FavoritesButton;