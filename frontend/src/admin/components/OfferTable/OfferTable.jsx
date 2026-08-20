import "./OfferTable.css";

import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Search,
    Eye,
    Pencil,
    Trash2,
    CalendarDays,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

import {
    getOffers,
    deleteOffer
} from "../../../services/adminService";

import { useToast } from "../Toast/ToastHost";


/* =====================================================
   FORMATEAR FECHA
===================================================== */

const formatearFecha = (iso) => {

    if (!iso) {
        return "—";
    }

    const fecha = new Date(iso);

    if (Number.isNaN(fecha.getTime())) {
        return iso;
    }

    return fecha.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

};


/* =====================================================
   FORMATEAR HORA
===================================================== */

const formatearHora = (iso) => {

    if (!iso) {
        return "";
    }

    const fecha = new Date(iso);

    if (Number.isNaN(fecha.getTime())) {
        return "";
    }

    return fecha.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit"
    });

};


/* =====================================================
   FORMATEAR DESCUENTO
===================================================== */

const formatearDescuento = (oferta) => {

    const numero = Number(oferta.valor);

    if (Number.isNaN(numero)) {
        return "—";
    }

    if (oferta.tipo_descuento === "porcentaje") {
        return `${numero}%`;
    }

    return `$${numero.toLocaleString("es-CO")}`;

};


/* =====================================================
   OBTENER NOMBRE DEL PRODUCTO
===================================================== */

const obtenerNombreProducto = (oferta) => {

    if (oferta.producto_detalle?.nombre) {
        return oferta.producto_detalle.nombre;
    }

    if (typeof oferta.producto === "string") {
        return oferta.producto;
    }

    if (oferta.producto?.nombre) {
        return oferta.producto.nombre;
    }

    if (oferta.producto_id) {
        return `Producto #${oferta.producto_id}`;
    }

    return "Todos los productos";

};


/* =====================================================
   OBTENER SKU / VARIANTE
===================================================== */

const obtenerSkuVariante = (oferta) => {

    if (oferta.variante_detalle?.sku) {
        return oferta.variante_detalle.sku;
    }

    if (
        oferta.producto &&
        typeof oferta.producto === "object" &&
        oferta.producto.sku
    ) {
        return oferta.producto.sku;
    }

    if (oferta.sku) {
        return oferta.sku;
    }

    return null;

};


/* =====================================================
   CATEGORÍAS
===================================================== */

const nombresCategorias = (oferta) => {

    const detalle = Array.isArray(
        oferta.categorias_detalle
    )
        ? oferta.categorias_detalle
        : null;


    if (
        detalle &&
        detalle.length > 0
    ) {

        return detalle
            .map((categoria) => categoria?.nombre)
            .filter(Boolean);

    }


    if (
        Array.isArray(oferta.categorias) &&
        oferta.categorias.length > 0
    ) {

        return oferta.categorias
            .map((categoria) => {

                if (typeof categoria === "string") {
                    return categoria;
                }

                return categoria?.nombre;

            })
            .filter(Boolean);

    }


    return [];

};


/* =====================================================
   ESTADO VISUAL
===================================================== */

const obtenerEstado = (oferta) => {

    const ahora = new Date();

    const inicio = oferta.fecha_inicio
        ? new Date(oferta.fecha_inicio)
        : null;

    const fin = oferta.fecha_fin
        ? new Date(oferta.fecha_fin)
        : null;


    if (
        fin &&
        !Number.isNaN(fin.getTime()) &&
        ahora > fin
    ) {

        return "finalizada";

    }


    if (
        inicio &&
        !Number.isNaN(inicio.getTime()) &&
        ahora < inicio
    ) {

        return "programada";

    }


    if (oferta.activa) {
        return "activa";
    }


    return "finalizada";

};


/* =====================================================
   LABELS
===================================================== */

const ESTADOS = {

    todas: "Todas",

    activa: "Activas",

    programada: "Programadas",

    finalizada: "Finalizadas"

};


/* =====================================================
   COMPONENTE
===================================================== */

function OfferTable({
    refreshKey,
    onEdit
}) {

    const toast = useToast();

    const [ofertas, setOfertas] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [busqueda, setBusqueda] = useState("");

    const [filtroEstado, setFiltroEstado] = useState("todas");


    /* =================================================
       CARGAR OFERTAS
    ================================================= */

    const cargarOfertas = async () => {

        try {

            setLoading(true);

            const { data } = await getOffers();

            setOfertas(
                Array.isArray(data)
                    ? data
                    : []
            );

            setError(null);

        }

        catch (err) {

            console.error(err);

            setError(
                "No fue posible cargar las ofertas."
            );

        }

        finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        cargarOfertas();

    }, [refreshKey]);


    /* =================================================
       ELIMINAR
    ================================================= */

    const eliminarOferta = async (id) => {

        const confirmar = window.confirm(
            "¿Eliminar esta oferta?"
        );

        if (!confirmar) {
            return;
        }


        try {

            await deleteOffer(id);

            await cargarOfertas();

            toast.success("La oferta fue eliminada.", {
                title: "Oferta eliminada"
            });

        }

        catch (err) {

            console.error(err);

            toast.error(
                "No fue posible eliminar la oferta.",
                { title: "Error al eliminar" }
            );

        }

    };


    /* =================================================
       OFERTAS CON ESTADO
    ================================================= */

    const ofertasConEstado = useMemo(() => {

        return ofertas.map((oferta) => ({

            ...oferta,

            estadoVisual:
                obtenerEstado(oferta)

        }));

    }, [ofertas]);


    /* =================================================
       FILTRAR
    ================================================= */

    const ofertasFiltradas = useMemo(() => {

        const texto =
            busqueda
                .toLowerCase()
                .trim();


        return ofertasConEstado.filter(
            (oferta) => {

                const producto =
                    obtenerNombreProducto(
                        oferta
                    );


                const coincideBusqueda =
                    !texto ||
                    oferta.nombre
                        ?.toLowerCase()
                        .includes(texto) ||
                    producto
                        .toLowerCase()
                        .includes(texto);


                const coincideEstado =
                    filtroEstado === "todas" ||
                    oferta.estadoVisual ===
                        filtroEstado;


                return (
                    coincideBusqueda &&
                    coincideEstado
                );

            }
        );

    }, [
        ofertasConEstado,
        busqueda,
        filtroEstado
    ]);


    /* =================================================
       CONTADOR
    ================================================= */

    const cantidadEstado = (estado) => {

        if (estado === "todas") {
            return ofertasConEstado.length;
        }

        return ofertasConEstado.filter(
            (oferta) =>
                oferta.estadoVisual === estado
        ).length;

    };


    /* =================================================
       LOADING
    ================================================= */

    if (loading) {

        return (

            <div className="offer-table">

                <div className="offer-state">

                    Cargando ofertas...

                </div>

            </div>

        );

    }


    /* =================================================
       ERROR
    ================================================= */

    if (error) {

        return (

            <div className="offer-table">

                <div className="offer-state offer-state-error">

                    {error}

                </div>

            </div>

        );

    }


    return (

        <div className="offer-table">

            {/* ==========================================
                TOOLBAR
            =========================================== */}

            <div className="offer-toolbar">

                <div className="offer-search">

                    <Search size={16} />

                    <input
                        type="text"
                        placeholder="Buscar oferta por nombre o producto..."
                        value={busqueda}
                        onChange={(event) =>
                            setBusqueda(
                                event.target.value
                            )
                        }
                    />

                </div>


                <select
                    className="offer-filter"
                    value={filtroEstado}
                    onChange={(event) =>
                        setFiltroEstado(
                            event.target.value
                        )
                    }
                >

                    <option value="todas">
                        Todas las ofertas
                    </option>

                    <option value="activa">
                        Activas
                    </option>

                    <option value="programada">
                        Programadas
                    </option>

                    <option value="finalizada">
                        Finalizadas
                    </option>

                </select>

            </div>


            {/* ==========================================
                TABS
            =========================================== */}

            <div className="offer-status-tabs">

                <button
                    type="button"
                    className={
                        filtroEstado === "todas"
                            ? "offer-status-tab is-all is-selected"
                            : "offer-status-tab is-all"
                    }
                    onClick={() =>
                        setFiltroEstado("todas")
                    }
                >

                    <span>
                        {ESTADOS.todas}
                    </span>

                    <strong>
                        {cantidadEstado("todas")}
                    </strong>

                </button>


                <button
                    type="button"
                    className={
                        filtroEstado === "activa"
                            ? "offer-status-tab is-active is-selected"
                            : "offer-status-tab is-active"
                    }
                    onClick={() =>
                        setFiltroEstado("activa")
                    }
                >

                    <span>
                        {ESTADOS.activa}
                    </span>

                    <strong>
                        {cantidadEstado("activa")}
                    </strong>

                </button>


                <button
                    type="button"
                    className={
                        filtroEstado === "programada"
                            ? "offer-status-tab is-scheduled is-selected"
                            : "offer-status-tab is-scheduled"
                    }
                    onClick={() =>
                        setFiltroEstado("programada")
                    }
                >

                    <span>
                        {ESTADOS.programada}
                    </span>

                    <strong>
                        {cantidadEstado("programada")}
                    </strong>

                </button>


                <button
                    type="button"
                    className={
                        filtroEstado === "finalizada"
                            ? "offer-status-tab is-finished is-selected"
                            : "offer-status-tab is-finished"
                    }
                    onClick={() =>
                        setFiltroEstado("finalizada")
                    }
                >

                    <span>
                        {ESTADOS.finalizada}
                    </span>

                    <strong>
                        {cantidadEstado("finalizada")}
                    </strong>

                </button>

            </div>


            {/* ==========================================
                TABLA
            =========================================== */}

            <div className="offer-table-wrapper">

                <table>

                    <thead>

                        <tr>

                            <th>
                                Oferta
                            </th>

                            <th>
                                Producto
                            </th>

                            <th>
                                Categorías
                            </th>

                            <th>
                                Descuento
                            </th>

                            <th>
                                Período
                            </th>

                            <th>
                                Estado
                            </th>

                            <th>
                                Acciones
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {ofertasFiltradas.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="7"
                                    className="offer-empty"
                                >

                                    No hay ofertas que coincidan con los filtros.

                                </td>

                            </tr>

                        ) : (

                            ofertasFiltradas.map(
                                (oferta) => {

                                    const productoNombre =
                                        obtenerNombreProducto(
                                            oferta
                                        );


                                    const sku =
                                        obtenerSkuVariante(
                                            oferta
                                        );


                                    const categorias =
                                        nombresCategorias(
                                            oferta
                                        );


                                    const estado =
                                        oferta.estadoVisual;


                                    return (

                                        <tr
                                            key={
                                                oferta.id_oferta
                                            }
                                        >

                                            {/* =================
                                                OFERTA
                                            ================== */}

                                            <td>

                                                <div className="offer-info">

                                                    <div className="offer-image">

                                                        <span>
                                                            %
                                                        </span>

                                                    </div>


                                                    <div className="offer-info-content">

                                                        <div className="offer-title-row">

                                                            <strong>
                                                                {
                                                                    oferta.nombre
                                                                }
                                                            </strong>

                                                            <span
                                                                className={`offer-mini-status ${estado}`}
                                                            >
                                                                {
                                                                    ESTADOS[
                                                                        estado
                                                                    ]
                                                                }
                                                            </span>

                                                        </div>


                                                        <span className="offer-desc">

                                                            {
                                                                oferta.descripcion ||
                                                                "Sin descripción"
                                                            }

                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* =================
                                                PRODUCTO
                                            ================== */}

                                            <td>

                                                <div className="offer-product">

                                                    <strong>
                                                        {
                                                            productoNombre
                                                        }
                                                    </strong>

                                                    {sku ? (

                                                        <span className="offer-product-variant">
                                                            Variante: {sku}
                                                        </span>

                                                    ) : (

                                                        <span className="offer-product-all">
                                                            Todas las variantes
                                                        </span>

                                                    )}

                                                </div>

                                            </td>


                                            {/* =================
                                                CATEGORÍAS
                                            ================== */}

                                            <td>

                                                {categorias.length === 0 ? (

                                                    <span className="offer-categories-empty">
                                                        Todas las categorías
                                                    </span>

                                                ) : (

                                                    <div className="offer-categories">

                                                        <span>
                                                            {
                                                                categorias
                                                                    .slice(0, 3)
                                                                    .join(", ")
                                                            }
                                                        </span>

                                                        {categorias.length > 3 && (

                                                            <span className="offer-category-more">
                                                                +{categorias.length - 3}
                                                            </span>

                                                        )}

                                                    </div>

                                                )}

                                            </td>


                                            {/* =================
                                                DESCUENTO
                                            ================== */}

                                            <td>

                                                <div className="offer-discount">

                                                    <strong>
                                                        {
                                                            formatearDescuento(
                                                                oferta
                                                            )
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            oferta.tipo_descuento ===
                                                            "porcentaje"
                                                                ? "Porcentaje"
                                                                : "Valor fijo"
                                                        }
                                                    </span>

                                                </div>

                                            </td>


                                            {/* =================
                                                PERÍODO
                                            ================== */}

                                            <td>

                                                <div className="offer-period">

                                                    <CalendarDays
                                                        size={14}
                                                    />

                                                    <div>

                                                        <span>
                                                            {
                                                                formatearFecha(
                                                                    oferta.fecha_inicio
                                                                )
                                                            }
                                                        </span>

                                                        <small>
                                                            {
                                                                formatearHora(
                                                                    oferta.fecha_inicio
                                                                )
                                                            }
                                                        </small>

                                                        <span>
                                                            {
                                                                formatearFecha(
                                                                    oferta.fecha_fin
                                                                )
                                                            }
                                                        </span>

                                                        <small>
                                                            {
                                                                formatearHora(
                                                                    oferta.fecha_fin
                                                                )
                                                            }
                                                        </small>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* =================
                                                ESTADO
                                            ================== */}

                                            <td>

                                                <span
                                                    className={`offer-status ${estado}`}
                                                >

                                                    {
                                                        ESTADOS[
                                                            estado
                                                        ]
                                                    }

                                                </span>

                                            </td>


                                            {/* =================
                                                ACCIONES
                                            ================== */}

                                            <td>

                                                <div className="offer-actions">

                                                    <button
                                                        type="button"
                                                        className="offer-action-button"
                                                        title="Ver oferta"
                                                    >

                                                        <Eye
                                                            size={15}
                                                        />

                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="offer-action-button"
                                                        title="Editar"
                                                        onClick={() =>
                                                            onEdit(
                                                                oferta
                                                            )
                                                        }
                                                    >

                                                        <Pencil
                                                            size={15}
                                                        />

                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="offer-action-button is-delete"
                                                        title="Eliminar"
                                                        onClick={() =>
                                                            eliminarOferta(
                                                                oferta.id_oferta
                                                            )
                                                        }
                                                    >

                                                        <Trash2
                                                            size={15}
                                                        />

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    );

                                }
                            )

                        )}

                    </tbody>

                </table>

            </div>


            {/* ==========================================
                FOOTER
            =========================================== */}

            <div className="offer-table-footer">

                <span>

                    Mostrando{" "}

                    <strong>
                        {ofertasFiltradas.length}
                    </strong>

                    {" "}de{" "}

                    <strong>
                        {ofertas.length}
                    </strong>

                    {" "}ofertas

                </span>


                <div className="offer-pagination">

                    <button
                        type="button"
                        disabled
                    >
                        <ChevronLeft
                            size={15}
                        />
                    </button>


                    <button
                        type="button"
                        className="is-current"
                    >
                        1
                    </button>


                    <button
                        type="button"
                        disabled
                    >
                        <ChevronRight
                            size={15}
                        />
                    </button>

                </div>

            </div>

        </div>

    );

}


export default OfferTable;