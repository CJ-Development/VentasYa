import { useEffect, useMemo, useState } from "react";
import {
    X,
    Plus,
    Trash2,
    Upload,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import "./ProductForm.css";

import {
    getCategories,
    getColors,
    crearProductoCompleto,
    updateProduct,
} from "../../../services/adminService";

const MAX_IMAGES = 3;

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Única"];

const INITIAL_FORM = {
    nombre: "",
    categoria_id: "",
    descripcion: "",
    precio: "",
    estado: "activo",
    variantes: [],
};

const newVariant = () => ({
    id: crypto.randomUUID(),
    color_id: "",
    tallas: [],
    imagenes: [],
});

const newSize = (talla) => ({
    id: crypto.randomUUID(),
    talla,
    stock: 0,
    sku: "",
});

const DIACRITICS = /[̀-ͯ]/g;

const slugify = (text) =>
    text
        .toLowerCase()
        .normalize("NFD")
        .replace(DIACRITICS, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50);

const generateSku = (name, color, size) => {
    const product = slugify(name)
        .replace(/-/g, "")
        .slice(0, 8)
        .toUpperCase();

    const colorCode =
        color?.nombre
            ?.normalize("NFD")
            .replace(DIACRITICS, "")
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(0, 4)
            .toUpperCase() || "CLR";

    const sizeCode = String(size || "UNI")
        .replace(/\s/g, "")
        .toUpperCase();

    return `${product}-${colorCode}-${sizeCode}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;
};

const buildVariantesFromProduct = (product) => {
    if (!product?.color_variants) return [];

    return product.color_variants.map((variant) => ({
        id: crypto.randomUUID(),
        color_id: variant.color?.id_color ?? "",
        tallas: (variant.size_variants || []).map((size) => ({
            id: crypto.randomUUID(),
            talla: size.talla || "",
            stock: size.stock ?? 0,
            sku: size.sku || "",
        })),
        imagenes: (variant.imagenes || []).map((image) => ({
            id: crypto.randomUUID(),
            file: null,
            preview: image.imagen,
            principal: !!image.principal,
            existing: true,
        })),
    }));
};

function ProductForm({ product, onClose, onSaved }) {
    const isEdit = Boolean(product?.id_producto);

    const [form, setForm] = useState(INITIAL_FORM);
    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [errors, setErrors] = useState({});

    const slug = useMemo(() => slugify(form.nombre), [form.nombre]);

    async function loadInitialData() {
        try {
            const [categoriesResponse, colorsResponse] = await Promise.all([
                getCategories(),
                getColors(),
            ]);

            setCategories(categoriesResponse.data || []);
            setColors(colorsResponse.data || []);

            if (isEdit && product) {
                setForm({
                    nombre: product.nombre || "",
                    categoria_id: product.categoria?.id_categoria ?? "",
                    descripcion: product.descripcion || "",
                    precio: product.precio ?? "",
                    estado: product.estado || "activo",
                    variantes: buildVariantesFromProduct(product),
                });
            }
        } catch (err) {
            console.error(err);
            setError("No fue posible cargar categorías y colores.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const run = async () => {
            await loadInitialData();
        };
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function updateField(field, value) {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: "",
        }));
    }

    function addColor() {
        setForm((prev) => ({
            ...prev,
            variantes: [...prev.variantes, newVariant()],
        }));
    }

    function removeColor(id) {
        setForm((prev) => ({
            ...prev,
            variantes: prev.variantes.filter((v) => v.id !== id),
        }));
    }

    function updateColor(variantId, colorId) {
        setForm((prev) => ({
            ...prev,
            variantes: prev.variantes.map((variant) =>
                variant.id === variantId
                    ? { ...variant, color_id: colorId }
                    : variant
            ),
        }));
    }

    function addSize(variantId, talla) {
        setForm((prev) => ({
            ...prev,
            variantes: prev.variantes.map((variant) => {
                if (variant.id !== variantId) return variant;

                if (variant.tallas.some((size) => size.talla === talla)) {
                    return variant;
                }

                const color = colors.find(
                    (item) =>
                        Number(item.id_color) === Number(variant.color_id)
                );

                const size = newSize(talla);

                size.sku = generateSku(
                    prev.nombre,
                    color,
                    talla
                );

                return {
                    ...variant,
                    tallas: [...variant.tallas, size],
                };
            }),
        }));
    }

    function removeSize(variantId, sizeId) {
        setForm((prev) => ({
            ...prev,
            variantes: prev.variantes.map((variant) =>
                variant.id === variantId
                    ? {
                          ...variant,
                          tallas: variant.tallas.filter(
                              (size) => size.id !== sizeId
                          ),
                      }
                    : variant
            ),
        }));
    }

    function updateSize(variantId, sizeId, field, value) {
        setForm((prev) => ({
            ...prev,
            variantes: prev.variantes.map((variant) =>
                variant.id === variantId
                    ? {
                          ...variant,
                          tallas: variant.tallas.map((size) =>
                              size.id === sizeId
                                  ? {
                                        ...size,
                                        [field]:
                                            field === "stock"
                                                ? Math.max(
                                                      0,
                                                      Number(value)
                                                  )
                                                : value,
                                    }
                                  : size
                          ),
                      }
                    : variant
            ),
        }));
    }

    function addImage(variantId, file) {
        if (!file) return;

        setForm((prev) => ({
            ...prev,
            variantes: prev.variantes.map((variant) => {
                if (variant.id !== variantId) return variant;

                if (variant.imagenes.length >= MAX_IMAGES) {
                    return variant;
                }

                return {
                    ...variant,
                    imagenes: [
                        ...variant.imagenes,
                        {
                            id: crypto.randomUUID(),
                            file,
                            preview: URL.createObjectURL(file),
                            principal:
                                variant.imagenes.length === 0,
                        },
                    ],
                };
            }),
        }));
    }

    function removeImage(variantId, imageId) {
        setForm((prev) => ({
            ...prev,
            variantes: prev.variantes.map((variant) => {
                if (variant.id !== variantId) return variant;

                const images = variant.imagenes.filter(
                    (image) => image.id !== imageId
                );

                if (
                    images.length > 0 &&
                    !images.some((image) => image.principal)
                ) {
                    images[0].principal = true;
                }

                return {
                    ...variant,
                    imagenes: images,
                };
            }),
        }));
    }

    function setPrincipal(variantId, imageId) {
        setForm((prev) => ({
            ...prev,
            variantes: prev.variantes.map((variant) =>
                variant.id === variantId
                    ? {
                          ...variant,
                          imagenes: variant.imagenes.map((image) => ({
                              ...image,
                              principal: image.id === imageId,
                          })),
                      }
                    : variant
            ),
        }));
    }

    function validateBasic() {
        const nextErrors = {};

        if (!form.nombre.trim()) {
            nextErrors.nombre = "El nombre es obligatorio.";
        }

        if (!form.categoria_id) {
            nextErrors.categoria_id = "Selecciona una categoría.";
        }

        if (!form.descripcion.trim()) {
            nextErrors.descripcion = "La descripción es obligatoria.";
        }

        if (!form.precio || Number(form.precio) <= 0) {
            nextErrors.precio = "El precio debe ser mayor que 0.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    function validateVariants() {
        const nextErrors = {};
        const usedColors = new Set();
        const usedSkus = new Set();

        if (!form.variantes.length) {
            nextErrors.general = "Agrega al menos un color.";
        }

        form.variantes.forEach((variant) => {
            if (!variant.color_id) {
                nextErrors[variant.id] = "Selecciona un color.";
                return;
            }

            if (usedColors.has(Number(variant.color_id))) {
                nextErrors[variant.id] = "Este color ya fue agregado.";
            }

            usedColors.add(Number(variant.color_id));

            if (!variant.tallas.length) {
                nextErrors[variant.id] = "Agrega al menos una talla.";
            }

            variant.tallas.forEach((size) => {
                if (!size.sku) {
                    nextErrors[size.id] = "El SKU es obligatorio.";
                }

                if (usedSkus.has(size.sku)) {
                    nextErrors[size.id] = "El SKU está repetido.";
                }

                usedSkus.add(size.sku);
            });
        });

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    function validateImages() {
        const nextErrors = {};

        form.variantes.forEach((variant) => {
            if (!variant.imagenes.length) {
                nextErrors[variant.id] =
                    "Cada color debe tener al menos una imagen.";
            }
        });

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    function nextStep() {
        setError("");

        if (step === 1 && validateBasic()) {
            setStep(2);
        } else if (step === 2 && validateVariants()) {
            setStep(3);
        }
    }

    function previousStep() {
        setError("");
        setStep((current) => Math.max(1, current - 1));
    }

    function buildPayload() {
        return {
            nombre: form.nombre.trim(),
            slug,
            categoria_id: Number(form.categoria_id),
            descripcion: form.descripcion.trim(),
            precio: Number(form.precio),
            estado: form.estado,
            variantes: form.variantes.map((variant) => ({
                color_id: Number(variant.color_id),
                tallas: variant.tallas.map((size) => ({
                    talla: size.talla,
                    stock: Number(size.stock),
                    sku: size.sku,
                })),
            })),
        };
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (!validateBasic()) {
            setStep(1);
            return;
        }

        if (!validateVariants()) {
            setStep(2);
            return;
        }

        if (!validateImages()) {
            setStep(3);
            return;
        }

        setSaving(true);

        try {
            if (isEdit) {
                const payload = {
                    nombre: form.nombre.trim(),
                    slug,
                    categoria_id: Number(form.categoria_id),
                    descripcion: form.descripcion.trim(),
                    precio: Number(form.precio),
                    estado: form.estado,
                };

                await updateProduct(product.id_producto, payload);

                if (onSaved) {
                    await onSaved();
                }

                onClose();
                return;
            }

            const payload = buildPayload();
            const formData = new FormData();

            formData.append(
                "data",
                JSON.stringify(payload)
            );

            form.variantes.forEach((variant, variantIndex) => {
                variant.imagenes.forEach((image, imageIndex) => {
                    if (image.file) {
                        formData.append(
                            `imagen_${variantIndex}_${imageIndex}`,
                            image.file
                        );
                    }
                });
            });

            await crearProductoCompleto(formData);

            if (onSaved) {
                await onSaved();
            }

            onClose();
        } catch (err) {
            console.error("Error creando producto:", err);

            const data = err?.response?.data;

            if (data?.detail) {
                setError(data.detail);
            } else if (typeof data === "object") {
                setError(
                    "No fue posible crear el producto. Revisa los datos enviados."
                );
            } else {
                setError("No fue posible conectar con el servidor.");
            }
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="product-form-loading">
                    Cargando formulario...
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <form
                className="product-form"
                onSubmit={handleSubmit}
                noValidate
            >
                <header className="product-form-header">
                    <div>
                        <h2>
                            {isEdit ? "Editar producto" : "Nuevo producto"}
                        </h2>
                        <p>
                            {isEdit
                                ? "Modifica la información del producto."
                                : "Crea el producto, sus variantes e imágenes."}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="product-form-close"
                        onClick={onClose}
                        disabled={saving}
                    >
                        <X size={20} />
                    </button>
                </header>

                <nav className="product-form-tabs">
                    {["Datos", "Variantes", "Imágenes"].map(
                        (label, index) => (
                            <button
                                key={label}
                                type="button"
                                className={step === index + 1 ? "active" : ""}
                                onClick={() => {
                                    if (index + 1 === 1) setStep(1);

                                    if (
                                        index + 1 === 2 &&
                                        validateBasic()
                                    ) {
                                        setStep(2);
                                    }

                                    if (
                                        index + 1 === 3 &&
                                        validateBasic() &&
                                        validateVariants()
                                    ) {
                                        setStep(3);
                                    }
                                }}
                            >
                                {index + 1}. {label}
                            </button>
                        )
                    )}
                </nav>

                {error && (
                    <div className="product-form-error">
                        {error}
                    </div>
                )}

                <div className="product-form-body">
                    {step === 1 && (
                        <section className="form-step">
                            <div className="form-section-title">
                                <h3>Información básica</h3>
                                <p>
                                    Datos generales del producto.
                                </p>
                            </div>

                            <div className="form-grid">
                                <Field
                                    label="Nombre"
                                    error={errors.nombre}
                                    full
                                >
                                    <input
                                        value={form.nombre}
                                        onChange={(e) =>
                                            updateField(
                                                "nombre",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Ej. Camiseta Oversize"
                                    />
                                </Field>

                                <Field
                                    label="Categoría"
                                    error={errors.categoria_id}
                                >
                                    <select
                                        value={form.categoria_id}
                                        onChange={(e) =>
                                            updateField(
                                                "categoria_id",
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="">
                                            Seleccionar categoría
                                        </option>

                                        {categories.map((category) => (
                                            <option
                                                key={category.id_categoria}
                                                value={category.id_categoria}
                                            >
                                                {category.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field
                                    label="Precio"
                                    error={errors.precio}
                                >
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.precio}
                                        onChange={(e) =>
                                            updateField(
                                                "precio",
                                                e.target.value
                                            )
                                        }
                                        placeholder="89900"
                                    />
                                </Field>

                                <Field
                                    label="Descripción"
                                    error={errors.descripcion}
                                    full
                                >
                                    <textarea
                                        rows="5"
                                        value={form.descripcion}
                                        onChange={(e) =>
                                            updateField(
                                                "descripcion",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Describe el producto..."
                                    />
                                </Field>

                                <Field label="Slug" full>
                                    <input value={slug} readOnly />
                                    <small>
                                        Se genera automáticamente.
                                    </small>
                                </Field>
                            </div>

                            <Navigation
                                next={nextStep}
                                saving={saving}
                            />
                        </section>
                    )}

                    {step === 2 && (
                        <section className="form-step">
                            <div className="form-section-title">
                                <div>
                                    <h3>Colores y tallas</h3>
                                    <p>
                                        Cada color puede tener sus propias
                                        tallas y stock.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={addColor}
                                >
                                    <Plus size={17} />
                                    Agregar color
                                </button>
                            </div>

                            {errors.general && (
                                <div className="variant-error">
                                    {errors.general}
                                </div>
                            )}

                            {!form.variantes.length ? (
                                <div className="empty-state">
                                    <p>
                                        Todavía no has agregado colores.
                                    </p>

                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={addColor}
                                    >
                                        <Plus size={17} />
                                        Agregar color
                                    </button>
                                </div>
                            ) : (
                                <div className="color-variants">
                                    {form.variantes.map(
                                        (variant, index) => {
                                            const color = colors.find(
                                                (item) =>
                                                    Number(item.id_color) ===
                                                    Number(variant.color_id)
                                            );

                                            return (
                                                <article
                                                    className="color-variant-card"
                                                    key={variant.id}
                                                >
                                                    <div className="color-variant-header">
                                                        <strong>
                                                            Color {index + 1}
                                                            {color &&
                                                                ` — ${color.nombre}`}
                                                        </strong>

                                                        <button
                                                            type="button"
                                                            className="icon-danger"
                                                            onClick={() =>
                                                                removeColor(
                                                                    variant.id
                                                                )
                                                            }
                                                        >
                                                            <Trash2 size={17} />
                                                        </button>
                                                    </div>

                                                    <div className="form-field">
                                                        <label>
                                                            Color
                                                        </label>

                                                        <select
                                                            value={
                                                                variant.color_id
                                                            }
                                                            onChange={(e) =>
                                                                updateColor(
                                                                    variant.id,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                        >
                                                            <option value="">
                                                                Seleccionar
                                                            </option>

                                                            {colors.map(
                                                                (color) => (
                                                                    <option
                                                                        key={
                                                                            color.id_color
                                                                        }
                                                                        value={
                                                                            color.id_color
                                                                        }
                                                                    >
                                                                        {
                                                                            color.nombre
                                                                        }
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    </div>

                                                    {errors[variant.id] && (
                                                        <div className="variant-error">
                                                            {
                                                                errors[
                                                                    variant.id
                                                                ]
                                                            }
                                                        </div>
                                                    )}

                                                    <div className="sizes-section">
                                                        <strong>
                                                            Tallas
                                                        </strong>

                                                        <div className="size-buttons">
                                                            {SIZES.map(
                                                                (size) => (
                                                                    <button
                                                                        key={
                                                                            size
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            addSize(
                                                                                variant.id,
                                                                                size
                                                                            )
                                                                        }
                                                                    >
                                                                        + {size}
                                                                    </button>
                                                                )
                                                            )}
                                                        </div>

                                                        {variant.tallas.map(
                                                            (size) => (
                                                                <div
                                                                    className="size-row"
                                                                    key={
                                                                        size.id
                                                                    }
                                                                >
                                                                    <span>
                                                                        {
                                                                            size.talla
                                                                        }
                                                                    </span>

                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={
                                                                            size.stock
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateSize(
                                                                                variant.id,
                                                                                size.id,
                                                                                "stock",
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                    />

                                                                    <input
                                                                        value={
                                                                            size.sku
                                                                        }
                                                                        readOnly
                                                                    />

                                                                    <button
                                                                        type="button"
                                                                        className="icon-danger"
                                                                        onClick={() =>
                                                                            removeSize(
                                                                                variant.id,
                                                                                size.id
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    </button>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </article>
                                            );
                                        }
                                    )}
                                </div>
                            )}

                            <Navigation
                                back={previousStep}
                                next={nextStep}
                                saving={saving}
                            />
                        </section>
                    )}

                    {step === 3 && (
                        <section className="form-step">
                            <div className="form-section-title">
                                <h3>Imágenes</h3>
                                <p>
                                    Máximo {MAX_IMAGES} imágenes por color.
                                </p>
                            </div>

                            <div className="image-variants">
                                {form.variantes.map((variant, index) => {
                                    const color = colors.find(
                                        (item) =>
                                            Number(item.id_color) ===
                                            Number(variant.color_id)
                                    );

                                    return (
                                        <article
                                            className="image-variant"
                                            key={variant.id}
                                        >
                                            <div className="image-variant-header">
                                                <strong>
                                                    {color?.nombre ||
                                                        `Color ${index + 1}`}
                                                </strong>

                                                <span>
                                                    {variant.imagenes.length}/
                                                    {MAX_IMAGES}
                                                </span>
                                            </div>

                                            <div className="image-grid">
                                                {variant.imagenes.map(
                                                    (image) => (
                                                        <div
                                                            className={
                                                                image.principal
                                                                    ? "image-item principal"
                                                                    : "image-item"
                                                            }
                                                            key={image.id}
                                                        >
                                                            <img
                                                                src={
                                                                    image.preview
                                                                }
                                                                alt={
                                                                    color?.nombre ||
                                                                    "Producto"
                                                                }
                                                            />

                                                            {image.principal && (
                                                                <span className="principal-badge">
                                                                    Principal
                                                                </span>
                                                            )}

                                                            <div className="image-actions">
                                                                {!image.principal && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setPrincipal(
                                                                                variant.id,
                                                                                image.id
                                                                            )
                                                                        }
                                                                    >
                                                                        Principal
                                                                    </button>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeImage(
                                                                            variant.id,
                                                                            image.id
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            15
                                                                        }
                                                                    />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                )}

                                                {variant.imagenes.length <
                                                    MAX_IMAGES && (
                                                    <label className="image-upload">
                                                        <Upload size={24} />

                                                        <span>
                                                            Agregar imagen
                                                        </span>

                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            hidden
                                                            onChange={(e) => {
                                                                addImage(
                                                                    variant.id,
                                                                    e.target
                                                                        .files?.[0]
                                                                );

                                                                e.target.value =
                                                                    "";
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            {errors &&
                                Object.keys(errors).some(
                                    (key) =>
                                        form.variantes.some(
                                            (variant) =>
                                                variant.id === key
                                        )
                                ) && (
                                    <div className="variant-error">
                                        Todos los colores deben tener al
                                        menos una imagen.
                                    </div>
                                )}

                            <Navigation
                                back={previousStep}
                                submit
                                saving={saving}
                                isEdit={isEdit}
                            />
                        </section>
                    )}
                </div>
            </form>
        </div>
    );
}

function Field({ label, error, full, children }) {
    return (
        <div className={`form-field ${full ? "full" : ""}`}>
            <label>{label}</label>
            {children}
            {error && <span className="field-error">{error}</span>}
        </div>
    );
}

function Navigation({ back, next, submit, saving, isEdit }) {
    const submitLabel = isEdit
        ? saving
            ? "Guardando..."
            : "Guardar cambios"
        : saving
            ? "Creando..."
            : "Crear producto";

    return (
        <div className="form-navigation">
            {back ? (
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={back}
                    disabled={saving}
                >
                    <ChevronLeft size={18} />
                    Atrás
                </button>
            ) : (
                <span />
            )}

            {submit ? (
                <button
                    type="submit"
                    className="btn-primary btn-save"
                    disabled={saving}
                >
                    {submitLabel}
                </button>
            ) : (
                <button
                    type="button"
                    className="btn-primary"
                    onClick={next}
                    disabled={saving}
                >
                    Siguiente
                    <ChevronRight size={18} />
                </button>
            )}
        </div>
    );
}

export default ProductForm;
