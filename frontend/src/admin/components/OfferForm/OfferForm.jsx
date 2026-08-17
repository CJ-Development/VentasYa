import "./OfferForm.css";

import { useEffect, useMemo, useState } from "react";

import { X } from "lucide-react";

import {
    createOffer,
    updateOffer,
    getProducts,
    getCategories,
} from "../../../services/adminService";

const estadoInicial = {
    nombre: "",
    descripcion: "",
    producto_id: "",
    tipo_descuento: "porcentaje",
    valor: "",
    fecha_inicio: "",
    fecha_fin: "",
    activa: true,
    categorias_ids: [],
};

/* Construye un árbol jerárquico (padre → hijos) a partir de la
 * respuesta plana de /categories/. La API devuelve cada categoría con
 * su lista anidada de subcategorías; aquí lo aplanamos y volvemos a
 * armar el árbol para el selector. */
const construirArbol = (categorias) => {
    const mapa = new Map();
    categorias.forEach((cat) => {
        mapa.set(cat.id_categoria, {
            ...cat,
            hijos: [],
        });
    });

    const raices = [];
    mapa.forEach((nodo) => {
        const padre = nodo.categoria_padre;
        if (padre && mapa.has(padre.id_categoria)) {
            mapa.get(padre.id_categoria).hijos.push(nodo);
        } else {
            raices.push(nodo);
        }
    });

    return raices;
};

function OfferForm({ offer, onClose, onSaved }) {

    const modoEdicion = Boolean(offer);

    const [productos, setProductos] = useState([]);

    const [categorias, setCategorias] = useState([]);

    const [formData, setFormData] = useState(estadoInicial);

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {

        cargarProductos();
        cargarCategorias();

        if (offer) {

            /* Si el backend ya devuelve categorias_ids podemos usarlo
             * directo. Si no, lo armamos desde categorias_detalle. */
            const ids = Array.isArray(offer.categorias_ids)
                ? offer.categorias_ids
                : (offer.categorias_detalle || []).map((c) => c.id_categoria);

            setFormData({

                nombre: offer.nombre || "",
                descripcion: offer.descripcion || "",
                producto_id: offer.producto_id || "",
                tipo_descuento: offer.tipo_descuento || "porcentaje",
                valor: offer.valor ?? "",
                fecha_inicio: offer.fecha_inicio || "",
                fecha_fin: offer.fecha_fin || "",
                activa: Boolean(offer.activa),
                categorias_ids: ids,

            });

        } else {

            setFormData(estadoInicial);

        }

    }, [offer]);

    const cargarProductos = async () => {

        try {

            const { data } = await getProducts();

            setProductos(data);

        }

        catch (err) {

            console.error(err);

        }

    };

    const cargarCategorias = async () => {

        try {

            const { data } = await getCategories();

            setCategorias(data || []);

        }

        catch (err) {

            console.error(err);

        }

    };

    /* Aplanamos el árbol para mostrar chips planos, pero conservamos
     * la jerarquía para evitar mostrar el mismo id dos veces. */
    const arbol = useMemo(() => construirArbol(categorias), [categorias]);

    const categoriasPlanas = useMemo(() => {
        const lista = [];
        const visitar = (nodo) => {
            lista.push({
                id: nodo.id_categoria,
                nombre: nodo.nombre,
                padre: nodo.categoria_padre?.nombre || null,
            });
            nodo.hijos.forEach(visitar);
        };
        arbol.forEach(visitar);
        return lista;
    }, [arbol]);

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({

            ...prev,
            [name]: type === "checkbox" ? checked : value,

        }));

    };

    const toggleCategoria = (idCategoria) => {

        setFormData((prev) => {
            const esta = prev.categorias_ids.includes(idCategoria);
            return {
                ...prev,
                categorias_ids: esta
                    ? prev.categorias_ids.filter((id) => id !== idCategoria)
                    : [...prev.categorias_ids, idCategoria],
            };
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {

            alert("La fecha de fin debe ser posterior a la fecha de inicio.");

            return;

        }

        if (Number(formData.valor) <= 0) {

            alert("El valor del descuento debe ser mayor que 0.");

            return;

        }

        if (formData.categorias_ids.length === 0) {

            alert("Selecciona al menos una categoría para la oferta.");

            return;

        }

        const payload = {

            ...formData,
            producto_id: Number(formData.producto_id),
            valor: Number(formData.valor),

        };

        setSubmitting(true);

        try {

            if (modoEdicion) {

                await updateOffer(offer.id_oferta, payload);

            } else {

                await createOffer(payload);

            }

            if (onSaved) await onSaved();

            onClose();

        }

        catch (err) {

            console.error(err);

            alert("No fue posible guardar la oferta.");

        }

        finally {

            setSubmitting(false);

        }

    };

    return (

        <div className="modal-overlay">

            <form
                className="offer-form"
                onSubmit={handleSubmit}
            >

                <div className="modal-header">

                    <div>

                        <h2>

                            {modoEdicion ? "Editar oferta" : "Nueva oferta"}

                        </h2>

                        <p>

                            {modoEdicion
                                ? "Modifica los datos de la oferta."
                                : "Crea una nueva promoción para un producto."}

                        </p>

                    </div>

                    <button
                        type="button"
                        className="close-button"
                        onClick={onClose}
                        disabled={submitting}
                    >

                        <X size={20} />

                    </button>

                </div>

                <div className="form-grid">

                    <div className="form-group">

                        <label>Nombre de la oferta</label>

                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej: Black Friday"
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label>Producto</label>

                        <select
                            name="producto_id"
                            value={formData.producto_id}
                            onChange={handleChange}
                            required
                        >

                            <option value="">

                                Seleccione un producto

                            </option>

                            {productos.map((producto) => (

                                <option
                                    key={producto.id_producto}
                                    value={producto.id_producto}
                                >

                                    {producto.nombre}

                                </option>

                            ))}

                        </select>

                    </div>

                    <div className="form-group">

                        <label>Tipo de descuento</label>

                        <select
                            name="tipo_descuento"
                            value={formData.tipo_descuento}
                            onChange={handleChange}
                        >

                            <option value="porcentaje">Porcentaje (%)</option>
                            <option value="fijo">Valor fijo ($)</option>

                        </select>

                    </div>

                    <div className="form-group">

                        <label>Valor</label>

                        <input
                            type="number"
                            name="valor"
                            value={formData.valor}
                            onChange={handleChange}
                            placeholder="20"
                            min="0"
                            step="0.01"
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label>Fecha inicio</label>

                        <input
                            type="date"
                            name="fecha_inicio"
                            value={formData.fecha_inicio}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label>Fecha fin</label>

                        <input
                            type="date"
                            name="fecha_fin"
                            value={formData.fecha_fin}
                            onChange={handleChange}
                            required
                        />

                    </div>

                </div>

                <div className="form-group">

                    <label>Descripción</label>

                    <textarea
                        rows="4"
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        placeholder="Descripción de la oferta..."
                    />

                </div>

                {/* ======================================================
                    CATEGORÍAS
                   - Multi-select con árbol jerárquico.
                   - Muestra chips con las elegidas; click para quitar.
                   - Valida mínimo una antes de enviar.
                ====================================================== */}

                <div className="form-group">

                    <label>
                        Categorías que aplican
                        <span className="form-group-required"> *</span>
                    </label>

                    <div className="offer-categories-selected">
                        {formData.categorias_ids.length === 0 ? (
                            <span className="offer-categories-empty">
                                Aún no has seleccionado ninguna categoría.
                            </span>
                        ) : (
                            categoriasPlanas
                                .filter((c) => formData.categorias_ids.includes(c.id))
                                .map((c) => (
                                    <button
                                        type="button"
                                        key={c.id}
                                        className="offer-category-chip"
                                        onClick={() => toggleCategoria(c.id)}
                                        title="Quitar"
                                    >
                                        {c.nombre}
                                        {c.padre ? (
                                            <small> · {c.padre}</small>
                                        ) : null}
                                        <X size={12} />
                                    </button>
                                ))
                        )}
                    </div>

                    <div className="offer-categories-tree">
                        {arbol.length === 0 ? (
                            <span className="offer-categories-empty">
                                Cargando categorías...
                            </span>
                        ) : (
                            arbol.map((nodo) => (
                                <CategoriaNodo
                                    key={nodo.id_categoria}
                                    nodo={nodo}
                                    seleccionados={formData.categorias_ids}
                                    onToggle={toggleCategoria}
                                />
                            ))
                        )}
                    </div>

                </div>

                <div className="form-group form-check">

                    <label>

                        <input
                            type="checkbox"
                            name="activa"
                            checked={formData.activa}
                            onChange={handleChange}
                        />

                        Oferta activa

                    </label>

                </div>

                <div className="form-buttons">

                    <button
                        type="button"
                        className="cancel-button"
                        onClick={onClose}
                        disabled={submitting}
                    >

                        Cancelar

                    </button>

                    <button
                        type="submit"
                        className="save-button"
                        disabled={submitting}
                    >

                        {submitting
                            ? "Guardando..."
                            : (modoEdicion ? "Guardar cambios" : "Guardar oferta")}

                    </button>

                </div>

            </form>

        </div>

    );

}

/* Render recursivo de un nodo y sus subcategorías. */
function CategoriaNodo({ nodo, seleccionados, onToggle }) {

    const checked = seleccionados.includes(nodo.id_categoria);

    return (

        <div className="offer-categories-node">

            <label className="offer-categories-row">

                <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(nodo.id_categoria)}
                />

                <span>{nodo.nombre}</span>

            </label>

            {nodo.hijos && nodo.hijos.length > 0 && (
                <div className="offer-categories-children">
                    {nodo.hijos.map((hijo) => (
                        <CategoriaNodo
                            key={hijo.id_categoria}
                            nodo={hijo}
                            seleccionados={seleccionados}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            )}

        </div>

    );

}

export default OfferForm;
