import "./OfferForm.css";

import { useEffect, useState } from "react";

import { X } from "lucide-react";

import {
    createOffer,
    updateOffer,
    getProducts,
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
};

function OfferForm({ offer, onClose, onSaved }) {

    const modoEdicion = Boolean(offer);

    const [productos, setProductos] = useState([]);

    const [formData, setFormData] = useState(estadoInicial);

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {

        cargarProductos();

        if (offer) {

            setFormData({

                nombre: offer.nombre || "",
                descripcion: offer.descripcion || "",
                producto_id: offer.producto_id || "",
                tipo_descuento: offer.tipo_descuento || "porcentaje",
                valor: offer.valor ?? "",
                fecha_inicio: offer.fecha_inicio || "",
                fecha_fin: offer.fecha_fin || "",
                activa: Boolean(offer.activa),

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

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({

            ...prev,
            [name]: type === "checkbox" ? checked : value,

        }));

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

export default OfferForm;
