import "./ProductForm.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Star, Trash2, X } from "lucide-react";
import {
    saveProductComplete,
    getCategories,
    getColors,
    getTallas,
    createColor,
    createTalla,
} from "../../../services/adminService";

const API_ORIGIN = "http://127.0.0.1:8000";
const MAX_IMAGES = 3;

const slugify = (text) => text.toLowerCase().trim().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-");

const mediaUrl = (value) => {
    if (!value) return "";
    if (value.startsWith("blob:") || value.startsWith("http://") || value.startsWith("https://")) return value;
    return `${API_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
};

const emptyVariant = () => ({
    clientId: crypto.randomUUID(),
    id_variante: null,
    color: "",
    talla: "",
    sku: "",
    stock: 0,
    imagenes: [],
});

const normalizeProduct = (product) => ({
    nombre: product?.nombre || "",
    categoria_id: product?.categoria?.id_categoria ?? product?.categoria_id ?? "",
    descripcion: product?.descripcion || "",
    precio: product?.precio ?? "",
    estado: product?.estado || "activo",
    slug: product?.slug || "",
});

const normalizeVariants = (product) => (product?.variantes || []).map((v) => ({
    clientId: crypto.randomUUID(),
    id_variante: v.id_variante,
    color: v.color?.id_color ?? v.color ?? "",
    talla: v.talla?.id_talla ?? v.talla ?? "",
    sku: v.sku || "",
    stock: v.stock ?? 0,
    imagenes: (v.imagenes || []).map((img) => ({
        id_imagen: img.id_imagen,
        imagen: img.imagen,
        principal: Boolean(img.principal),
        orden: img.orden,
    })),
}));

function ProductForm({ product, onClose, onSaved }) {
    const editing = Boolean(product?.id_producto);
    const [tab, setTab] = useState("datos");
    const [datos, setDatos] = useState(() => normalizeProduct(product));
    const [variantes, setVariantes] = useState(() => normalizeVariants(product));
    const [categories, setCategories] = useState([]);
    const [colores, setColores] = useState([]);
    const [tallas, setTallas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [errors, setErrors] = useState({});
    const inputRefs = useRef({});

    useEffect(() => {
        let alive = true;
        Promise.all([getCategories(), getColors(), getTallas()]).then(([cats, cols, sizes]) => {
            if (!alive) return;
            setCategories(cats.data || []);
            setColores(cols.data || []);
            setTallas(sizes.data || []);
        }).catch((err) => {
            console.error(err);
            if (alive) setError("No fue posible cargar categorías, colores y tallas.");
        });
        return () => { alive = false; };
    }, []);

    const handleData = (event) => {
        const { name, value } = event.target;
        setDatos((prev) => ({ ...prev, [name]: value, ...(name === "nombre" ? { slug: slugify(value) } : {}) }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const updateVariant = (index, field, value) => {
        setVariantes((prev) => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
        setErrors((prev) => ({ ...prev, [`variant-${index}-${field}`]: "" }));
    };

    const addVariant = () => setVariantes((prev) => [...prev, emptyVariant()]);

    const removeVariant = (index) => setVariantes((prev) => prev.filter((_, i) => i !== index));

    const addColor = async () => {
        const nombre = window.prompt("Nombre del nuevo color:");
        if (!nombre?.trim()) return;
        try {
            const { data } = await createColor({ nombre: nombre.trim(), codigo_hex: "#384D48" });
            setColores((prev) => [...prev, data]);
            setVariantes((prev) => prev.map((v) => !v.color ? { ...v, color: data.id_color } : v));
        } catch (err) {
            console.error(err);
            setError("No se pudo crear el color.");
        }
    };

    const addTalla = async () => {
        const nombre = window.prompt("Nombre de la nueva talla:");
        if (!nombre?.trim()) return;
        try {
            const { data } = await createTalla({ nombre: nombre.trim() });
            setTallas((prev) => [...prev, data]);
            setVariantes((prev) => prev.map((v) => !v.talla ? { ...v, talla: data.id_talla } : v));
        } catch (err) {
            console.error(err);
            setError("No se pudo crear la talla.");
        }
    };

    const addFile = (index, file) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) return setError("Solo se permiten archivos de imagen.");
        setError("");
        setVariantes((prev) => prev.map((v, i) => {
            if (i !== index || v.imagenes.length >= MAX_IMAGES) return v;
            const principal = v.imagenes.length === 0;
            return {
                ...v,
                imagenes: [...v.imagenes, {
                    imagen: URL.createObjectURL(file),
                    principal,
                    orden: v.imagenes.length + 1,
                    file,
                }],
            };
        }));
        if (inputRefs.current[index]) inputRefs.current[index].value = "";
    };

    const addUrl = (index) => {
        if (variantes[index].imagenes.length >= MAX_IMAGES) return setError(`Máximo ${MAX_IMAGES} imágenes por variante.`);
        const url = window.prompt("URL de la imagen:");
        if (!url?.trim()) return;
        setVariantes((prev) => prev.map((v, i) => i === index ? {
            ...v,
            imagenes: [...v.imagenes, { imagen: url.trim(), principal: v.imagenes.length === 0, orden: v.imagenes.length + 1 }],
        } : v));
    };

    const removeImage = (variantIndex, imageIndex) => {
        setVariantes((prev) => prev.map((v, i) => i !== variantIndex ? v : {
            ...v,
            imagenes: v.imagenes.filter((_, j) => j !== imageIndex).map((img, j) => ({ ...img, orden: j + 1, principal: j === 0 })),
        }));
    };

    const setPrincipal = (variantIndex, imageIndex) => {
        setVariantes((prev) => prev.map((v, i) => i !== variantIndex ? v : {
            ...v,
            imagenes: v.imagenes.map((img, j) => ({ ...img, principal: j === imageIndex })),
        }));
    };

    const validate = () => {
        const next = {};
        if (!datos.nombre.trim()) next.nombre = "El nombre es obligatorio.";
        if (!datos.categoria_id) next.categoria_id = "Selecciona una categoría.";
        if (datos.precio === "" || Number(datos.precio) <= 0) next.precio = "Ingresa un precio mayor a 0.";
        if (!variantes.length) next.variantes = "Agrega al menos una variante.";

        const skus = new Set();
        variantes.forEach((v, i) => {
            if (!v.color) next[`variant-${i}-color`] = "Selecciona un color.";
            if (!v.talla) next[`variant-${i}-talla`] = "Selecciona una talla.";
            if (!v.sku.trim()) next[`variant-${i}-sku`] = "El SKU es obligatorio.";
            else if (skus.has(v.sku.trim())) next[`variant-${i}-sku`] = "SKU repetido.";
            else skus.add(v.sku.trim());
            if (v.stock === "" || Number(v.stock) < 0) next[`variant-${i}-stock`] = "Stock inválido.";
            if (!v.imagenes.length) next[`variant-${i}-images`] = "Agrega al menos una imagen.";
            if (v.imagenes.length > MAX_IMAGES) next[`variant-${i}-images`] = `Máximo ${MAX_IMAGES} imágenes.`;
        });
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const buildFormData = () => {
        const formData = new FormData();
        const variantsPayload = variantes.map((v, variantIndex) => ({
            ...(v.id_variante ? { id_variante: v.id_variante } : {}),
            color: Number(v.color),
            talla: Number(v.talla),
            sku: v.sku.trim(),
            stock: Number(v.stock),
            imagenes: v.imagenes.map((img, imageIndex) => {
                if (img.file) {
                    const fileKey = `variant_${variantIndex}_image_${imageIndex}`;
                    formData.append(fileKey, img.file, img.file.name);
                    return { principal: Boolean(img.principal), orden: imageIndex + 1, file_key: fileKey };
                }
                return {
                    ...(img.id_imagen ? { id_imagen: img.id_imagen } : {}),
                    imagen: img.imagen,
                    principal: Boolean(img.principal),
                    orden: imageIndex + 1,
                };
            }),
        }));

        formData.append("payload", JSON.stringify({
            producto: {
                ...(editing ? { id_producto: product.id_producto } : {}),
                nombre: datos.nombre.trim(),
                categoria_id: Number(datos.categoria_id),
                descripcion: datos.descripcion,
                precio: Number(datos.precio),
                estado: datos.estado,
                slug: datos.slug || slugify(datos.nombre),
            },
            variantes: variantsPayload,
        }));
        return formData;
    };

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        if (!validate()) {
            setTab(Object.keys(errors).some((key) => key.startsWith("variant") || key === "variantes") ? "variantes" : "datos");
            return;
        }
        setLoading(true);
        try {
            const { data } = await saveProductComplete(editing ? product.id_producto : null, buildFormData());
            if (onSaved) await onSaved(data);
            onClose();
        } catch (err) {
            console.error(err);
            const backend = err.response?.data;
            setError(backend?.detail || Object.entries(backend || {}).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ") || "No fue posible guardar el producto.");
        } finally {
            setLoading(false);
        }
    };

    const variantSummary = useMemo(() => variantes.map((v) => {
        const color = colores.find((c) => c.id_color === Number(v.color))?.nombre || "Sin color";
        const talla = tallas.find((t) => t.id_talla === Number(v.talla))?.nombre || "Sin talla";
        return `${color} / ${talla}`;
    }), [variantes, colores, tallas]);

    return (
        <div className="modal-overlay">
            <form className="product-form" onSubmit={submit} noValidate>
                <div className="modal-header">
                    <div><h2>{editing ? "Editar producto" : "Nuevo producto"}</h2><p>Guarda datos, variantes e imágenes como una sola operación.</p></div>
                    <button type="button" className="close-button" onClick={onClose} disabled={loading}><X size={20} /></button>
                </div>

                <div className="tabs">
                    <button type="button" className={tab === "datos" ? "tab active" : "tab"} onClick={() => setTab("datos")}>Datos</button>
                    <button type="button" className={tab === "variantes" ? "tab active" : "tab"} onClick={() => setTab("variantes")}>Variantes ({variantes.length})</button>
                    <button type="button" className={tab === "imagenes" ? "tab active" : "tab"} onClick={() => setTab("imagenes")}>Imágenes</button>
                </div>

                {error && <div className="form-error-banner"><span>{error}</span></div>}

                {tab === "datos" && (
                    <>
                        <div className="form-grid">
                            <div className="form-group"><label>Nombre</label><input name="nombre" value={datos.nombre} onChange={handleData} className={errors.nombre ? "input-error" : ""} placeholder="Nombre del producto" />{errors.nombre && <span className="error-text">{errors.nombre}</span>}</div>
                            <div className="form-group"><label>Categoría</label><select name="categoria_id" value={datos.categoria_id} onChange={handleData} className={errors.categoria_id ? "input-error" : ""}><option value="">Seleccione una categoría</option>{categories.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}</select>{errors.categoria_id && <span className="error-text">{errors.categoria_id}</span>}</div>
                            <div className="form-group"><label>Precio</label><input type="number" name="precio" min="0" step="0.01" value={datos.precio} onChange={handleData} className={errors.precio ? "input-error" : ""} />{errors.precio && <span className="error-text">{errors.precio}</span>}</div>
                            <div className="form-group"><label>Estado</label><select name="estado" value={datos.estado} onChange={handleData}><option value="activo">Activo</option><option value="inactivo">Inactivo</option><option value="archivado">Archivado</option></select></div>
                        </div>
                        <div className="form-group"><label>Descripción</label><textarea rows="4" name="descripcion" value={datos.descripcion} onChange={handleData} /></div>
                        <div className="form-group"><label>Slug</label><input value={datos.slug} readOnly /></div>
                        <div className="form-buttons"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button type="button" className="next-button" onClick={() => setTab("variantes")}>Siguiente: Variantes</button></div>
                    </>
                )}

                {tab === "variantes" && (
                    <>
                        <p className="tab-help">Cada variante combina color, talla, SKU, stock y hasta 3 imágenes.</p>
                        {errors.variantes && <div className="form-error-banner"><span>{errors.variantes}</span></div>}
                        {variantes.length === 0 ? <p className="empty-state">Aún no agregaste variantes.</p> : (
                            <table className="variants-table"><thead><tr><th>Color</th><th>Talla</th><th>SKU</th><th>Stock</th><th /></tr></thead><tbody>
                                {variantes.map((v, i) => <tr key={v.clientId}>
                                    <td><div className="select-with-add"><select value={v.color} onChange={(e) => updateVariant(i, "color", e.target.value)}><option value="">—</option>{colores.map((c) => <option key={c.id_color} value={c.id_color}>{c.nombre}</option>)}</select><button type="button" className="add-inline" onClick={addColor}>+</button></div>{errors[`variant-${i}-color`] && <span className="error-text">{errors[`variant-${i}-color`]}</span>}</td>
                                    <td><div className="select-with-add"><select value={v.talla} onChange={(e) => updateVariant(i, "talla", e.target.value)}><option value="">—</option>{tallas.map((t) => <option key={t.id_talla} value={t.id_talla}>{t.nombre}</option>)}</select><button type="button" className="add-inline" onClick={addTalla}>+</button></div>{errors[`variant-${i}-talla`] && <span className="error-text">{errors[`variant-${i}-talla`]}</span>}</td>
                                    <td><input value={v.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)} placeholder="SKU-001" />{errors[`variant-${i}-sku`] && <span className="error-text">{errors[`variant-${i}-sku`]}</span>}</td>
                                    <td><input type="number" min="0" value={v.stock} onChange={(e) => updateVariant(i, "stock", e.target.value)} />{errors[`variant-${i}-stock`] && <span className="error-text">{errors[`variant-${i}-stock`]}</span>}</td>
                                    <td><button type="button" className="delete-row" onClick={() => removeVariant(i)}><Trash2 size={16} /></button></td>
                                </tr>)}
                            </tbody></table>
                        )}
                        <button type="button" className="add-row" onClick={addVariant}><Plus size={16} />Agregar variante</button>
                        <div className="form-buttons"><button type="button" className="cancel-button" onClick={() => setTab("datos")}>Volver</button><button type="button" className="next-button" onClick={() => setTab("imagenes")}>Siguiente: Imágenes</button></div>
                    </>
                )}

                {tab === "imagenes" && (
                    <>
                        <p className="tab-help">Hasta 3 imágenes por variante. La primera queda como principal.</p>
                        {variantes.length === 0 ? <p className="empty-state">Primero agrega una variante.</p> : variantes.map((v, i) => <div className="image-section" key={v.clientId}>
                            <h4>Variante #{i + 1} — {variantSummary[i]}</h4>
                            {v.imagenes.length > 0 && <div className="image-grid">{v.imagenes.map((img, j) => <div className={`image-card${img.principal ? " image-card--principal" : ""}`} key={img.id_imagen || `${v.clientId}-${j}`}>
                                <img src={mediaUrl(img.imagen)} alt={`Imagen ${j + 1}`} />
                                {img.principal && <span className="principal-badge"><Star size={11} fill="currentColor" />Principal</span>}
                                <div className="image-card-actions"><button type="button" className={`star-button${img.principal ? " star-button--active" : ""}`} onClick={() => setPrincipal(i, j)}><Star size={14} fill={img.principal ? "currentColor" : "none"} /></button><button type="button" className="delete-button" onClick={() => removeImage(i, j)}><Trash2 size={14} /></button></div>
                            </div>)}</div>}
                            {errors[`variant-${i}-images`] && <span className="error-text">{errors[`variant-${i}-images`]}</span>}
                            <div className="image-input">
                                <input type="file" accept="image/*" ref={(el) => { inputRefs.current[i] = el; }} onChange={(e) => addFile(i, e.target.files?.[0])} />
                                <span className="input-or">o</span>
                                <button type="button" onClick={() => addUrl(i)}><Plus size={16} />Agregar URL</button>
                            </div>
                        </div>)}
                        <div className="form-buttons"><button type="button" className="cancel-button" onClick={() => setTab("variantes")}>Volver</button><button type="submit" className="save-button" disabled={loading}>{loading ? "Guardando todo..." : editing ? "Guardar cambios" : "Guardar producto"}</button></div>
                    </>
                )}
            </form>
        </div>
    );
}

export default ProductForm;
