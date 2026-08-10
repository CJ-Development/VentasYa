import "./ProductForm.css";

import { useEffect, useState } from "react";

import { Plus, Star, Trash2, X } from "lucide-react";

import {
    createProduct,
    updateProduct,
    getCategories,
    getColors,
    getTallas,
    createVariant,
    updateVariant,
    deleteVariant,
    addVariantImage,
    updateVariantImage,
    deleteVariantImage,
} from "../../../services/adminService";

const generarSlug = (texto) =>
    texto
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

const estadoInicialDatos = {
    nombre: "",
    categoria_id: "",
    descripcion: "",
    precio: "",
    estado: "activo",
};

const varianteVacia = {
    tempId: 0,
    id_variante: null,
    color: "",
    talla: "",
    sku: "",
    stock: 0,
    imagenes: [],
    nuevaImagen: "",
};

let tempCounter = 1;

function ProductForm({ product, onClose, onSaved }) {

    const modoEdicion = Boolean(product);

    const [tab, setTab] = useState("datos");

    const [categories, setCategories] = useState([]);

    const [colores, setColores] = useState([]);

    const [tallas, setTallas] = useState([]);

    const [datos, setDatos] = useState(estadoInicialDatos);

    const [slug, setSlug] = useState("");

    const [variantes, setVariantes] = useState([]);

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {

        cargarListas();

        if (product) {

            setDatos({
                nombre: product.nombre || "",
                categoria_id: product.categoria?.id_categoria ?? "",
                descripcion: product.descripcion || "",
                precio: product.precio ?? "",
                estado: product.estado || "activo",
            });

            setSlug(product.slug || "");

            setVariantes(
                (product.variantes || []).map((v) => ({
                    tempId: tempCounter++,
                    id_variante: v.id_variante,
                    color: v.color?.id_color ?? "",
                    talla: v.talla?.id_talla ?? "",
                    sku: v.sku || "",
                    stock: v.stock ?? 0,
                    imagenes: v.imagenes || [],
                    nuevaImagen: "",
                }))
            );

        } else {

            setDatos(estadoInicialDatos);
            setSlug("");
            setVariantes([]);

        }

    }, [product]);

    const cargarListas = async () => {

        try {

            const [cats, cols, talls] = await Promise.all([
                getCategories(),
                getColors(),
                getTallas(),
            ]);

            setCategories(cats.data);
            setColores(cols.data);
            setTallas(talls.data);

        }

        catch (error) {

            console.error(error);

        }

    };

    const handleDatosChange = (e) => {

        const { name, value } = e.target;

        setDatos((prev) => {

            const next = { ...prev, [name]: value };

            if (name === "nombre") {

                setSlug(generarSlug(value));

            }

            return next;

        });

    };

    const agregarVariante = () => {

        setVariantes((prev) => [
            ...prev,
            {
                ...varianteVacia,
                tempId: tempCounter++,
            },
        ]);

    };

    const eliminarVariante = async (index) => {

        const variante = variantes[index];

        if (variante.id_variante) {

            const confirmar = window.confirm(
                "¿Eliminar esta variante y sus imágenes?"
            );

            if (!confirmar) return;

            try {

                await deleteVariant(variante.id_variante);

            }

            catch (err) {

                console.error(err);

                alert("No se pudo eliminar la variante.");

                return;

            }

        }

        setVariantes((prev) => prev.filter((_, i) => i !== index));

    };

    const handleVarianteChange = (index, campo, valor) => {

        setVariantes((prev) =>

            prev.map((v, i) => (i === index ? { ...v, [campo]: valor } : v))

        );

    };

    const agregarImagen = async (index) => {

        const variante = variantes[index];

        const url = variante.nuevaImagen.trim();

        if (!url) return;

        try {

            if (variante.id_variante) {

                const { data } = await addVariantImage(variante.id_variante, {
                    imagen: url,
                    principal: variante.imagenes.length === 0,
                    orden: variante.imagenes.length + 1,
                });

                setVariantes((prev) =>

                    prev.map((v, i) =>

                        i === index
                            ? { ...v, imagenes: [...v.imagenes, data], nuevaImagen: "" }
                            : v

                    )

                );

            } else {

                setVariantes((prev) =>

                    prev.map((v, i) =>

                        i === index
                            ? {
                                ...v,
                                nuevaImagen: "",
                                imagenes: [
                                    ...v.imagenes,
                                    { imagen: url, principal: v.imagenes.length === 0 },
                                ],
                            }
                            : v

                    )

                );

            }

        }

        catch (err) {

            console.error(err);

            alert("No se pudo agregar la imagen.");

        }

    };

    const eliminarImagen = async (varianteIndex, imagenIndex) => {

        const variante = variantes[varianteIndex];

        const imagen = variante.imagenes[imagenIndex];

        if (imagen.id_imagen) {

            try {

                await deleteVariantImage(imagen.id_imagen);

            }

            catch (err) {

                console.error(err);

                alert("No se pudo eliminar la imagen.");

                return;

            }

        }

        setVariantes((prev) =>

            prev.map((v, i) =>

                i === varianteIndex
                    ? {
                        ...v,
                        imagenes: v.imagenes.filter((_, j) => j !== imagenIndex),
                    }
                    : v

            )

        );

    };

    const marcarPrincipal = async (varianteIndex, imagenIndex) => {

        const variante = variantes[varianteIndex];

        const imagen = variante.imagenes[imagenIndex];

        if (imagen.principal) return;

        try {

            // Caso 1: imagen ya persistida en backend → PUT directo (el backend
            // desmarca automáticamente el resto de la misma variante).
            if (imagen.id_imagen) {

                await updateVariantImage(imagen.id_imagen, { principal: true });

                setVariantes((prev) =>

                    prev.map((v, i) =>

                        i === varianteIndex
                            ? {
                                ...v,
                                imagenes: v.imagenes.map((img, j) => ({
                                    ...img,
                                    principal: j === imagenIndex,
                                })),
                            }
                            : v

                    )

                );

            } else {

                // Caso 2: imagen pendiente (aún sin id_imagen) → primero hay
                // que crear la variante para tener id_variante, luego POST.
                if (!variante.id_variante) {

                    alert("Guarda primero el producto para poder marcar la imagen principal.");

                    return;

                }

                // POST de la nueva imagen como principal.
                const { data: nueva } = await addVariantImage(variante.id_variante, {
                    imagen: imagen.imagen,
                    principal: true,
                    orden: variante.imagenes.length + 1,
                });

                // PUT sobre la variante existente que era principal → desmarcar.
                const anteriorPrincipal = variante.imagenes.find(
                    (img) => img.principal && img.id_imagen
                );

                if (anteriorPrincipal) {

                    await updateVariantImage(anteriorPrincipal.id_imagen, {
                        principal: false,
                    });

                }

                setVariantes((prev) =>

                    prev.map((v, i) =>

                        i === varianteIndex
                            ? {
                                ...v,
                                imagenes: v.imagenes.map((img, j) => ({
                                    ...img,
                                    principal: j === imagenIndex,
                                    // Reemplazar la imagen pendiente por la persistida
                                    // en el índice clickeado.
                                    ...(j === imagenIndex ? nueva : {}),
                                })),
                            }
                            : v

                    )

                );

            }

        }

        catch (err) {

            console.error(err);

            alert("No se pudo marcar la imagen como principal.");

        }

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!datos.categoria_id) {

            alert("Selecciona una categoría.");

            return;

        }

        if (!datos.nombre.trim()) {

            alert("El nombre es obligatorio.");

            return;

        }

        setSubmitting(true);

        try {

            let productoId = product?.id_producto;

            const payloadProducto = {
                nombre: datos.nombre,
                categoria_id: Number(datos.categoria_id),
                descripcion: datos.descripcion,
                precio: Number(datos.precio),
                estado: datos.estado,
                slug: slug || generarSlug(datos.nombre),
            };

            if (modoEdicion) {

                await updateProduct(product.id_producto, payloadProducto);

            } else {

                const { data } = await createProduct(payloadProducto);

                productoId = data.id_producto;

            }

            for (const v of variantes) {

                const variantePayload = {
                    color: Number(v.color),
                    talla: Number(v.talla),
                    sku: v.sku,
                    stock: Number(v.stock),
                };

                if (productoId) {

                    variantePayload.producto_id = productoId;

                }

                let varianteId = v.id_variante;

                if (varianteId) {

                    await updateVariant(varianteId, variantePayload);

                } else {

                    const { data } = await createVariant(productoId, variantePayload);

                    varianteId = data.id_variante;

                }

                for (const img of v.imagenes) {

                    if (!img.id_imagen) {

                        await addVariantImage(varianteId, {
                            imagen: img.imagen,
                            principal: img.principal || false,
                            orden: v.imagenes.indexOf(img) + 1,
                        });

                    }

                }

            }

            if (onSaved) await onSaved();

            onClose();

        }

        catch (error) {

            console.error(error);

            const mensaje = error.response?.data
                ? "No fue posible guardar el producto. Verifica los datos."
                : "No fue posible conectar con el servidor.";

            alert(mensaje);

        }

        finally {

            setSubmitting(false);

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

                            {modoEdicion ? "Editar producto" : "Nuevo producto"}

                        </h2>

                        <p>

                            {modoEdicion
                                ? "Modifica la información del producto."
                                : "Completa los datos, variantes e imágenes."}

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

                <div className="tabs">

                    <button
                        type="button"
                        className={tab === "datos" ? "tab active" : "tab"}
                        onClick={() => setTab("datos")}
                    >

                        Datos

                    </button>

                    <button
                        type="button"
                        className={tab === "variantes" ? "tab active" : "tab"}
                        onClick={() => setTab("variantes")}
                    >

                        Variantes ({variantes.length})

                    </button>

                    <button
                        type="button"
                        className={tab === "imagenes" ? "tab active" : "tab"}
                        onClick={() => setTab("imagenes")}
                    >

                        Imágenes

                    </button>

                </div>

                {tab === "datos" && (

                    <>

                        <div className="form-grid">

                            <div className="form-group">

                                <label>Nombre</label>

                                <input
                                    type="text"
                                    name="nombre"
                                    value={datos.nombre}
                                    onChange={handleDatosChange}
                                    placeholder="Nombre del producto"
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>Categoría</label>

                                <select
                                    name="categoria_id"
                                    value={datos.categoria_id}
                                    onChange={handleDatosChange}
                                    required
                                >

                                    <option value="">

                                        Seleccione una categoría

                                    </option>

                                    {categories.map((c) => (

                                        <option
                                            key={c.id_categoria}
                                            value={c.id_categoria}
                                        >

                                            {c.nombre}

                                        </option>

                                    ))}

                                </select>

                            </div>

                            <div className="form-group">

                                <label>Precio</label>

                                <input
                                    type="number"
                                    name="precio"
                                    value={datos.precio}
                                    onChange={handleDatosChange}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>Estado</label>

                                <select
                                    name="estado"
                                    value={datos.estado}
                                    onChange={handleDatosChange}
                                >

                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>
                                    <option value="archivado">Archivado</option>

                                </select>

                            </div>

                        </div>

                        <div className="form-group">

                            <label>Descripción</label>

                            <textarea
                                rows="4"
                                name="descripcion"
                                value={datos.descripcion}
                                onChange={handleDatosChange}
                                placeholder="Descripción del producto"
                            />

                        </div>

                        <div className="form-group">

                            <label>Slug</label>

                            <input
                                type="text"
                                value={slug}
                                readOnly
                                placeholder="se-genera-desde-el-nombre"
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
                                type="button"
                                className="next-button"
                                onClick={() => setTab("variantes")}
                            >

                                Siguiente: Variantes

                            </button>

                        </div>

                    </>

                )}

                {tab === "variantes" && (

                    <>

                        <p className="tab-help">

                            Cada variante es una combinación específica de color y
                            talla con su propio stock.

                        </p>

                        {variantes.length === 0 ? (

                            <p className="empty-state">

                                Aún no agregaste variantes.

                            </p>

                        ) : (

                            <table className="variants-table">

                                <thead>

                                    <tr>

                                        <th>Color</th>
                                        <th>Talla</th>
                                        <th>SKU</th>
                                        <th>Stock</th>
                                        <th></th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {variantes.map((v, i) => (

                                        <tr key={v.tempId}>

                                            <td>

                                                <select
                                                    value={v.color}
                                                    onChange={(e) =>
                                                        handleVarianteChange(
                                                            i,
                                                            "color",
                                                            e.target.value
                                                        )
                                                    }
                                                >

                                                    <option value="">—</option>

                                                    {colores.map((c) => (

                                                        <option
                                                            key={c.id_color}
                                                            value={c.id_color}
                                                        >

                                                            {c.nombre}

                                                        </option>

                                                    ))}

                                                </select>

                                            </td>

                                            <td>

                                                <select
                                                    value={v.talla}
                                                    onChange={(e) =>
                                                        handleVarianteChange(
                                                            i,
                                                            "talla",
                                                            e.target.value
                                                        )
                                                    }
                                                >

                                                    <option value="">—</option>

                                                    {tallas.map((t) => (

                                                        <option
                                                            key={t.id_talla}
                                                            value={t.id_talla}
                                                        >

                                                            {t.nombre}

                                                        </option>

                                                    ))}

                                                </select>

                                            </td>

                                            <td>

                                                <input
                                                    type="text"
                                                    value={v.sku}
                                                    onChange={(e) =>
                                                        handleVarianteChange(
                                                            i,
                                                            "sku",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="SKU-001"
                                                />

                                            </td>

                                            <td>

                                                <input
                                                    type="number"
                                                    value={v.stock}
                                                    min="0"
                                                    onChange={(e) =>
                                                        handleVarianteChange(
                                                            i,
                                                            "stock",
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                            </td>

                                            <td>

                                                <button
                                                    type="button"
                                                    className="delete-row"
                                                    onClick={() => eliminarVariante(i)}
                                                >

                                                    <Trash2 size={16} />

                                                </button>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        )}

                        <button
                            type="button"
                            className="add-row"
                            onClick={agregarVariante}
                        >

                            <Plus size={16} />
                            Agregar variante

                        </button>

                        <div className="form-buttons">

                            <button
                                type="button"
                                className="cancel-button"
                                onClick={() => setTab("datos")}
                                disabled={submitting}
                            >

                                Volver

                            </button>

                            <button
                                type="button"
                                className="next-button"
                                onClick={() => setTab("imagenes")}
                            >

                                Siguiente: Imágenes

                            </button>

                        </div>

                    </>

                )}

                {tab === "imagenes" && (

                    <>

                        <p className="tab-help">

                            Pega la URL de cada imagen. La primera imagen de cada
                            variante se marca como principal.

                        </p>

                        {variantes.length === 0 ? (

                            <p className="empty-state">

                                Primero agrega al menos una variante en la pestaña
                                anterior.

                            </p>

                        ) : (

                            variantes.map((v, i) => (

                                <div key={v.tempId} className="image-section">

                                    <h4>

                                        Variante #{i + 1} —{" "}

                                        {colores.find((c) => c.id_color === Number(v.color))?.nombre || "?"}
                                        {" / "}
                                        {tallas.find((t) => t.id_talla === Number(v.talla))?.nombre || "?"}

                                    </h4>

                                    {v.imagenes.length > 0 && (

                                        <div className="image-grid">

                                            {v.imagenes.map((img, j) => (

                                                <div
                                                    key={j}
                                                    className={
                                                        "image-card"
                                                        + (img.principal ? " image-card--principal" : "")
                                                    }
                                                >

                                                    <img
                                                        src={img.imagen}
                                                        alt={`img-${j}`}
                                                        onError={(e) => {
                                                            e.currentTarget.src =
                                                                "https://via.placeholder.com/80?text=Error";
                                                        }}
                                                    />

                                                    {img.principal && (

                                                        <span className="principal-badge">

                                                            <Star size={11} fill="currentColor" />
                                                            Principal

                                                        </span>

                                                    )}

                                                    <div className="image-card-actions">

                                                        <button
                                                            type="button"
                                                            className={
                                                                "star-button"
                                                                + (img.principal ? " star-button--active" : "")
                                                            }
                                                            title={
                                                                img.principal
                                                                    ? "Imagen principal"
                                                                    : "Marcar como principal"
                                                            }
                                                            onClick={() => marcarPrincipal(i, j)}
                                                        >

                                                            <Star
                                                                size={14}
                                                                fill={img.principal ? "currentColor" : "none"}
                                                            />

                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="delete-button"
                                                            title="Eliminar imagen"
                                                            onClick={() => eliminarImagen(i, j)}
                                                        >

                                                            <Trash2 size={14} />

                                                        </button>

                                                    </div>

                                                </div>

                                            ))}

                                        </div>

                                    )}

                                    <div className="image-input">

                                        <input
                                            type="url"
                                            placeholder="https://..."
                                            value={v.nuevaImagen}
                                            onChange={(e) =>
                                                handleVarianteChange(
                                                    i,
                                                    "nuevaImagen",
                                                    e.target.value
                                                )
                                            }
                                        />

                                        <button
                                            type="button"
                                            onClick={() => agregarImagen(i)}
                                        >

                                            <Plus size={16} />
                                            Agregar

                                        </button>

                                    </div>

                                </div>

                            ))

                        )}

                        <div className="form-buttons">

                            <button
                                type="button"
                                className="cancel-button"
                                onClick={() => setTab("variantes")}
                                disabled={submitting}
                            >

                                Volver

                            </button>

                            <button
                                type="submit"
                                className="save-button"
                                disabled={submitting}
                            >

                                {submitting
                                    ? "Guardando..."
                                    : (modoEdicion
                                        ? "Guardar cambios"
                                        : "Guardar producto")}

                            </button>

                        </div>

                    </>

                )}

            </form>

        </div>

    );

}

export default ProductForm;
