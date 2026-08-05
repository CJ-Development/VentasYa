import { useState, useEffect } from "react";

import { createProduct, getCategories } from "../../../services/adminService";
import "./ProductForm.css";

import { X } from "lucide-react";

function ProductForm({ onClose }) {

    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({

        nombre: "",

        categoria: "",

        descripcion: "",

        precio: "",

        estado: "activo",

        slug: ""

    });

    useEffect(() => {

        loadCategories();

    }, []);

    const loadCategories = async () => {

        try {

            const response = await getCategories();

            setCategories(response.data);

        }

        catch (error) {

            console.error(error);

        }

    };

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData({

            ...formData,

            [name]: value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const data = {

                nombre: formData.nombre,

                categoria_id: Number(formData.categoria),

                descripcion: formData.descripcion,

                precio: Number(formData.precio),

                estado: formData.estado,

                slug: formData.nombre
                    .toLowerCase()
                    .replace(/\s+/g, "-")

            };
            await createProduct(data);

            alert("Producto creado correctamente.");

            onClose();

        }

        catch (error) {

            console.error(error);

            alert("No fue posible crear el producto.");

        }

    };

    return (

        <div className="modal-overlay">

            <form
                className="product-form"
                onSubmit={handleSubmit}
            >

                <div className="modal-header">

                    <div>

                        <h2>

                            Nuevo producto

                        </h2>

                        <p>

                            Completa la información del producto.

                        </p>

                    </div>

                    <button
                        type="button"
                        className="close-button"
                        onClick={onClose}
                    >

                        <X size={20} />

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
                            placeholder="Nombre del producto"
                            required
                        />

                    </div>

                    <div className="form-group">

                        <label>

                            Categoría

                        </label>

                        <select
                            name="categoria"
                            value={formData.categoria}
                            onChange={handleChange}
                            required
                        >

                            <option value="">

                                Seleccione una categoría

                            </option>

                            {

                                categories.map((category) => (

                                    <option
                                        key={category.id_categoria}
                                        value={category.id_categoria}
                                    >

                                        {category.nombre}

                                    </option>

                                ))

                            }

                        </select>

                    </div>

                    <div className="form-group">

                        <label>

                            Precio

                        </label>

                        <input
                            type="number"
                            name="precio"
                            value={formData.precio}
                            onChange={handleChange}
                            placeholder="0"
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
                        placeholder="Descripción del producto"
                        required
                    />

                </div>

                <div className="form-group">

                    <label>

                        Imagen principal

                    </label>

                    <input
                        type="file"
                        name="imagen"
                    />

                </div>

                <div className="form-buttons">

                    <button
                        type="button"
                        className="cancel-button"
                        onClick={onClose}
                    >

                        Cancelar

                    </button>

                    <button
                        type="submit"
                        className="save-button"
                    >

                        Guardar producto

                    </button>

                </div>

            </form>

        </div>

    );

}

export default ProductForm;