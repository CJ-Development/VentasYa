import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search } from "lucide-react";

function SearchBar() {

    const navigate = useNavigate();
    const location = useLocation();

    // Tomamos el query actual si ya estamos en /products para mantener sincronizado
    const initialQuery =
        location.pathname === "/products"
            ? new URLSearchParams(location.search).get("q") || ""
            : "";

    const [query, setQuery] = useState(initialQuery);

    const handleSubmit = (e) => {
        e.preventDefault();
        const termino = query.trim();
        if (!termino) {
            // Si está vacío y ya estamos en /products, limpiamos filtros
            if (location.pathname === "/products") {
                navigate("/products");
            }
            return;
        }
        navigate(`/products?q=${encodeURIComponent(termino)}`);
    };

    return (
        <form className="search" onSubmit={handleSubmit} role="search">
            <input
                type="text"
                placeholder="Buscar productos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Buscar productos"
            />
            <button
                type="submit"
                className="search-button"
                aria-label="Buscar"
            >
                <Search className="search-icon" />
            </button>
        </form>
    );
}

export default SearchBar;
