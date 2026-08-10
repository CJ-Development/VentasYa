import { useEffect, useState } from "react";

import {
    Eye,
    Pencil,
    Phone,
    Trash2,
    X
} from "lucide-react";

import "./OrderTable.css";

import {
    getOrders,
    updateOrderStatus,
    deleteOrder
} from "../../../services/adminService";

const ESTADOS = ["pendiente", "pagado", "enviado", "entregado", "cancelado"];

const formatearPesos = (valor) => {
    const numero = Number(valor);
    if (Number.isNaN(numero)) return "$0";
    return `$${numero.toLocaleString("es-CO")}`;
};

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

const claseEstado = {
    pendiente: "pending",
    pagado: "success",
    enviado: "shipping",
    entregado: "completed",
    cancelado: "cancelled",
};

function OrderTable({ refreshKey, onAction }) {

    const [pedidos, setPedidos] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [filtroEstado, setFiltroEstado] = useState("");

    const [busqueda, setBusqueda] = useState("");

    const [detalle, setDetalle] = useState(null);

    const [editEstado, setEditEstado] = useState(null);

    const [nuevoEstado, setNuevoEstado] = useState("pendiente");

    const [nuevoTelefono, setNuevoTelefono] = useState("");

    const cargarPedidos = async () => {

        try {

            const { data } = await getOrders();

            setPedidos(data);

            setError(null);

        }

        catch (err) {

            console.error(err);

            setError("No fue posible cargar los pedidos.");

        }

        finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        cargarPedidos();

    }, [refreshKey]);

    const eliminarPedido = async (id) => {

        const confirmar = window.confirm("¿Eliminar este pedido?");

        if (!confirmar) return;

        try {

            await deleteOrder(id);

            if (onAction) onAction();

        }

        catch (err) {

            console.error(err);

            alert("No fue posible eliminar el pedido.");

        }

    };

    const abrirEdicion = (pedido) => {

        setEditEstado(pedido);

        setNuevoEstado(pedido.estado_compra);

        setNuevoTelefono(pedido.telefono_contacto || "");

    };

    const guardarEstado = async (e) => {

        e.preventDefault();

        try {

            await updateOrderStatus(editEstado.id_compra, {
                estado_compra: nuevoEstado,
                telefono_contacto: nuevoTelefono.trim() || null,
            });

            setEditEstado(null);

            if (onAction) onAction();

        }

        catch (err) {

            console.error(err);

            alert("No fue posible actualizar el estado.");

        }

    };

    const pedidosFiltrados = pedidos.filter((pedido) => {

        const cliente = pedido.usuario_info
            ? `${pedido.usuario_info.nombres} ${pedido.usuario_info.apellidos}`.toLowerCase()
            : "";

        const coincideBusqueda = !busqueda
            || String(pedido.id_compra).includes(busqueda)
            || cliente.includes(busqueda.toLowerCase());

        const coincideEstado = !filtroEstado || pedido.estado_compra === filtroEstado;

        return coincideBusqueda && coincideEstado;

    });

    if (loading) {

        return <div className="order-table">Cargando pedidos...</div>;

    }

    if (error) {

        return <div className="order-table">{error}</div>;

    }

    return (

        <div className="order-table">

            <div className="table-toolbar">

                <input
                    type="text"
                    placeholder="Buscar por # o cliente..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="table-search-input"
                />

                <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                >
                    <option value="">Todos los estados</option>
                    {ESTADOS.map((estado) => (
                        <option key={estado} value={estado}>
                            {estado.charAt(0).toUpperCase() + estado.slice(1)}
                        </option>
                    ))}
                </select>

            </div>

            <h2>Pedidos registrados</h2>

            <table>

                <thead>
                    <tr>
                        <th># Pedido</th>
                        <th>Cliente</th>
                        <th>Contacto</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Método de pago</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>

                    {pedidosFiltrados.length === 0 ? (

                        <tr>
                            <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>
                                No hay pedidos que coincidan con los filtros.
                            </td>
                        </tr>

                    ) : (
                        pedidosFiltrados.map((pedido) => {

                            const cliente = pedido.usuario_info
                                ? `${pedido.usuario_info.nombres} ${pedido.usuario_info.apellidos}`
                                : `Usuario #${pedido.usuario}`;

                            const estado = pedido.estado_compra || "pendiente";

                            const telefono = pedido.telefono_contacto;

                            return (

                                <tr key={pedido.id_compra}>
                                    <td>#{pedido.id_compra}</td>
                                    <td>{cliente}</td>
                                    <td>
                                        {telefono ? (
                                            <span className="contact-cell">
                                                <Phone size={14} />
                                                <a href={`tel:${telefono}`}>{telefono}</a>
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                className="add-contact-button"
                                                title="Agregar teléfono"
                                                onClick={() => abrirEdicion(pedido)}
                                            >
                                                <Phone size={14} />
                                                Agregar
                                            </button>
                                        )}
                                    </td>
                                    <td>{formatearFecha(pedido.fecha_compra)}</td>
                                    <td>{formatearPesos(pedido.total)}</td>
                                    <td>{pedido.metodo_pago_tipo || pedido.metodo_pago || "—"}</td>
                                    <td>
                                        <span className={claseEstado[estado] || "pending"}>
                                            {estado.charAt(0).toUpperCase() + estado.slice(1)}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions">
                                            <button
                                                className="view"
                                                title="Ver detalle"
                                                onClick={() => setDetalle(pedido)}
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                className="edit"
                                                title="Cambiar estado"
                                                onClick={() => abrirEdicion(pedido)}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                className="delete"
                                                title="Eliminar"
                                                onClick={() => eliminarPedido(pedido.id_compra)}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                            );

                        })
                    )}

                </tbody>

            </table>

            {/* Modal: ver detalle */}

            {detalle && (

                <div className="modal-overlay" onClick={() => setDetalle(null)}>

                    <div
                        className="order-detail-modal"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="modal-header">
                            <h2>Pedido #{detalle.id_compra}</h2>
                            <button
                                type="button"
                                className="close-button"
                                onClick={() => setDetalle(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="detail-section">
                            <h3>Cliente</h3>
                            {detalle.usuario_info ? (
                                <p>
                                    <strong>
                                        {detalle.usuario_info.nombres} {detalle.usuario_info.apellidos}
                                    </strong>
                                    <br />
                                    {detalle.usuario_info.email}
                                </p>
                            ) : (
                                <p>Usuario #{detalle.usuario}</p>
                            )}
                        </div>

                        <div className="detail-section">
                            <h3>Contacto</h3>
                            {detalle.telefono_contacto ? (
                                <p className="contact-cell">
                                    <Phone size={16} />
                                    <a href={`tel:${detalle.telefono_contacto}`}>
                                        {detalle.telefono_contacto}
                                    </a>
                                </p>
                            ) : (
                                <p className="empty-contact">
                                    Sin teléfono registrado.
                                </p>
                            )}
                        </div>

                        <div className="detail-section">
                            <h3>Información del pedido</h3>
                            <p>
                                <strong>Fecha:</strong> {formatearFecha(detalle.fecha_compra)}
                                <br />
                                <strong>Estado:</strong>{" "}
                                <span className={claseEstado[detalle.estado_compra] || "pending"}>
                                    {detalle.estado_compra}
                                </span>
                                <br />
                                <strong>Total:</strong> {formatearPesos(detalle.total)}
                            </p>
                        </div>

                        <div className="detail-section">
                            <h3>Productos</h3>

                            {detalle.detalles && detalle.detalles.length > 0 ? (

                                <ul className="detail-products">
                                    {detalle.detalles.map((det) => (
                                        <li key={det.id_detalle}>
                                            <span>
                                                Variante #{det.variante} × {det.cantidad}
                                            </span>
                                            <span>{formatearPesos(det.subtotal)}</span>
                                        </li>
                                    ))}
                                </ul>

                            ) : (
                                <p>No hay productos registrados.</p>
                            )}

                        </div>

                    </div>

                </div>

            )}

            {/* Modal: cambiar estado */}

            {editEstado && (

                <div className="modal-overlay" onClick={() => setEditEstado(null)}>

                    <form
                        className="order-status-modal"
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={guardarEstado}
                    >

                        <div className="modal-header">
                            <h2>Cambiar estado del pedido #{editEstado.id_compra}</h2>
                            <button
                                type="button"
                                className="close-button"
                                onClick={() => setEditEstado(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="form-group">
                            <label>Estado</label>
                            <select
                                value={nuevoEstado}
                                onChange={(e) => setNuevoEstado(e.target.value)}
                            >
                                {ESTADOS.map((estado) => (
                                    <option key={estado} value={estado}>
                                        {estado.charAt(0).toUpperCase() + estado.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>
                                <Phone size={14} />
                                {" "}Teléfono de contacto
                            </label>
                            <input
                                type="tel"
                                value={nuevoTelefono}
                                onChange={(e) => setNuevoTelefono(e.target.value)}
                                placeholder="Ej: 3001234567"
                                maxLength={20}
                            />
                        </div>

                        <div className="form-buttons">
                            <button
                                type="button"
                                className="cancel-button"
                                onClick={() => setEditEstado(null)}
                            >
                                Cancelar
                            </button>
                            <button type="submit" className="save-button">
                                Guardar cambios
                            </button>
                        </div>

                    </form>

                </div>

            )}

        </div>

    );

}

export default OrderTable;
