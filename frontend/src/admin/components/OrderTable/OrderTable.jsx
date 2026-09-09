import { useEffect, useState } from "react";

import {
    Eye,
    EyeOff,
    Phone,
    X
} from "lucide-react";

import "./OrderTable.css";

import {
    getOrders,
    updateOrderStatus
} from "../../../services/adminService";


const ESTADOS = [
    "pendiente",
    "pagado",
    "enviado",
    "entregado",
    "cancelado"
];


const formatearPesos = (valor) => {

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
        return "$0";
    }

    return `$${numero.toLocaleString("es-CO")}`;

};


const formatearFecha = (iso) => {

    if (!iso) {
        return "—";
    }

    const fecha = new Date(iso);

    if (Number.isNaN(fecha.getTime())) {
        return iso;
    }

    return fecha.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });

};


const formatearNumeroPedido = (id) => {
    const numero = Number(id);
    if (Number.isNaN(numero)) {
        return id;
    }
    return `BMS-${String(numero).padStart(5, '0')}`;
};

const formatearReferencia = (id) => {
    const numero = Number(id);
    if (Number.isNaN(numero)) {
        return id;
    }
    return `#${numero}`;
};


const claseEstado = {

    pendiente: "order-status order-status--pending",

    pagado: "order-status order-status--success",

    enviado: "order-status order-status--shipping",

    entregado: "order-status order-status--completed",

    cancelado: "order-status order-status--cancelled"

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

    const [showTotals, setShowTotals] = useState(false);

    const [editMetodoPago, setEditMetodoPago] = useState(null);

    const [nuevoMetodoPago, setNuevoMetodoPago] = useState("");

    const METODOS_PAGO = [
        "nequi",
        "wompi",
        "bancolombia",
        "daviplata",
        "pse",
        "tarjeta",
        "efectivo",
        "otro"
    ];


    const cargarPedidos = async () => {

        try {

            setLoading(true);

            const { data } = await getOrders();

            console.log("Pedidos cargados:", data);

            setPedidos(data || []);

            setError(null);

        }

        catch (err) {

            console.error("Error cargando pedidos:", err);

            setError("No fue posible cargar los pedidos.");

            setPedidos([]);

        }

        finally {

            setLoading(false);

        }

    };


    useEffect(() => {
        cargarPedidos();
    }, [refreshKey]);


    const guardarEstado = async (pedido) => {

        try {

            await updateOrderStatus(
                pedido.id_compra,
                {
                    estado_compra: nuevoEstado,
                    telefono_contacto: pedido.telefono_contacto || null
                }
            );

            setEditEstado(null);

            if (onAction) {
                onAction();
            }

        }

        catch (err) {

            console.error(err);

            alert(
                "No fue posible actualizar el estado."
            );

        }

    };


    const guardarMetodoPago = async (pedido) => {

        try {

            await updateOrderStatus(
                pedido.id_compra,
                {
                    metodo_pago: nuevoMetodoPago
                }
            );

            setEditMetodoPago(null);

            if (onAction) {
                onAction();
            }

        }

        catch (err) {

            console.error(err);

            alert(
                "No fue posible actualizar el método de pago."
            );

        }

    };


    const pedidosFiltrados = pedidos.filter((pedido) => {

        const cliente = pedido.usuario_info
            ? `${pedido.usuario_info.nombres} ${pedido.usuario_info.apellidos}`.toLowerCase()
            : pedido.usuario
                ? `usuario #${pedido.usuario}`.toLowerCase()
                : "";

        const textoBusqueda = busqueda
            .trim()
            .toLowerCase();

        const coincideBusqueda =
            !textoBusqueda ||
            String(pedido.id_compra).includes(textoBusqueda) ||
            cliente.includes(textoBusqueda);

        const coincideEstado =
            !filtroEstado ||
            pedido.estado_compra === filtroEstado;

        return coincideBusqueda && coincideEstado;

    });


    if (loading) {

        return (

            <div className="order-table">

                <div className="order-loading">
                    Cargando pedidos...
                </div>

            </div>

        );

    }


    if (error) {

        return (

            <div className="order-table">

                <div className="order-error">
                    {error}
                </div>

            </div>

        );

    }


    return (

        <div className="order-table">

            {/* =====================================================
                BARRA SUPERIOR
                ===================================================== */}

            <div className="order-table-toolbar">

                <div className="order-search">

                    <input
                        type="text"
                        placeholder="Buscar por # o cliente..."
                        value={busqueda}
                        onChange={(e) =>
                            setBusqueda(e.target.value)
                        }
                    />

                </div>


                <div className="order-filter">

                    <select
                        value={filtroEstado}
                        onChange={(e) =>
                            setFiltroEstado(e.target.value)
                        }
                    >

                        <option value="">
                            Todos los estados
                        </option>

                        {ESTADOS.map((estado) => (

                            <option
                                key={estado}
                                value={estado}
                            >

                                {estado.charAt(0).toUpperCase() +
                                    estado.slice(1)}

                            </option>

                        ))}

                    </select>

                </div>

            </div>


            {/* =====================================================
                TÍTULO DE LA TABLA
                ===================================================== */}

            <div className="order-table-title-row">
                <h2 className="order-table-title">
                    Pedidos registrados
                </h2>

                <button
                    type="button"
                    className="toggle-totals-button"
                    onClick={() => setShowTotals(!showTotals)}
                    title={showTotals ? "Ocultar totales" : "Mostrar totales"}
                >
                    {showTotals ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>


            {/* =====================================================
                TABLA
                ===================================================== */}

            <div className="order-table-wrapper">

                <table className="orders-data-table">

                    <thead>

                        <tr>

                            <th># Pedido</th>

                            <th>Cliente</th>

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

                                <td
                                    colSpan="7"
                                    className="order-empty-cell"
                                >

                                    No hay pedidos que coincidan
                                    con los filtros.

                                </td>

                            </tr>

                        ) : (

                            pedidosFiltrados.map((pedido) => {

                                const cliente =
                                    pedido.usuario_info
                                        ? `${pedido.usuario_info.nombres} ${pedido.usuario_info.apellidos}`
                                        : pedido.usuario
                                            ? `Usuario #${pedido.usuario}`
                                            : "Cliente sin registrar";

                                const estado =
                                    pedido.estado_compra ||
                                    "pendiente";

                                const telefono =
                                    pedido.telefono_contacto;


                                return (

                                    <tr
                                        key={pedido.id_compra}
                                    >

                                        {/* Pedido */}

                                        <td className="order-id">

                                            <div>
                                                <div>#{formatearNumeroPedido(pedido.id_compra)}</div>
                                                <small style={{color: '#6B7280', fontSize: '11px'}}>
                                                    {formatearReferencia(pedido.id_compra)}
                                                </small>
                                            </div>

                                        </td>


                                        {/* Cliente */}

                                        <td className="order-client">

                                            {cliente}

                                        </td>




                                        {/* Fecha */}

                                        <td className="order-date">

                                            {formatearFecha(
                                                pedido.fecha_compra
                                            )}

                                        </td>


                                        {/* Total */}

                                        <td className="order-total">

                                            {showTotals
                                                ? formatearPesos(pedido.total)
                                                : "••••••••"
                                            }

                                        </td>


                                        {/* Método de pago */}

                                        <td>

                                            {editMetodoPago === pedido.id_compra ? (

                                                <select
                                                    value={nuevoMetodoPago}
                                                    onChange={(e) =>
                                                        setNuevoMetodoPago(e.target.value)
                                                    }
                                                    onBlur={() => {
                                                        if (nuevoMetodoPago !== (pedido.metodo_pago_tipo || pedido.metodo_pago)) {
                                                            guardarMetodoPago(pedido);
                                                        } else {
                                                            setEditMetodoPago(null);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            if (nuevoMetodoPago !== (pedido.metodo_pago_tipo || pedido.metodo_pago)) {
                                                                guardarMetodoPago(pedido);
                                                            } else {
                                                                setEditMetodoPago(null);
                                                            }
                                                        } else if (e.key === "Escape") {
                                                            setEditMetodoPago(null);
                                                        }
                                                    }}
                                                    autoFocus
                                                >
                                                    {METODOS_PAGO.map((metodo) => (
                                                        <option key={metodo} value={metodo}>
                                                            {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                                                        </option>
                                                    ))}
                                                </select>

                                            ) : (

                                                <span
                                                    className="payment-method"
                                                    onClick={() => {
                                                        setEditMetodoPago(pedido.id_compra);
                                                        setNuevoMetodoPago(pedido.metodo_pago_tipo || pedido.metodo_pago || "");
                                                    }}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    {
                                                        pedido.metodo_pago_tipo ||
                                                        pedido.metodo_pago ||
                                                        "—"
                                                    }
                                                </span>

                                            )}

                                        </td>


                                        {/* Estado */}

                                        <td>

                                            {editEstado?.id_compra === pedido.id_compra ? (

                                                <select
                                                    value={nuevoEstado}
                                                    onChange={(e) =>
                                                        setNuevoEstado(e.target.value)
                                                    }
                                                    onBlur={() => {
                                                        if (nuevoEstado !== pedido.estado_compra) {
                                                            guardarEstado(pedido);
                                                        } else {
                                                            setEditEstado(null);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            if (nuevoEstado !== pedido.estado_compra) {
                                                                guardarEstado(pedido);
                                                            } else {
                                                                setEditEstado(null);
                                                            }
                                                        } else if (e.key === "Escape") {
                                                            setEditEstado(null);
                                                        }
                                                    }}
                                                    autoFocus
                                                >
                                                    {ESTADOS.map((est) => (
                                                        <option key={est} value={est}>
                                                            {est.charAt(0).toUpperCase() + est.slice(1)}
                                                        </option>
                                                    ))}
                                                </select>

                                            ) : (

                                                <span
                                                    className={
                                                        claseEstado[estado] ||
                                                        claseEstado.pendiente
                                                    }
                                                    onClick={() => {
                                                        setEditEstado(pedido);
                                                        setNuevoEstado(pedido.estado_compra || "pendiente");
                                                    }}
                                                    style={{ cursor: "pointer" }}
                                                >

                                                    {estado.charAt(0).toUpperCase() +
                                                        estado.slice(1)}

                                                </span>

                                            )}

                                        </td>


                                        {/* Acciones */}

                                        <td>

                                            <div className="order-actions">

                                                <button
                                                    type="button"
                                                    className="order-action order-action--view"
                                                    title="Ver detalle"
                                                    onClick={() =>
                                                        setDetalle(pedido)
                                                    }
                                                >

                                                    <Eye size={17} />

                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                );

                            })

                        )}

                    </tbody>

                </table>

            </div>


            {/* =====================================================
                MODAL - DETALLE DEL PEDIDO
                ===================================================== */}

            {detalle && (

                <div
                    className="modal-overlay"
                    onClick={() =>
                        setDetalle(null)
                    }
                >

                    <div
                        className="order-detail-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="modal-header">

                            <div>

                                <h2>
                                    Pedido #{formatearNumeroPedido(detalle.id_compra)}
                                </h2>

                                <p>
                                    Detalle de la compra
                                </p>

                            </div>


                            <button
                                type="button"
                                className="close-button"
                                onClick={() =>
                                    setDetalle(null)
                                }
                            >

                                <X size={20} />

                            </button>

                        </div>


                        <div className="detail-section">

                            <h3>Cliente: {detalle.usuario_info ? `${detalle.usuario_info.nombres} ${detalle.usuario_info.apellidos}` : `Usuario #${detalle.usuario}`}</h3>

                        </div>


                        <div className="detail-section">

                            <h3>Contacto : {detalle.telefono_contacto || "Sin teléfono"}</h3>

                        </div>


                        <div className="detail-section">

                            <h3>Productos</h3>

                            {detalle.detalles &&
                            detalle.detalles.length > 0 ? (

                                <ul className="detail-products">

                                    {detalle.detalles.map((det) => (

                                        <li
                                            key={det.id_detalle}
                                        >

                                            <span>
                                                Variante #{det.variante}
                                                {" × "}
                                                {det.cantidad}
                                            </span>

                                            <strong>
                                                {formatearPesos(
                                                    det.subtotal
                                                )}
                                            </strong>

                                        </li>

                                    ))}

                                </ul>

                            ) : (

                                <p>
                                    No hay productos registrados.
                                </p>

                            )}

                        </div>


                    </div>

                </div>

            )}


        </div>

    );

}


export default OrderTable;