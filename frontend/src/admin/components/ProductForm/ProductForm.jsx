import "./ProductForm.css";

import { useEffect, useMemo, useRef, useState } from "react";

import {
    Plus,
    Star,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight,
    Tag,
    Info,
    ImagePlus
} from "lucide-react";

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


/* =========================================================
   HELPERS
   ========================================================= */

const slugify = (text) =>
    text
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");


const mediaUrl = (value) => {
    if (!value) return "";

    if (
        value.startsWith("blob:") ||
        value.startsWith("http://") ||
        value.startsWith("https://")
    ) {
        return value;
    }

    return `${API_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
};


/* =========================================================
   SKU AUTOMÁTICO
   Formato: <SLUG>-<COLOR_HEX_SHORT>-<TALLA_CODIGO>
   · SLUG: el slug del producto (o "PROD" si aún no existe)
   · COLOR_HEX_SHORT: últimos 3 chars del hex sin # (ej. B5)
   · TALLA_CODIGO: nombre de la talla en mayúsculas sin espacios
   ========================================================= */

const AUTO_SKU_PREFIX = "AUTO-";

const buildAutoSku = (slug, color, talla) => {
    const slugPart =
        (slug || "PROD")
            .toString()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 8) || "PROD";

    const hexPart = (
        (color?.codigo_hex || "000")
            .replace("#", "")
            .replace(/[^0-9A-Fa-f]/g, "")
            .slice(-3) || "000"
    ).toUpperCase();

    const sizePart = (
        (talla?.nombre || "")
            .toString()
            .toUpperCase()
            .replace(/\s+/g, "")
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 5) || "STD"
    );

    return `${AUTO_SKU_PREFIX}${slugPart}-${hexPart}-${sizePart}`;
};


const isAutoSku = (value) =>
    typeof value === "string" && value.startsWith(AUTO_SKU_PREFIX);


/* =========================================================
   VARIANTE VACÍA
   ========================================================= */

const emptyVariant = (color = "") => ({
    clientId: crypto.randomUUID(),
    id_variante: null,
    color,
    talla: "",
    sku: "",
    stock: 0,
    imagenes: [],
});


/* =========================================================
   PRODUCTO
   ========================================================= */

const normalizeProduct = (product) => ({
    nombre: product?.nombre || "",
    categoria_id:
        product?.categoria?.id_categoria ??
        product?.categoria_id ??
        "",
    descripcion: product?.descripcion || "",
    precio: product?.precio ?? "",
    estado: product?.estado || "activo",
    slug: product?.slug || "",
});


/* =========================================================
   VARIANTES
   ========================================================= */

const normalizeVariants = (product) => {

    const variants = (product?.variantes || []).map((v) => ({
        clientId: crypto.randomUUID(),

        id_variante: v.id_variante,

        color:
            v.color?.id_color ??
            v.color ??
            "",

        talla:
            v.talla?.id_talla ??
            v.talla ??
            "",

        sku: v.sku || "",

        stock: v.stock ?? 0,

        imagenes: (v.imagenes || []).map((img) => ({
            id_imagen: img.id_imagen,
            imagen: img.imagen,
            principal: Boolean(img.principal),
            orden: img.orden,
        })),
    }));

    /*
     * Si el producto nuevo todavía no tiene variantes,
     * dejamos una fila vacía para comenzar.
     */
    if (!variants.length) {
        return [emptyVariant()];
    }

    return variants;
};


/* =========================================================
   COMPONENTE
   ========================================================= */

function ProductForm({
    product,
    onClose,
    onSaved
}) {

    const editing = Boolean(product?.id_producto);

    const [tab, setTab] = useState("datos");

    const [datos, setDatos] = useState(
        () => normalizeProduct(product)
    );

    const [variantes, setVariantes] = useState(
        () => normalizeVariants(product)
    );

    const [selectedColor, setSelectedColor] = useState(
        () => {
            const first =
                normalizeVariants(product)[0];

            return first?.color || "";
        }
    );

    const [categories, setCategories] = useState([]);

    const [colores, setColores] = useState([]);

    const [tallas, setTallas] = useState([]);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [errors, setErrors] = useState({});

    const inputRefs = useRef({});

    /* =====================================================
       FORMULARIOS INLINE PARA CREAR COLOR / TALLA
       ===================================================== */

    const [newColorForm, setNewColorForm] = useState({
        open: false,
        nombre: "",
        codigo_hex: "#0EA5B5",
        submitting: false,
    });

    const [newTallaForm, setNewTallaForm] = useState({
        open: false,
        nombre: "",
        submitting: false,
    });


    /* =====================================================
       CARGAR CATÁLOGOS
       ===================================================== */

    useEffect(() => {

        let alive = true;

        Promise.all([
            getCategories(),
            getColors(),
            getTallas()
        ])
            .then(([cats, cols, sizes]) => {

                if (!alive) return;

                setCategories(cats.data || []);
                setColores(cols.data || []);
                setTallas(sizes.data || []);

            })
            .catch((err) => {

                console.error(err);

                if (alive) {
                    setError(
                        "No fue posible cargar categorías, colores y tallas."
                    );
                }

            });

        return () => {
            alive = false;
        };

    }, []);


    /* =====================================================
       SI LLEGAN COLORES Y TODAVÍA NO HAY SELECCIÓN
       ===================================================== */

    useEffect(() => {

        if (
            !selectedColor &&
            colores.length > 0 &&
            variantes.length > 0
        ) {

            const existingColor =
                variantes.find((v) => v.color)?.color;

            if (existingColor) {
                setSelectedColor(existingColor);
            }

        }

    }, [
        colores,
        variantes,
        selectedColor
    ]);


    /* =====================================================
       DATOS
       ===================================================== */

    const handleData = (event) => {

        const {
            name,
            value
        } = event.target;

        setDatos((prev) => ({
            ...prev,
            [name]: value,

            ...(name === "nombre"
                ? {
                    slug: slugify(value)
                }
                : {})
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: ""
        }));

    };


    /* =====================================================
       INFORMACIÓN DEL COLOR
       ===================================================== */

    const getColorInfo = (colorId) => {

        return colores.find(
            (color) =>
                color.id_color === Number(colorId)
        );

    };


    /* =====================================================
       COLORES QUE REALMENTE TIENE EL PRODUCTO
       ===================================================== */

    const productColors = useMemo(() => {

        const ids = [];

        variantes.forEach((variant) => {

            if (
                variant.color &&
                !ids.includes(Number(variant.color))
            ) {
                ids.push(Number(variant.color));
            }

        });

        return ids;

    }, [variantes]);


    /* =====================================================
       VARIANTES DEL COLOR SELECCIONADO
       ===================================================== */

    const selectedColorVariants = useMemo(() => {

        if (!selectedColor) {
            return [];
        }

        return variantes.filter(
            (variant) =>
                Number(variant.color) ===
                Number(selectedColor)
        );

    }, [
        variantes,
        selectedColor
    ]);


    /* =====================================================
       QUITAR COLOR DEL PRODUCTO
       ===================================================== */

    const removeColor = (colorId) => {

        const normalizedId = Number(colorId);

        setVariantes((prev) =>
            prev.filter(
                (variant) =>
                    Number(variant.color) !== normalizedId
            )
        );

        if (
            Number(selectedColor) === normalizedId
        ) {
            setSelectedColor("");
        }

    };


    /* =====================================================
       SELECCIONAR COLOR
       ===================================================== */

    const selectColor = (colorId) => {

        const normalizedId = String(colorId);

        setSelectedColor(normalizedId);

        /*
         * Si todavía existe una variante sin color,
         * aprovechamos esa fila.
         */
        const emptyIndex =
            variantes.findIndex(
                (variant) => !variant.color
            );

        const alreadyExists =
            variantes.some(
                (variant) =>
                    Number(variant.color) ===
                    Number(normalizedId)
            );

        if (
            emptyIndex !== -1 &&
            !alreadyExists
        ) {

            setVariantes((prev) =>
                prev.map((variant, index) =>
                    index === emptyIndex
                        ? {
                            ...variant,
                            color: normalizedId
                        }
                        : variant
                )
            );

            return;
        }

        /*
         * Si el color no existe todavía,
         * creamos la primera talla vacía.
         */
        if (!alreadyExists) {

            setVariantes((prev) => [
                ...prev,
                emptyVariant(normalizedId)
            ]);

        }

    };


    /* =====================================================
       AGREGAR COLOR (inline con color picker)
       ===================================================== */

    const openNewColorForm = () => {
        setError("");
        setNewColorForm({
            open: true,
            nombre: "",
            codigo_hex: "#0EA5B5",
            submitting: false,
        });
    };

    const closeNewColorForm = () => {
        setNewColorForm({
            open: false,
            nombre: "",
            codigo_hex: "#0EA5B5",
            submitting: false,
        });
    };

    const submitNewColor = async (event) => {
        if (event) event.preventDefault();

        const nombre = newColorForm.nombre.trim();

        if (!nombre) return;

        setNewColorForm((prev) => ({
            ...prev,
            submitting: true,
        }));

        try {

            const {
                data
            } = await createColor({
                nombre,
                codigo_hex: newColorForm.codigo_hex || "#0EA5B5",
            });

            setColores((prev) => [
                ...prev,
                data
            ]);

            const newVariant =
                emptyVariant(
                    String(data.id_color)
                );

            setVariantes((prev) => [
                ...prev,
                newVariant
            ]);

            setSelectedColor(
                String(data.id_color)
            );

            closeNewColorForm();

        } catch (err) {

            console.error(err);

            setError(
                "No se pudo crear el color."
            );

            setNewColorForm((prev) => ({
                ...prev,
                submitting: false,
            }));

        }

    };


    /* =====================================================
       AGREGAR TALLA
       ===================================================== */

    const addSizeRow = () => {

        if (!selectedColor) {

            setError(
                "Primero selecciona un color."
            );

            return;
        }

        setError("");

        setVariantes((prev) => [
            ...prev,
            emptyVariant(
                String(selectedColor)
            )
        ]);

    };


    /* =====================================================
       CREAR TALLA INLINE
       ===================================================== */

    const openNewTallaForm = () => {

        if (!selectedColor) {
            setError(
                "Primero selecciona un color."
            );
            return;
        }

        setError("");

        setNewTallaForm({
            open: true,
            nombre: "",
            submitting: false,
        });
    };

    const closeNewTallaForm = () => {
        setNewTallaForm({
            open: false,
            nombre: "",
            submitting: false,
        });
    };

    const submitNewTalla = async (event) => {
        if (event) event.preventDefault();

        const nombre = newTallaForm.nombre.trim();

        if (!nombre) return;

        setNewTallaForm((prev) => ({
            ...prev,
            submitting: true,
        }));

        try {

            const {
                data
            } = await createTalla({
                nombre,
            });

            setTallas((prev) => [
                ...prev,
                data
            ]);

            setVariantes((prev) => [
                ...prev,
                {
                    ...emptyVariant(
                        String(selectedColor)
                    ),
                    talla: String(data.id_talla),
                }
            ]);

            closeNewTallaForm();

        } catch (err) {

            console.error(err);

            setError(
                "No se pudo crear la talla."
            );

            setNewTallaForm((prev) => ({
                ...prev,
                submitting: false,
            }));

        }

    };


    /* =====================================================
       ACTUALIZAR VARIANTE
       Si cambia el color o la talla y el SKU actual es
       automático (o está vacío), se regenera solo.
       ===================================================== */

    const updateVariant = (
        clientId,
        field,
        value
    ) => {

        setVariantes((prev) =>
            prev.map((variant) => {

                if (variant.clientId !== clientId) {
                    return variant;
                }

                const next = {
                    ...variant,
                    [field]: value,
                };

                const shouldAutoRegenerate =
                    (field === "color" || field === "talla") &&
                    (isAutoSku(variant.sku) ||
                        !variant.sku.trim());

                if (shouldAutoRegenerate) {

                    const colorId =
                        field === "color"
                            ? value
                            : variant.color;

                    const tallaId =
                        field === "talla"
                            ? value
                            : variant.talla;

                    const colorInfo =
                        colores.find(
                            (c) =>
                                Number(c.id_color) ===
                                Number(colorId)
                        );

                    const tallaInfo =
                        tallas.find(
                            (t) =>
                                Number(t.id_talla) ===
                                Number(tallaId)
                        );

                    if (colorInfo && tallaInfo) {

                        next.sku = buildAutoSku(
                            datos.slug,
                            colorInfo,
                            tallaInfo
                        );

                    }

                }

                return next;

            })
        );

        setErrors((prev) => ({
            ...prev,
            [field]: ""
        }));

    };


    /* =====================================================
       ELIMINAR TALLA
       ===================================================== */

    const removeVariant = (clientId) => {

        setVariantes((prev) =>
            prev.filter(
                (variant) =>
                    variant.clientId !== clientId
            )
        );

    };


    /* =====================================================
       IMÁGENES
       ===================================================== */

    /*
     * Las imágenes de un color viven en la PRIMERA variante
     * de ese color (representante del color). Esta función
     * devuelve siempre el índice de esa variante dentro de
     * `variantes`, o -1 si el color no existe.
     */

    const getColorVariantIndex = (colorId) =>
        variantes.findIndex(
            (variant) =>
                Number(variant.color) ===
                Number(colorId)
        );

    const addFile = (
        colorId,
        file
    ) => {

        if (!file) return;

        if (!file.type.startsWith("image/")) {

            setError(
                "Solo se permiten archivos de imagen."
            );

            return;
        }

        setError("");

        const variantIndex = getColorVariantIndex(colorId);

        if (variantIndex === -1) {
            return;
        }

        setVariantes((prev) =>
            prev.map((variant, index) => {

                if (
                    index !== variantIndex ||
                    variant.imagenes.length >= MAX_IMAGES
                ) {
                    return variant;
                }

                return {
                    ...variant,

                    imagenes: [
                        ...variant.imagenes,
                        {
                            imagen:
                                URL.createObjectURL(file),

                            principal:
                                variant.imagenes.length === 0,

                            orden:
                                variant.imagenes.length + 1,

                            file
                        }
                    ]
                };

            })
        );

        const inputKey = `color-${colorId}`;

        if (inputRefs.current[inputKey]) {
            inputRefs.current[inputKey].value = "";
        }

    };


    /* =====================================================
       URL
       ===================================================== */

    const addUrl = (colorId) => {

        const variantIndex = getColorVariantIndex(colorId);

        if (variantIndex === -1) {
            return;
        }

        if (
            variantes[variantIndex].imagenes.length >=
            MAX_IMAGES
        ) {

            setError(
                `Máximo ${MAX_IMAGES} imágenes por color.`
            );

            return;
        }

        const url =
            window.prompt(
                "URL de la imagen:"
            );

        if (!url?.trim()) return;

        setVariantes((prev) =>
            prev.map((variant, index) =>
                index === variantIndex
                    ? {
                        ...variant,

                        imagenes: [
                            ...variant.imagenes,
                            {
                                imagen:
                                    url.trim(),

                                principal:
                                    variant.imagenes.length === 0,

                                orden:
                                    variant.imagenes.length + 1
                            }
                        ]
                    }
                    : variant
            )
        );

    };


    /* =====================================================
       ELIMINAR IMAGEN
       ===================================================== */

    const removeImage = (
        colorId,
        imageIndex
    ) => {

        setVariantes((prev) => {

            const targetIndex = prev.findIndex(
                (variant) =>
                    Number(variant.color) ===
                    Number(colorId)
            );

            if (targetIndex === -1) {
                return prev;
            }

            return prev.map((variant, index) => {

                if (index !== targetIndex) {
                    return variant;
                }

                return {
                    ...variant,

                    imagenes:
                        variant.imagenes
                            .filter(
                                (_, j) =>
                                    j !== imageIndex
                            )
                            .map(
                                (img, j) => ({
                                    ...img,

                                    orden:
                                        j + 1,

                                    principal:
                                        j === 0
                                })
                            )
                };

            });

        });

    };


    /* =====================================================
       PRINCIPAL
       Buscamos la primera variante que tenga el color dado
       (más robusto que pasar índices, que se invalidan
       cuando el array cambia de referencias).
       ===================================================== */

    const setPrincipal = (
        colorId,
        imageIndex
    ) => {

        setVariantes((prev) => {

            const targetIndex = prev.findIndex(
                (variant) =>
                    Number(variant.color) ===
                    Number(colorId)
            );

            if (targetIndex === -1) {
                return prev;
            }

            return prev.map(
                (variant, index) => {

                    if (index !== targetIndex) {
                        return variant;
                    }

                    return {
                        ...variant,

                        imagenes:
                            variant.imagenes.map(
                                (img, j) => ({
                                    ...img,

                                    principal:
                                        j === imageIndex
                                })
                            )
                    };

                }
            );

        });

    };


    /* =====================================================
       VALIDAR
       ===================================================== */

    const validate = () => {

        const next = {};

        if (!datos.nombre.trim()) {
            next.nombre =
                "El nombre es obligatorio.";
        }

        if (!datos.categoria_id) {
            next.categoria_id =
                "Selecciona una categoría.";
        }

        if (
            datos.precio === "" ||
            Number(datos.precio) <= 0
        ) {
            next.precio =
                "Ingresa un precio mayor a 0.";
        }

        if (!variantes.length) {

            next.variantes =
                "Agrega al menos una talla.";

        }

        const skus = new Set();

        variantes.forEach((variant) => {

            if (!variant.color) {
                next.color =
                    "Selecciona el color de la prenda.";
            }

            if (!variant.talla) {
                next[
                    `variant-${variant.clientId}-talla`
                ] =
                    "Selecciona una talla.";
            }

            if (!variant.sku.trim()) {

                next[
                    `variant-${variant.clientId}-sku`
                ] =
                    "El SKU es obligatorio.";

            } else if (
                isAutoSku(variant.sku) &&
                variant.color &&
                variant.talla
            ) {

                /*
                 * SKU autogenerado y todavía con color/talla:
                 * el sistema lo regenerará antes de enviar.
                 * Permitimos pasar la validación.
                 */
                skus.add(
                    variant.sku.trim()
                );

            } else if (
                skus.has(
                    variant.sku.trim()
                )
            ) {

                next[
                    `variant-${variant.clientId}-sku`
                ] =
                    "SKU repetido.";

            } else {

                skus.add(
                    variant.sku.trim()
                );

            }

            if (
                variant.stock === "" ||
                Number(variant.stock) < 0
            ) {

                next[
                    `variant-${variant.clientId}-stock`
                ] =
                    "Stock inválido.";

            }

        });

        setErrors(next);

        return Object.keys(next).length === 0;

    };


    /* =====================================================
       FORM DATA
       ===================================================== */

    const buildFormData = () => {

        const formData =
            new FormData();

        const variantsPayload =
            variantes.map(
                (
                    variant,
                    variantIndex
                ) => {

                    /*
                     * Si el SKU sigue marcado como AUTO y ya
                     * hay color + talla elegidos, lo regeneramos
                     * con datos reales antes de enviar al backend.
                     */
                    let finalSku =
                        variant.sku.trim();

                    if (
                        isAutoSku(finalSku) ||
                        !finalSku
                    ) {

                        const colorInfo =
                            colores.find(
                                (c) =>
                                    Number(c.id_color) ===
                                    Number(variant.color)
                            );

                        const tallaInfo =
                            tallas.find(
                                (t) =>
                                    Number(t.id_talla) ===
                                    Number(variant.talla)
                            );

                        if (colorInfo && tallaInfo) {
                            finalSku = buildAutoSku(
                                datos.slug,
                                colorInfo,
                                tallaInfo
                            );
                        }

                    }

                    return {

                    ...(variant.id_variante
                        ? {
                            id_variante:
                                variant.id_variante
                        }
                        : {}),

                    color:
                        Number(
                            variant.color
                        ),

                    talla:
                        Number(
                            variant.talla
                        ),

                    sku: finalSku,

                    stock:
                        Number(
                            variant.stock
                        ),

                    imagenes:
                        variant.imagenes.map(
                            (
                                img,
                                imageIndex
                            ) => {

                                if (img.file) {

                                    const fileKey =
                                        `variant_${variantIndex}_image_${imageIndex}`;

                                    formData.append(
                                        fileKey,
                                        img.file,
                                        img.file.name
                                    );

                                    return {
                                        principal:
                                            Boolean(
                                                img.principal
                                            ),

                                        orden:
                                            imageIndex + 1,

                                        file_key:
                                            fileKey
                                    };

                                }

                                return {

                                    ...(img.id_imagen
                                        ? {
                                            id_imagen:
                                                img.id_imagen
                                        }
                                        : {}),

                                    imagen:
                                        img.imagen,

                                    principal:
                                        Boolean(
                                            img.principal
                                        ),

                                    orden:
                                        imageIndex + 1
                                };

                            }
                        )

                    };

                }
            );


        formData.append(
            "payload",
            JSON.stringify({

                producto: {

                    ...(editing
                        ? {
                            id_producto:
                                product.id_producto
                        }
                        : {}),

                    nombre:
                        datos.nombre.trim(),

                    categoria_id:
                        Number(
                            datos.categoria_id
                        ),

                    descripcion:
                        datos.descripcion,

                    precio:
                        Number(
                            datos.precio
                        ),

                    estado:
                        datos.estado,

                    slug:
                        datos.slug ||
                        slugify(
                            datos.nombre
                        )
                },

                variantes:
                    variantsPayload

            })
        );

        return formData;

    };


    /* =====================================================
       GUARDAR
       ===================================================== */

    const submit = async (event) => {

        event.preventDefault();

        setError("");

        if (!validate()) {

            if (
                errors.nombre ||
                errors.categoria_id ||
                errors.precio
            ) {
                setTab("datos");
            } else {
                setTab("variantes");
            }

            return;
        }

        setLoading(true);

        try {

            const {
                data
            } = await saveProductComplete(
                editing
                    ? product.id_producto
                    : null,
                buildFormData()
            );

            if (onSaved) {
                await onSaved(data);
            }

            onClose();

        } catch (err) {

            console.error("Error completo:", err);
            console.error("Respuesta del backend:", err.response?.data);
            console.error("Status:", err.response?.status);
            console.error("Headers:", err.response?.headers);

            const backend =
                err.response?.data;

            setError(
                backend?.detail ||
                Object.entries(
                    backend || {}
                )
                    .map(
                        ([key, value]) =>
                            `${key}: ${
                                Array.isArray(value)
                                    ? value.join(", ")
                                    : value
                            }`
                    )
                    .join(" | ") ||
                "No fue posible guardar el producto."
            );

        } finally {

            setLoading(false);

        }

    };


    /* =====================================================
       INFORMACIÓN DEL COLOR SELECCIONADO
       ===================================================== */

    const selectedColorInfo =
        getColorInfo(
            selectedColor
        );


    /* =====================================================
       TALLAS DEL COLOR
       ===================================================== */

    const selectedSizes =
        selectedColorVariants;


    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="product-page">

            <form
                className="product-form"
                onSubmit={submit}
                noValidate
            >

                {/* =================================================
                   HEADER
                   ================================================= */}

                <div className="product-header">

                    <div>

                        <h2>
                            {editing
                                ? "Editar producto"
                                : "Nuevo producto"
                            }
                        </h2>

                        <p>
                            Completa la información para publicar un nuevo producto en VentasYa.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="close-button"
                        onClick={onClose}
                        disabled={loading}
                    >
                        <X size={22} />
                    </button>

                </div>


                {/* =================================================
                   PASOS
                   ================================================= */}

                <div className="stepper">

                    <button
                        type="button"
                        className={
                            tab === "datos"
                                ? "step active"
                                : "step completed"
                        }
                        onClick={() =>
                            setTab("datos")
                        }
                    >

                        <span className="step-number">
                            {tab === "datos"
                                ? "1"
                                : "✓"}
                        </span>

                        <div>

                            <strong>
                                Información
                            </strong>

                            <small>
                                Datos generales
                            </small>

                        </div>

                    </button>


                    <div className="step-line" />


                    <button
                        type="button"
                        className={
                            tab === "variantes"
                                ? "step active"
                                : "step"
                        }
                        onClick={() =>
                            setTab("variantes")
                        }
                    >

                        <span className="step-number">
                            2
                        </span>

                        <div>

                            <strong>
                                Variantes
                            </strong>

                            <small>
                                Color, tallas y stock
                            </small>

                        </div>

                    </button>


                    <div className="step-line" />


                    <button
                        type="button"
                        className={
                            tab === "imagenes"
                                ? "step active"
                                : "step"
                        }
                        onClick={() =>
                            setTab("imagenes")
                        }
                    >

                        <span className="step-number">
                            3
                        </span>

                        <div>

                            <strong>
                                Imágenes
                            </strong>

                            <small>
                                Fotos del producto
                            </small>

                        </div>

                    </button>

                </div>


                {error && (

                    <div className="form-error-banner">
                        {error}
                    </div>

                )}


                {/* =================================================
                   PASO 1
                   ================================================= */}

                {tab === "datos" && (

                    <section className="step-content">

                        <div className="section-heading">

                            <div className="section-icon">
                                <Info size={22} />
                            </div>

                            <div>

                                <h3>
                                    Información del producto
                                </h3>

                                <p>
                                    Completa los datos generales del producto.
                                </p>

                            </div>

                        </div>


                        <div className="form-grid">

                            <div className="form-group">

                                <label>
                                    Nombre del producto
                                </label>

                                <input
                                    name="nombre"
                                    value={datos.nombre}
                                    onChange={handleData}
                                    placeholder="Ej. Camiseta Oversize Premium"
                                />

                                {errors.nombre && (
                                    <span className="error-text">
                                        {errors.nombre}
                                    </span>
                                )}

                            </div>


                            <div className="form-group">

                                <label>
                                    Categoría
                                </label>

                                <select
                                    name="categoria_id"
                                    value={datos.categoria_id}
                                    onChange={handleData}
                                >

                                    <option value="">
                                        Seleccionar
                                    </option>

                                    {categories.map(
                                        (category) => (

                                            <option
                                                key={
                                                    category.id_categoria
                                                }
                                                value={
                                                    category.id_categoria
                                                }
                                            >
                                                {category.nombre}
                                            </option>

                                        )
                                    )}

                                </select>

                                {errors.categoria_id && (
                                    <span className="error-text">
                                        {errors.categoria_id}
                                    </span>
                                )}

                            </div>


                            <div className="form-group">

                                <label>
                                    Precio
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="precio"
                                    value={datos.precio}
                                    onChange={handleData}
                                    placeholder="0"
                                />

                                {errors.precio && (
                                    <span className="error-text">
                                        {errors.precio}
                                    </span>
                                )}

                            </div>


                            <div className="form-group">

                                <label>
                                    Estado
                                </label>

                                <select
                                    name="estado"
                                    value={datos.estado}
                                    onChange={handleData}
                                >

                                    <option value="activo">
                                        Activo
                                    </option>

                                    <option value="inactivo">
                                        Inactivo
                                    </option>

                                    <option value="archivado">
                                        Archivado
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
                                value={datos.descripcion}
                                onChange={handleData}
                                placeholder="Describe las características del producto..."
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Slug
                            </label>

                            <input
                                value={datos.slug}
                                readOnly
                            />

                        </div>


                        <div className="bottom-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={onClose}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="primary-button"
                                onClick={() =>
                                    setTab("variantes")
                                }
                            >
                                Siguiente: Variantes
                                <ChevronRight size={18} />
                            </button>

                        </div>

                    </section>

                )}


                {/* =================================================
                   PASO 2 — VARIANTES
                   ================================================= */}

                {tab === "variantes" && (

                    <section className="step-content">

                        <div className="section-heading">

                            <div className="section-icon">
                                <Tag size={22} />
                            </div>

                            <div>

                                <h3>
                                    Variantes del producto
                                </h3>

                                <p>
                                    Configura las combinaciones disponibles para el producto.
                                </p>

                            </div>

                        </div>


                        {/* =================================================
                           INFORMACIÓN
                           ================================================= */}

                        <div className="info-banner">

                            <Info size={19} />

                            <div>

                                <strong>
                                    Configura las variantes del producto
                                </strong>

                                <p>
                                    Cada combinación de color y talla tendrá su propio stock y SKU.
                                </p>

                            </div>

                        </div>


                        {/* =================================================
                           CONTENEDOR PRINCIPAL
                           ================================================= */}

                        <div className="variants-layout">

                            {/* =================================================
                               IZQUIERDA
                               ================================================= */}

                            <div className="variants-main">


                                {/* ================================
                                   COLORES
                                   ================================ */}

                                <div className="colors-section">

                                    <div className="section-top">

                                        <div>

                                            <h4>
                                                Colores disponibles
                                            </h4>

                                            <span>
                                                {productColors.length || 0}
                                                {" "}
                                                {productColors.length === 1
                                                    ? "color registrado"
                                                    : "colores registrados"}
                                            </span>

                                        </div>

                                    </div>


                                    <div className="color-options">

                                        {colores.map(
                                            (color) => {

                                                const isSelected =
                                                    Number(
                                                        selectedColor
                                                    ) ===
                                                    Number(
                                                        color.id_color
                                                    );

                                                const isUsed =
                                                    productColors.includes(
                                                        Number(
                                                            color.id_color
                                                        )
                                                    );

                                                return (

                                                    <div
                                                        key={
                                                            color.id_color
                                                        }
                                                        className={
                                                            `color-option-wrap ${
                                                                isSelected
                                                                    ? "selected"
                                                                    : ""
                                                            }`
                                                        }
                                                    >

                                                        <button
                                                            type="button"
                                                            className={
                                                                `color-option ${
                                                                    isSelected
                                                                        ? "selected"
                                                                        : ""
                                                                }`
                                                            }
                                                            onClick={() =>
                                                                selectColor(
                                                                    color.id_color
                                                                )
                                                            }
                                                        >

                                                            <span
                                                                className="color-circle"
                                                                style={{
                                                                    backgroundColor:
                                                                        color.codigo_hex ||
                                                                        "#CBD5E1"
                                                                }}
                                                            />

                                                            <strong>
                                                                {color.nombre}
                                                            </strong>

                                                            {isSelected && (
                                                                <span className="color-check">
                                                                    ✓
                                                                </span>
                                                            )}

                                                        </button>

                                                        {isUsed && (
                                                            <button
                                                                type="button"
                                                                className="color-remove-button"
                                                                title={`Quitar ${color.nombre} del producto`}
                                                                onClick={(
                                                                    event
                                                                ) => {
                                                                    event.stopPropagation();
                                                                    removeColor(
                                                                        color.id_color
                                                                    );
                                                                }}
                                                            >
                                                                <X size={13} />
                                                            </button>
                                                        )}

                                                    </div>

                                                );

                                            }
                                        )}


                                        {newColorForm.open ? (

                                            <div
                                                className="add-color-option"
                                                style={{
                                                    flexDirection: "column",
                                                    alignItems: "stretch",
                                                    padding: "12px",
                                                    gap: "8px",
                                                }}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter") {
                                                        event.preventDefault();
                                                        submitNewColor(event);
                                                    }
                                                }}
                                            >

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "10px",
                                                    }}
                                                >

                                                    <input
                                                        type="color"
                                                        value={
                                                            newColorForm.codigo_hex
                                                        }
                                                        onChange={(event) =>
                                                            setNewColorForm(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    codigo_hex:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        style={{
                                                            width: "36px",
                                                            height: "36px",
                                                            padding: 0,
                                                            border:
                                                                "1px solid #E0E7EC",
                                                            borderRadius:
                                                                "8px",
                                                            background:
                                                                "transparent",
                                                            cursor:
                                                                "pointer",
                                                        }}
                                                        aria-label="Color picker"
                                                    />

                                                    <span
                                                        className="color-circle"
                                                        style={{
                                                            backgroundColor:
                                                                newColorForm.codigo_hex,
                                                        }}
                                                    />

                                                </div>

                                                <input
                                                    type="text"
                                                    placeholder="Nombre del color"
                                                    value={
                                                        newColorForm.nombre
                                                    }
                                                    onChange={(event) =>
                                                        setNewColorForm(
                                                            (prev) => ({
                                                                ...prev,
                                                                nombre:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                    autoFocus
                                                />

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "6px",
                                                    }}
                                                >

                                                    <button
                                                        type="button"
                                                        onClick={
                                                            submitNewColor
                                                        }
                                                        className="primary-button"
                                                        style={{
                                                            minHeight: "34px",
                                                            padding:
                                                                "0 12px",
                                                            fontSize:
                                                                "12px",
                                                        }}
                                                        disabled={
                                                            newColorForm.submitting ||
                                                            !newColorForm.nombre.trim()
                                                        }
                                                    >
                                                        {newColorForm.submitting
                                                            ? "Guardando..."
                                                            : "Guardar"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="secondary-button"
                                                        style={{
                                                            minHeight: "34px",
                                                            padding:
                                                                "0 12px",
                                                            fontSize:
                                                                "12px",
                                                        }}
                                                        onClick={
                                                            closeNewColorForm
                                                        }
                                                        disabled={
                                                            newColorForm.submitting
                                                        }
                                                    >
                                                        Cancelar
                                                    </button>

                                                </div>

                                            </div>

                                        ) : (

                                            <button
                                                type="button"
                                                className="add-color-option"
                                                onClick={openNewColorForm}
                                            >

                                                <Plus size={18} />

                                                Agregar color

                                            </button>

                                        )}

                                    </div>

                                    {errors.color && (

                                        <span className="error-text">
                                            {errors.color}
                                        </span>

                                    )}

                                </div>


                                {/* ================================
                                   TALLAS
                                   ================================ */}

                                <div className="sizes-section">

                                    <div className="sizes-header">

                                        <div>

                                            <h4>
                                                Tallas y stock para:

                                                <span className="selected-color-name">

                                                    <span
                                                        className="small-color-circle"
                                                        style={{
                                                            backgroundColor:
                                                                selectedColorInfo?.codigo_hex ||
                                                                "#CBD5E1"
                                                        }}
                                                    />

                                                    {selectedColorInfo?.nombre ||
                                                        "Selecciona un color"}

                                                </span>

                                            </h4>

                                        </div>

                                        {newTallaForm.open ? (

                                            <div
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter") {
                                                        event.preventDefault();
                                                        submitNewTalla(event);
                                                    }
                                                }}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                }}
                                            >

                                                <input
                                                    type="text"
                                                    placeholder="Nueva talla"
                                                    value={
                                                        newTallaForm.nombre
                                                    }
                                                    onChange={(event) =>
                                                        setNewTallaForm(
                                                            (prev) => ({
                                                                ...prev,
                                                                nombre:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                    autoFocus
                                                    style={{
                                                        height: "36px",
                                                        padding: "0 10px",
                                                        border:
                                                            "1px solid #9DD6DD",
                                                        borderRadius:
                                                            "8px",
                                                        background:
                                                            "#F7FCFD",
                                                        color: "#152D45",
                                                        fontSize:
                                                            "12px",
                                                        outline: "none",
                                                        minWidth:
                                                            "110px",
                                                    }}
                                                />

                                                <button
                                                    type="button"
                                                    onClick={
                                                        submitNewTalla
                                                    }
                                                    className="add-size-button"
                                                    disabled={
                                                        newTallaForm.submitting ||
                                                        !newTallaForm.nombre.trim()
                                                    }
                                                    style={{
                                                        minHeight: "36px",
                                                        padding:
                                                            "0 10px",
                                                    }}
                                                >
                                                    {newTallaForm.submitting
                                                        ? "..."
                                                        : "Crear"}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="secondary-button"
                                                    style={{
                                                        minHeight: "36px",
                                                        padding:
                                                            "0 10px",
                                                        fontSize:
                                                            "12px",
                                                    }}
                                                    onClick={
                                                        closeNewTallaForm
                                                    }
                                                    disabled={
                                                        newTallaForm.submitting
                                                    }
                                                >
                                                    Cancelar
                                                </button>

                                            </div>

                                        ) : (

                                            <button
                                                type="button"
                                                className="add-size-button"
                                                onClick={openNewTallaForm}
                                                disabled={!selectedColor}
                                            >
                                                <Plus size={16} />
                                                Crear talla
                                            </button>

                                        )}

                                    </div>


                                    {/* ================================
                                       CABECERA TABLA
                                       ================================ */}

                                    <div className="sizes-table-header">

                                        <span>
                                            Talla
                                        </span>

                                        <span>
                                            SKU
                                        </span>

                                        <span>
                                            Stock disponible
                                        </span>

                                        <span>
                                            Estado
                                        </span>

                                        <span />

                                    </div>


                                    {/* ================================
                                       FILAS
                                       ================================ */}

                                    {!selectedColor ? (

                                        <div className="select-color-empty">

                                            <Tag size={24} />

                                            <strong>
                                                Selecciona el color de la prenda
                                            </strong>

                                            <span>
                                                Después podrás configurar sus tallas, SKU y stock.
                                            </span>

                                        </div>

                                    ) : selectedSizes.length === 0 ? (

                                        <div className="select-color-empty">

                                            <strong>
                                                Este color todavía no tiene tallas
                                            </strong>

                                            <span>
                                                Agrega una talla para continuar.
                                            </span>

                                        </div>

                                    ) : (

                                        selectedSizes.map(
                                            (variant) => {

                                                const stock =
                                                    Number(
                                                        variant.stock
                                                    );

                                                let status =
                                                    "Disponible";

                                                let statusClass =
                                                    "available";

                                                if (
                                                    stock === 0
                                                ) {

                                                    status =
                                                        "Sin stock";

                                                    statusClass =
                                                        "out";

                                                } else if (
                                                    stock <= 5
                                                ) {

                                                    status =
                                                        "Últimas unidades";

                                                    statusClass =
                                                        "danger";

                                                } else if (
                                                    stock <= 10
                                                ) {

                                                    status =
                                                        "Bajo stock";

                                                    statusClass =
                                                        "warning";

                                                }

                                                return (

                                                    <div
                                                        className="size-row"
                                                        key={
                                                            variant.clientId
                                                        }
                                                    >

                                                        {/* TALLA */}

                                                        <div className="size-cell">

                                                            <select
                                                                value={
                                                                    variant.talla
                                                                }
                                                                onChange={(event) =>
                                                                    updateVariant(
                                                                        variant.clientId,
                                                                        "talla",
                                                                        event.target.value
                                                                    )
                                                                }
                                                            >

                                                                <option value="">
                                                                    Seleccionar
                                                                </option>

                                                                {tallas.map(
                                                                    (size) => (

                                                                        <option
                                                                            key={
                                                                                size.id_talla
                                                                            }
                                                                            value={
                                                                                size.id_talla
                                                                            }
                                                                        >
                                                                            {size.nombre}
                                                                        </option>

                                                                    )
                                                                )}

                                                            </select>

                                                            {errors[
                                                                `variant-${variant.clientId}-talla`
                                                            ] && (

                                                                <span className="error-text">
                                                                    {
                                                                        errors[
                                                                            `variant-${variant.clientId}-talla`
                                                                        ]
                                                                    }
                                                                </span>

                                                            )}

                                                        </div>


                                                        {/* SKU */}

                                                        <div className="sku-cell">

                                                            <input
                                                                value={
                                                                    variant.sku
                                                                }
                                                                onChange={(event) =>
                                                                    updateVariant(
                                                                        variant.clientId,
                                                                        "sku",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                placeholder="SKU-001"
                                                            />

                                                            {errors[
                                                                `variant-${variant.clientId}-sku`
                                                            ] && (

                                                                <span className="error-text">
                                                                    {
                                                                        errors[
                                                                            `variant-${variant.clientId}-sku`
                                                                        ]
                                                                    }
                                                                </span>

                                                            )}

                                                        </div>


                                                        {/* STOCK */}

                                                        <div className="stock-cell">

                                                            <div className="stock-control">

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        updateVariant(
                                                                            variant.clientId,
                                                                            "stock",
                                                                            Math.max(
                                                                                0,
                                                                                Number(
                                                                                    variant.stock
                                                                                ) - 1
                                                                            )
                                                                        )
                                                                    }
                                                                >
                                                                    −
                                                                </button>

                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={
                                                                        variant.stock
                                                                    }
                                                                    onChange={(event) =>
                                                                        updateVariant(
                                                                            variant.clientId,
                                                                            "stock",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                />

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        updateVariant(
                                                                            variant.clientId,
                                                                            "stock",
                                                                            Number(
                                                                                variant.stock
                                                                            ) + 1
                                                                        )
                                                                    }
                                                                >
                                                                    +
                                                                </button>

                                                            </div>

                                                            <span className="stock-unit">
                                                                uds
                                                            </span>

                                                        </div>


                                                        {/* ESTADO */}

                                                        <div className="status-cell">

                                                            <span
                                                                className={
                                                                    `stock-status ${statusClass}`
                                                                }
                                                            >
                                                                {status}
                                                            </span>

                                                        </div>


                                                        {/* ELIMINAR */}

                                                        <div className="delete-cell">

                                                            <button
                                                                type="button"
                                                                className="delete-size-button"
                                                                onClick={() =>
                                                                    removeVariant(
                                                                        variant.clientId
                                                                    )
                                                                }
                                                                title="Eliminar talla"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>

                                                        </div>

                                                    </div>

                                                );

                                            }
                                        )

                                    )}


                                    {/* ================================
                                       AGREGAR TALLA
                                       ================================ */}

                                    {selectedColor && !newTallaForm.open && (

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "10px",
                                                margin: "10px 17px",
                                            }}
                                        >

                                            <button
                                                type="button"
                                                className="add-size-row"
                                                onClick={addSizeRow}
                                                style={{
                                                    margin: 0,
                                                    width: "auto",
                                                    flex: 1,
                                                }}
                                            >

                                                <Plus size={17} />

                                                Agregar fila de talla

                                            </button>

                                            <button
                                                type="button"
                                                className="add-size-row"
                                                onClick={openNewTallaForm}
                                                style={{
                                                    margin: 0,
                                                    width: "auto",
                                                    flex: 1,
                                                }}
                                            >

                                                <Plus size={17} />

                                                Crear nueva talla

                                            </button>

                                        </div>

                                    )}

                                </div>

                            </div>


                            {/* =================================================
                               PREVISUALIZACIÓN
                               ================================================= */}

                            <aside className="product-preview">

                                <h4>
                                    Vista previa del producto
                                </h4>

                                <div className="preview-card">

                                    <div className="preview-image">

                                        {(() => {
                                            const variantImages =
                                                selectedColorVariants[0]?.imagenes ||
                                                [];

                                            const principalImage =
                                                variantImages.find(
                                                    (img) =>
                                                        img.principal
                                                ) ||
                                                variantImages[0];

                                            if (!principalImage) {
                                                return (
                                                    <div className="preview-placeholder">
                                                        <ImagePlus size={30} />
                                                        <span>
                                                            Imagen del producto
                                                        </span>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <img
                                                    src={mediaUrl(
                                                        principalImage.imagen
                                                    )}
                                                    alt={datos.nombre}
                                                />
                                            );
                                        })()}

                                        {datos.estado &&
                                            datos.estado !== "activo" && (

                                            <span
                                                className={`preview-status preview-status-${datos.estado}`}
                                            >
                                                {datos.estado}
                                            </span>

                                        )}

                                    </div>


                                    <div className="preview-info">

                                        <span className="preview-eyebrow">
                                            Vista previa
                                        </span>

                                        <h3>
                                            {datos.nombre ||
                                                "Nombre del producto"}
                                        </h3>

                                        <strong className="preview-price">
                                            $
                                            {Number(
                                                datos.precio || 0
                                            ).toLocaleString(
                                                "es-CO"
                                            )}
                                        </strong>

                                        {datos.descripcion?.trim() ? (
                                            <p className="preview-description">
                                                {datos.descripcion}
                                            </p>
                                        ) : (
                                            <p className="preview-description preview-description-empty">
                                                Sin descripción por ahora.
                                                Agrega una en el paso 1 para
                                                mostrar los detalles del
                                                producto.
                                            </p>
                                        )}


                                        <div className="preview-divider" />


                                        <div className="preview-pill">

                                            <span
                                                className="small-color-circle"
                                                style={{
                                                    backgroundColor:
                                                        selectedColorInfo?.codigo_hex ||
                                                        "#CBD5E1"
                                                }}
                                            />

                                            <span className="preview-pill-label">
                                                Color
                                            </span>

                                            <strong>
                                                {selectedColorInfo?.nombre ||
                                                    "Sin seleccionar"}
                                            </strong>

                                        </div>


                                        <div className="preview-pill">

                                            <span className="preview-pill-label">
                                                Tallas
                                            </span>

                                            <strong>
                                                {selectedSizes
                                                    .filter(
                                                        (v) =>
                                                            v.talla
                                                    )
                                                    .map(
                                                        (v) =>
                                                            tallas.find(
                                                                (t) =>
                                                                    Number(
                                                                        t.id_talla
                                                                    ) ===
                                                                    Number(
                                                                        v.talla
                                                                    )
                                                            )?.nombre
                                                    )
                                                    .filter(Boolean)
                                                    .join(", ") ||
                                                    "Sin tallas"}
                                            </strong>

                                        </div>

                                    </div>

                                </div>

                            </aside>

                        </div>


                        {/* =================================================
                           INFORMACIÓN DE IMÁGENES
                           ================================================= */}

                        <div className="images-next-info">

                            <div className="info-circle">
                                i
                            </div>

                            <div>

                                <strong>
                                    Las imágenes se administran en el siguiente paso
                                </strong>

                                <p>
                                    En la sección de imágenes podrás cargar las fotografías del producto.
                                    Una imagen puede utilizarse para todas las tallas del mismo color.
                                </p>

                            </div>

                        </div>


                        {/* =================================================
                           BOTONES
                           ================================================= */}

                        <div className="bottom-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() =>
                                    setTab("datos")
                                }
                            >

                                <ChevronLeft size={18} />

                                Volver

                            </button>


                            <button
                                type="button"
                                className="primary-button"
                                onClick={() =>
                                    setTab("imagenes")
                                }
                            >

                                Siguiente: Imágenes

                                <ChevronRight size={18} />

                            </button>

                        </div>

                    </section>

                )}


                {/* =================================================
                   PASO 3 — IMÁGENES
                   ================================================= */}

                {tab === "imagenes" && (

                    <section className="step-content">

                        <div className="section-heading">

                            <div className="section-icon">
                                <ImagePlus size={22} />
                            </div>

                            <div>

                                <h3>
                                    Imágenes del producto
                                </h3>

                                <p>
                                    Agrega las fotografías correspondientes a cada color.
                                </p>

                            </div>

                        </div>


                        <div className="info-banner">

                            <Info size={19} />

                            <div>

                                <strong>
                                    Una imagen para todas las tallas
                                </strong>

                                <p>
                                    Las fotografías se relacionan con el color.
                                    No necesitas repetir la misma imagen para S, M, L, XL, etc.
                                </p>

                            </div>

                        </div>


                        <div className="image-color-list">

                            {productColors.map(
                                (colorId) => {

                                    const colorInfo =
                                        getColorInfo(
                                            colorId
                                        );

                                    const variants =
                                        variantes.filter(
                                            (variant) =>
                                                Number(
                                                    variant.color
                                                ) ===
                                                Number(
                                                    colorId
                                                )
                                        );

                                    /*
                                     * Las imágenes se toman de la
                                     * primera variante del color.
                                     */
                                    const firstVariant =
                                        variants[0];

                                    const images =
                                        firstVariant?.imagenes ||
                                        [];

                                    return (

                                        <section
                                            className="color-image-card"
                                            key={colorId}
                                        >

                                            <div className="color-image-header">

                                                <div className="variant-color-info">

                                                    <span
                                                        className="variant-color-dot"
                                                        style={{
                                                            backgroundColor:
                                                                colorInfo?.codigo_hex ||
                                                                "#CBD5E1"
                                                        }}
                                                    />

                                                    <div>

                                                        <h4>
                                                            {colorInfo?.nombre ||
                                                                "Color"}
                                                        </h4>

                                                        <span>
                                                            Una misma imagen para todas sus tallas
                                                        </span>

                                                    </div>

                                                </div>

                                                <span className="image-counter">
                                                    {images.length}
                                                    {" / "}
                                                    {MAX_IMAGES}
                                                </span>

                                            </div>


                                            <div className="image-upload-layout">

                                                {images.map(
                                                    (img, imageIndex) => (

                                                        <div
                                                            className={
                                                                `image-preview-card ${
                                                                    img.principal
                                                                        ? "is-principal"
                                                                        : ""
                                                                }`
                                                            }
                                                            key={
                                                                img.id_imagen ||
                                                                `${colorId}-${imageIndex}`
                                                            }
                                                        >

                                                            <img
                                                                src={mediaUrl(
                                                                    img.imagen
                                                                )}
                                                                alt={
                                                                    colorInfo?.nombre
                                                                }
                                                            />

                                                            {img.principal && (

                                                                <span className="principal-label">

                                                                    <Star
                                                                        size={12}
                                                                        fill="currentColor"
                                                                    />

                                                                    Principal

                                                                </span>

                                                            )}

                                                            <div className="image-preview-actions">

                                                                <button
                                                                    type="button"
                                                                    className={
                                                                        `image-action-button ${
                                                                            img.principal
                                                                                ? "active"
                                                                                : ""
                                                                        }`
                                                                    }
                                                                    onClick={() =>
                                                                        setPrincipal(
                                                                            colorId,
                                                                            imageIndex
                                                                        )
                                                                    }
                                                                >

                                                                    <Star
                                                                        size={15}
                                                                        fill={
                                                                            img.principal
                                                                                ? "currentColor"
                                                                                : "none"
                                                                        }
                                                                    />

                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    className="image-action-button delete-action"
                                                                    onClick={() =>
                                                                        removeImage(
                                                                            colorId,
                                                                            imageIndex
                                                                        )
                                                                    }
                                                                >

                                                                    <Trash2 size={15} />

                                                                </button>

                                                            </div>

                                                        </div>

                                                    )
                                                )}


                                                {images.length <
                                                    MAX_IMAGES && (

                                                    <label
                                                        className="image-upload-box"
                                                        htmlFor={`image-upload-${colorId}`}
                                                    >

                                                        <div className="upload-icon">
                                                            <Plus size={25} />
                                                        </div>

                                                        <strong>
                                                            Agregar imagen
                                                        </strong>

                                                        <span>
                                                            PNG, JPG o WEBP
                                                        </span>

                                                        <small>
                                                            Máximo 5 MB
                                                        </small>

                                                        <input
                                                            id={`image-upload-${colorId}`}
                                                            type="file"
                                                            accept="image/png,image/jpeg,image/webp"
                                                            ref={(element) => {
                                                                inputRefs.current[
                                                                    `color-${colorId}`
                                                                ] = element;
                                                            }}
                                                            onChange={(event) => {

                                                                const file =
                                                                    event.target.files?.[0];

                                                                if (!file) {
                                                                    return;
                                                                }

                                                                addFile(
                                                                    colorId,
                                                                    file
                                                                );

                                                            }}
                                                        />

                                                    </label>

                                                )}

                                            </div>


                                            <div className="image-url-row">

                                                <span>
                                                    ¿Prefieres utilizar una URL?
                                                </span>

                                                <button
                                                    type="button"
                                                    className="image-url-button"
                                                    disabled={
                                                        images.length >=
                                                        MAX_IMAGES
                                                    }
                                                    onClick={() => {
                                                        addUrl(colorId);
                                                    }}
                                                >

                                                    <Plus size={16} />

                                                    Agregar desde URL

                                                </button>

                                            </div>

                                        </section>

                                    );

                                }
                            )}

                        </div>


                        {productColors.length === 0 && (

                            <div className="images-empty">

                                <ImagePlus size={35} />

                                <h4>
                                    Aún no hay colores configurados
                                </h4>

                                <p>
                                    Regresa al paso de variantes y selecciona el color de la prenda.
                                </p>

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                        setTab("variantes")
                                    }
                                >
                                    Ir a variantes
                                </button>

                            </div>

                        )}


                        <div className="bottom-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() =>
                                    setTab("variantes")
                                }
                            >

                                <ChevronLeft size={18} />

                                Volver

                            </button>


                            <button
                                type="submit"
                                className="primary-button save-product-button"
                                disabled={loading}
                            >

                                {loading
                                    ? "Guardando..."
                                    : editing
                                        ? "Guardar cambios"
                                        : "Guardar producto"
                                }

                                {!loading && (
                                    <span>✓</span>
                                )}

                            </button>

                        </div>

                    </section>

                )}

            </form>

        </div>

    );

}

export default ProductForm;