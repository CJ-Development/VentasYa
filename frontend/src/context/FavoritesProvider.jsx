/* =====================================================
   FavoritesProvider
   ----------------------------------------------------
   Estado global de favoritos del usuario logueado.
   - Carga la lista al iniciar / cambiar de usuario.
   - isFavorite(id) → consulta O(1) en Set.
   - toggle(id) → agrega o quita según estado.
===================================================== */

import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { useAuth } from "../hooks/useAuth";
import {
    getMyFavorites,
    addFavorite,
    removeFavorite,
} from "../services/clientService";

export const FavoritesContext = createContext();

function FavoritesProvider({ children }) {

    const { usuario } = useAuth();

    const [favoritos, setFavoritos] = useState([]);
    const [loading, setLoading] = useState(false);

    const lastUserIdRef = useRef(null);

    const cargar = useCallback(async (uid) => {
        if (!uid) {
            setFavoritos([]);
            return;
        }
        try {
            setLoading(true);
            const { data } = await getMyFavorites(uid);
            setFavoritos(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("FavoritesProvider.cargar:", err);
            setFavoritos([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const uid = usuario?.id_usuario || null;
        if (lastUserIdRef.current !== uid) {
            lastUserIdRef.current = uid;
            cargar(uid);
        }
    }, [usuario?.id_usuario, cargar]);

    // Set de ids de productos favoritos para consultas rápidas
    const idsFavoritos = useMemo(() => {
        const set = new Set();
        favoritos.forEach((f) => {
            const id =
                f.producto?.id_producto ||
                f.producto_detalle?.id_producto ||
                f.id_producto ||
                (typeof f.producto === "number" ? f.producto : null);
            if (id) set.add(Number(id));
        });
        return set;
    }, [favoritos]);

    const favoritoDe = useCallback(
        (productoId) => favoritos.find((f) => {
            const id =
                f.producto?.id_producto ||
                f.producto_detalle?.id_producto ||
                f.id_producto ||
                (typeof f.producto === "number" ? f.producto : null);
            return Number(id) === Number(productoId);
        }),
        [favoritos]
    );

    const isFavorite = useCallback(
        (productoId) => idsFavoritos.has(Number(productoId)),
        [idsFavoritos]
    );

    const toggle = useCallback(async (productoId) => {
        if (!usuario?.id_usuario) {
            return { ok: false, reason: "no-auth" };
        }
        const existente = favoritoDe(productoId);
        try {
            if (existente) {
                // Optimista
                setFavoritos((prev) =>
                    prev.filter((f) => f.id_favorito !== existente.id_favorito)
                );
                await removeFavorite(existente.id_favorito);
                return { ok: true, action: "removed" };
            } else {
                await addFavorite(usuario.id_usuario, productoId);
                await cargar(usuario.id_usuario);
                return { ok: true, action: "added" };
            }
        } catch (err) {
            console.error("FavoritesProvider.toggle:", err);
            // Revertir cargando de nuevo
            await cargar(usuario.id_usuario);
            return { ok: false, error: err };
        }
    }, [usuario?.id_usuario, favoritoDe, cargar]);

    const value = useMemo(
        () => ({
            favoritos,
            loading,
            isFavorite,
            favoritoDe,
            toggle,
            recargar: () => cargar(usuario?.id_usuario),
        }),
        [favoritos, loading, isFavorite, favoritoDe, toggle, cargar, usuario?.id_usuario]
    );

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
}

export default FavoritesProvider;
