import { useState } from "react";
import { X } from "lucide-react";
import { createCategory } from "../../../services/adminService";
import "./CategoryForm.css";

function CategoryForm({ onClose, onCreated }) {

    const [formData, setFormData] = useState({

        nombre: "",
        descripcion: "",
        estado: "activo"

    });

    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData({

            ...formData,

            [name]: value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setSubmitting(true);

        try {

            await createCategory(formData);

            if (onCreated) await onCreated();

            onClose();

        }

        catch(error){

            console.error(error);

            alert("Error al crear la categoría.");

        }

        finally {

            setSubmitting(false);

        }

    };
    return (

        <div className="modal-overlay">

            <form
                className="category-form"
                onSubmit={handleSubmit}
            >

                <div className="modal-header">

                    <div>

                        <h2>

                            Nueva categoría

                        </h2>

                        <p>

                            Organiza tus productos fácilmente.

                        </p>

                    </div>

                    <button

                        type="button"

                        className="close-button"

                        onClick={onClose}

                    >

                        <X size={20}/>

                    </button>

                </div>

                <div className="form-grid">

                    <div className="form-group">

                        <label>

                            Nombre

                        </label>

                        <input

                            type="text"

                            name="nombre"

                            value={formData.nombre}

                            onChange={handleChange}

                            placeholder="Ej: Hombre"

                            required

                        />

                    </div>

                    <div className="form-group">

                        <label>

                            Estado

                        </label>

                        <select

                            name="estado"

                            value={formData.estado}

                            onChange={handleChange}

                        >

                            <option value="activo">

                                Activo

                            </option>

                            <option value="inactivo">

                                Inactivo

                            </option>

                        </select>

                    </div>

                </div>

                <div className="form-group">

                    <label>

                        Descripción

                    </label>

                    <textarea

                        rows="5"

                        name="descripcion"

                        value={formData.descripcion}

                        onChange={handleChange}

                        placeholder="Descripción de la categoría"

                    />

                </div>

                <div className="form-group">

                    <label>

                        Imagen

                    </label>

                    <input

                        type="file"

                    />

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

                        {submitting ? "Guardando..." : "Guardar categoría"}

                    </button>

                </div>

            </form>

        </div>

    );

}

export default CategoryForm;