import "./OfferTable.css";

import { useEffect, useState } from "react";

import { Pencil, Trash2 } from "lucide-react";

import {
    getOffers,
    deleteOffer
} from "../../../services/adminService";

const formatearFecha = (iso) => {
    if (!iso) return "—";
    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return iso;
    return fecha.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};

const formatearDescuento = (oferta) => {

    const numero = Number(oferta.valor);

    if (Number.isNaN(numero)) return "—";

    if (oferta.tipo_descuento === "porcentaje") {
        return `${numero}%`;
    }

    return `$${numero.toLocaleString("es-CO")}`;

};

function OfferTable({ refreshKey, onEdit }) {

    const [ofertas, setOfertas] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [busqueda, setBusqueda] = useState("");

    const [filtroActiva, setFiltroActiva] = useState("");

    const cargarOfertas = async () => {

        try {

            const { data } = await getOffers();

            setOfertas(data);

            setError(null);

        }

        catch (err) {

            console.error(err);

            setError("No fue posible cargar las ofertas.");

        }

        finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        cargarOfertas();

    }, [refreshKey]);

    const eliminarOferta = async (id) => {

        const confirmar = window.confirm("¿Eliminar esta oferta?");

        if (!confirmar) return;

        try {

            await deleteOffer(id);

            await cargarOfertas();

        }

        catch (err) {

            console.error(err);

            alert("No fue posible eliminar la oferta.");

        }

    };

    const ofertasFiltradas = ofertas.filter((oferta) => {

        const texto = busqueda.toLowerCase();

        const producto = typeof oferta.producto === "string"
            ? oferta.producto
            : oferta.producto?.nombre || "";

        const coincideBusqueda = !busqueda
            || oferta.nombre.toLowerCase().includes(texto)
            || producto.toLowerCase().includes(texto);

        const coincideActiva = !filtroActiva
            || (filtroActiva === "activas" ? oferta.activa : !oferta.activa);

        return coincideBusqueda && coincideActiva;

    });

    if (loading) {

        return <div className="offer-table">Cargando ofertas...</div>;

    }

    if (error) {

        return <div className="offer-table">{error}</div>;

    }

    return (

        <div className="offer-table">

            <div className="table-toolbar">

                <input
                    type="text"
                    placeholder="Buscar oferta..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />

                <select
                    value={filtroActiva}
                    onChange={(e) => setFiltroActiva(e.target.value)}
                >
                    <option value="">Todas</option>
                    <option value="activas">Activas</option>
                    <option value="inactivas">Inactivas</option>
                </select>

            </div>

            <h2>Ofertas registradas</h2>

            <table>

                <thead>

                    <tr>

                        <th>Oferta</th>

                        <th>Producto</th>

                        <th>Descuento</th>

                        <th>Inicio</th>

                        <th>Fin</th>

                        <th>Estado</th>

                        <th>Acciones</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        ofertasFiltradas.length === 0 ?

                        (

                            <tr>

                                <td
                                    colSpan="7"
                                    style={{ textAlign: "center", padding: "40px" }}
                                >

                                    No hay ofertas que coincidan con los filtros.

                                </td>

                            </tr>

                        )

                        :

                        ofertasFiltradas.map((oferta) => {

                            const productoNombre = typeof oferta.producto === "string"
                                ? oferta.producto
                                : oferta.producto?.nombre || `Producto #${oferta.producto_id || oferta.producto}`;

                            return (

                                <tr key={oferta.id_oferta}>

                                    <td>

                                        <strong>{oferta.nombre}</strong>

                                        <span className="offer-desc">

                                            {oferta.descripcion || "Sin descripción"}

                                        </span>

                                    </td>

                                    <td>{productoNombre}</td>

                                    <td>{formatearDescuento(oferta)}</td>

                                    <td>{formatearFecha(oferta.fecha_inicio)}</td>

                                    <td>{formatearFecha(oferta.fecha_fin)}</td>

                                    <td>

                                        <span
                                            className={
                                                oferta.activa
                                                    ? "active"
                                                    : "inactive"
                                            }
                                        >

                                            {oferta.activa ? "Activa" : "Inactiva"}

                                        </span>

                                    </td>

                                    <td>

                                        <div className="actions">

                                            <button
                                                className="edit"
                                                title="Editar"
                                                onClick={() => onEdit(oferta)}
                                            >

                                                <Pencil size={18} />

                                            </button>

                                            <button
                                                className="delete"
                                                title="Eliminar"
                                                onClick={() => eliminarOferta(oferta.id_oferta)}
                                            >

                                                <Trash2 size={18} />

                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            );

                        })

                    }

                </tbody>

            </table>

        </div>

    );

}

export default OfferTable;
