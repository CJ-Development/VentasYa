import "./ProductForm.css";

import { useEffect, useRef, useState } from "react";

import { Plus, Star, Trash2, X, HelpCircle } from "lucide-react";

import {
    createProduct,
    updateProduct,
    getCategories,
    getColors,
    createColor,
    createVariant,
    updateVariant,
    deleteVariant,
    addVariantImage,
    updateVariantImage,
    deleteVariantImage,
    uploadVariantImage,
    getVariants,
} from "../../../services/adminService";

// Tallas estándar de Colombia
const TALLAS_COLOMBIA = [
    "XS", "S", "M", "L", "XL", "XXL", "XXXL",
    "26", "28", "30", "32", "34", "36", "38", "40", "42", "44", "46"
];

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

const colorVariantVacia = {
    tempId: 0,
    id_variante: null,
    color: "",
    imagenes: [],
    size_variants: [],  // Array de {talla, stock, sku}
};

let tempCounter = 1;

/* =====================================================
   Componente pequeño: signo "?" con tooltip que aparece
   al pasar el mouse o al hacer focus (sin librerías).
===================================================== */

function LabelHelp({ texto }) {
    return (
        <span
            className="label-help"
            tabIndex={0}
            role="tooltip"
            aria-label={texto}
        >
            ?
            <span className="label-help-bubble">
                {texto}
            </span>
        </span>
    );
}

/* =====================================================
   Mini-modal para crear un color o talla en línea.
===================================================== */

function MiniModalCrear({ tipo, onClose, onGuardado }) {
    const [nombre, setNombre] = useState("");
    const [hex, setHex] = useState("#384D48");
    const [guardando, setGuardando] = useState(false);

    const handleGuardar = async (e) => {
        e.preventDefault();

        if (!nombre.trim()) return;

        setGuardando(true);

        try {
            const payload =
                tipo === "color"
                    ? { nombre: nombre.trim(), codigo_hex: hex }
                    : { nombre: nombre.trim() };

            const { data } =
                tipo === "color"
                    ? await createColor(payload)
                    : await createTalla(payload);

            onGuardado(data);
            onClose();
        } catch (err) {
            console.error(err);
            alert(
                tipo === "color"
                    ? "No se pudo crear el color."
                    : "No se pudo crear la talla."
            );
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div
            className="inline-modal-backdrop"
            onClick={onClose}
        >
            <div
                className="inline-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="inline-modal-header">
                    <h4>
                        {tipo === "color"
                            ? "Nuevo color"
                            : "Nueva talla"}
                    </h4>
                    <button
                        type="button"
                        className="close-button"
                        onClick={onClose}
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleGuardar}>
                    <div className="form-group">
                        <label>
                            Nombre
                            <LabelHelp texto="Nombre descriptivo (ej. Rojo, M, 38)." />
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder={
                                tipo === "color"
                                    ? "Verde militar"
                                    : "Talla 38"
                            }
                            autoFocus
                            required
                        />
                    </div>

                    {tipo === "color" && (
                        <div className="form-group">
                            <label>
                                Color (HEX)
                                <LabelHelp texto="Código hexadecimal del color. Sirve para mostrarlo en catálogos." />
                            </label>
                            <div className="hex-input">
                                <input
                                    type="color"
                                    value={hex}
                                    onChange={(e) => setHex(e.target.value)}
                                />
                                <input
                                    type="text"
                                    value={hex}
                                    onChange={(e) => setHex(e.target.value)}
                                    placeholder="#384D48"
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-buttons">
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={onClose}
                            disabled={guardando}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="save-button"
                            disabled={guardando}
                        >
                            {guardando ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ProductForm({ product, onClose, onSaved }) {

    const modoEdicion = Boolean(product);

    const [tab, setTab] = useState("datos");

    const [categories, setCategories] = useState([]);

    const [colores, setColores] = useState([]);

    const [tallas, setTallas] = useState(TALLAS_COLOMBIA.map((nombre, index) => ({ id: index, nombre })));

    const [datos, setDatos] = useState(estadoInicialDatos);

    const [slug, setSlug] = useState("");

    const [colorVariants, setColorVariants] = useState([]);

    const [submitting, setSubmitting] = useState(false);

    const [errores, setErrores] = useState({});

    const [modalCrear, setModalCrear] = useState(null);

    const fileInputsRef = useRef({});

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

            // Cargar color variants
            setColorVariants(
                (product.color_variants || []).map((cv) => ({
                    tempId: tempCounter++,
                    id_variante: cv.id_variante,
                    color: cv.color?.id_color ? String(cv.color.id_color) : "",
                    imagenes: cv.imagenes || [],
                    size_variants: (cv.size_variants || []).map((sv) => ({
                        id_size_variant: sv.id_size_variant,
                        talla: sv.talla || "",
                        stock: sv.stock ?? 0,
                        sku: sv.sku || "",
                    })),
                }))
            );

        } else {

            setDatos(estadoInicialDatos);
            setSlug("");
            setColorVariants([]);

        }

    }, [product]);

    const cargarListas = async () => {

        try {

            const [cats, cols] = await Promise.all([
                getCategories(),
                getColors(),
            ]);

            setCategories(cats.data);
            setColores(cols.data);

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

        // Limpiar error de ese campo al editar.
        if (errores[name]) {
            setErrores((prev) => ({ ...prev, [name]: null }));
        }

    };

    const agregarColorVariant = () => {
        setColorVariants((prev) => [
            ...prev,
            {
                ...colorVariantVacia,
                tempId: tempCounter++,
            },
        ]);
    };

    const eliminarColorVariant = async (index) => {
        const colorVariant = colorVariants[index];

        if (colorVariant.id_variante) {
            const confirmar = window.confirm(
                "¿Eliminar este color y sus imágenes/tallas?"
            );
            if (!confirmar) return;

            try {
                // TODO: Implementar deleteColorVariant en adminService
                // await deleteColorVariant(colorVariant.id_variante);
            } catch (err) {
                console.error(err);
                alert("No se pudo eliminar el color.");
                return;
            }
        }

        setColorVariants((prev) => prev.filter((_, i) => i !== index));
    };

    const handleColorVariantChange = (index, campo, valor) => {
        setColorVariants((prev) =>
            prev.map((cv, i) => (i === index ? { ...cv, [campo]: valor } : cv))
        );
        setErrores((prev) => {
            const colorVariantsErr = { ...(prev.color_variants || {}) };
            delete colorVariantsErr[index]?.[campo];
            return { ...prev, color_variants: colorVariantsErr };
        });
    };

    const agregarSizeVariant = (colorIndex) => {
        setColorVariants((prev) =>
            prev.map((cv, i) => {
                if (i === colorIndex) {
                    return {
                        ...cv,
                        size_variants: [
                            ...cv.size_variants,
                            { id_size_variant: null, talla: "", stock: 0, sku: "" }
                        ]
                    };
                }
                return cv;
            })
        );
    };

    const eliminarSizeVariant = (colorIndex, sizeIndex) => {
        setColorVariants((prev) =>
            prev.map((cv, i) => {
                if (i === colorIndex) {
                    return {
                        ...cv,
                        size_variants: cv.size_variants.filter((_, j) => j !== sizeIndex)
                    };
                }
                return cv;
            })
        );
    };

    const handleSizeVariantChange = (colorIndex, sizeIndex, campo, valor) => {
        setColorVariants((prev) =>
            prev.map((cv, i) => {
                if (i === colorIndex) {
                    return {
                        ...cv,
                        size_variants: cv.size_variants.map((sv, j) =>
                            j === sizeIndex ? { ...sv, [campo]: valor } : sv
                        )
                    };
                }
                return cv;
            })
        );
    };

    const handleArchivoChange = (index, file) => {
        setVariantes((prev) =>
            prev.map((v, i) =>
                i === index
                    ? { ...v, nuevoArchivo: file, nuevaImagen: "" }
                    : v
            )
        );
    };

    const handleUrlChange = (index, url) => {
        setVariantes((prev) =>
            prev.map((v, i) =>
                i === index
                    ? { ...v, nuevaImagen: url, nuevoArchivo: null }
                    : v
            )
        );
    };

    const agregarImagen = async (index) => {

        const variante = variantes[index];

        const url = variante.nuevaImagen.trim();
        const archivo = variante.nuevoArchivo;

        if (!url && !archivo) return;

        try {

            if (archivo) {
                // Subida real desde PC.
                const fd = new FormData();
                fd.append("archivo", archivo);
                fd.append("principal", variante.imagenes.length === 0);
                fd.append(
                    "orden",
                    String(variante.imagenes.length + 1)
                );

                if (variante.id_variante) {
                    const { data } = await uploadVariantImage(
                        variante.id_variante,
                        fd
                    );

                    setVariantes((prev) =>
                        prev.map((v, i) =>
                            i === index
                                ? {
                                    ...v,
                                    imagenes: [...v.imagenes, data],
                                    nuevoArchivo: null,
                                    nuevaImagen: "",
                                }
                                : v
                        )
                    );

                    if (fileInputsRef.current[index]) {
                        fileInputsRef.current[index].value = "";
                    }
                } else {
                    // Pendiente: guardar al crear el producto.
                    const previewUrl =
                        URL.createObjectURL(archivo);

                    setVariantes((prev) =>
                        prev.map((v, i) =>
                            i === index
                                ? {
                                    ...v,
                                    nuevaImagen: "",
                                    nuevoArchivo: null,
                                    imagenes: [
                                        ...v.imagenes,
                                        {
                                            imagen: previewUrl,
                                            principal:
                                                v.imagenes.length === 0,
                                            pendiente: true,
                                            archivo: archivo,
                                        },
                                    ],
                                }
                                : v
                        )
                    );

                    if (fileInputsRef.current[index]) {
                        fileInputsRef.current[index].value = "";
                    }
                }
            } else {
                // Compatibilidad: pegar URL.
                if (variante.id_variante) {

                    const { data } = await addVariantImage(
                        variante.id_variante,
                        {
                            imagen: url,
                            principal: variante.imagenes.length === 0,
                            orden: variante.imagenes.length + 1,
                        }
                    );

                    setVariantes((prev) =>
                        prev.map((v, i) =>
                            i === index
                                ? {
                                    ...v,
                                    imagenes: [...v.imagenes, data],
                                    nuevaImagen: "",
                                }
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
                                        {
                                            imagen: url,
                                            principal:
                                                v.imagenes.length === 0,
                                        },
                                    ],
                                }
                                : v
                        )
                    );

                }
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
                        imagenes: v.imagenes.filter(
                            (_, j) => j !== imagenIndex
                        ),
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

            if (imagen.id_imagen) {

                await updateVariantImage(imagen.id_imagen, {
                    principal: true,
                });

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

                if (!variante.id_variante) {

                    alert(
                        "Guarda primero el producto para poder marcar la imagen principal."
                    );

                    return;

                }

                const { data: nueva } = await addVariantImage(
                    variante.id_variante,
                    {
                        imagen: imagen.imagen,
                        principal: true,
                        orden: variante.imagenes.length + 1,
                    }
                );

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

    /* =====================================================
       VALIDACIÓN INLINE
    ====================================================== */

    const validar = () => {
        const nuevosErrores = { datos: {}, variantes: {} };

        if (!datos.nombre || !datos.nombre.trim()) {
            nuevosErrores.datos.nombre = "El nombre del producto es obligatorio.";
        }

        if (!datos.categoria_id) {
            nuevosErrores.datos.categoria_id = "Debes seleccionar una categoría.";
        }

        if (!datos.descripcion || !datos.descripcion.trim()) {
            nuevosErrores.datos.descripcion = "La descripción del producto es obligatoria.";
        }

        if (
            datos.precio === "" ||
            datos.precio === null ||
            datos.precio === undefined ||
            Number(datos.precio) <= 0
        ) {
            nuevosErrores.datos.precio = "El precio debe ser mayor a 0.";
        }

        if (variantes.length === 0) {
            nuevosErrores.variantesGlobal = "Debes agregar al menos una variante (color + talla + SKU + stock).";
        }

        const skusVistos = new Set();

        // Validar color variants
        colorVariants.forEach((cv, i) => {
            const err = {};

            if (!cv.color) {
                err.color = "Selecciona un color para esta variante.";
            }

            // Validar size variants (tallas)
            cv.size_variants.forEach((sv, j) => {
                const svErr = {};
                
                if (!sv.talla || !sv.talla.trim()) {
                    svErr.talla = "La talla es obligatoria.";
                }
                
                if (!sv.sku || !sv.sku.trim()) {
                    svErr.sku = "El SKU es obligatorio.";
                } else if (skusVistos.has(sv.sku.trim())) {
                    svErr.sku = "Este SKU ya está en uso.";
                } else {
                    skusVistos.add(sv.sku.trim());
                }
                
                if (sv.stock === "" || sv.stock === null || sv.stock === undefined || Number(sv.stock) < 0) {
                    svErr.stock = "El stock debe ser un número positivo.";
                }
                
                if (Object.keys(svErr).length > 0) {
                    if (!err.size_variants) err.size_variants = {};
                    err.size_variants[j] = svErr;
                }
            });

            if (cv.size_variants.length === 0) {
                err.size_variants = "Debes agregar al menos una talla.";
            }

            if (Object.keys(err).length > 0) {
                nuevosErrores.color_variants[i] = err;
            }
        });

        return nuevosErrores;
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        const nuevosErrores = validar();

        const tieneErrores =
            Object.keys(nuevosErrores.datos).length > 0 ||
            nuevosErrores.variantesGlobal ||
            Object.keys(nuevosErrores.variantes).length > 0;

        if (tieneErrores) {
            setErrores(nuevosErrores);

            // Si hay error en Datos, saltar a esa pestaña.
            if (Object.keys(nuevosErrores.datos).length > 0) {
                setTab("datos");
            } else {
                setTab("variantes");
            }

            return;
        }

        setErrores({});
        setSubmitting(true);

        try {

            let productoId = product?.id_producto;

            // Preparar color variants para enviar junto con el producto
            const colorVariantsPayload = colorVariants.map(cv => {
                const imagenesPayload = cv.imagenes.map(img => ({
                    imagen: img.imagen || null,
                    principal: img.principal || false,
                    orden: cv.imagenes.indexOf(img) + 1,
                }));
                
                const sizeVariantsPayload = cv.size_variants.map(sv => ({
                    talla: sv.talla,
                    stock: Number(sv.stock),
                    sku: sv.sku,
                    precio: Number(datos.precio),
                }));
                
                return {
                    color: cv.color ? Number(cv.color) : null,
                    imagenes: imagenesPayload,
                    size_variants_data: sizeVariantsPayload,
                };
            });

            const payloadProducto = {
                nombre: datos.nombre,
                categoria_id: Number(datos.categoria_id),
                descripcion: datos.descripcion,
                precio: Number(datos.precio),
                slug: slug || generarSlug(datos.nombre),
                estado: datos.estado,
                color_variants_data: colorVariantsPayload,
            };

            console.log("Enviando producto completo con variantes:", payloadProducto);

            if (modoEdicion) {

                await updateProduct(product.id_producto, payloadProducto);

            } else {

                const { data } = await createProduct(payloadProducto);

                productoId = data.id_producto;

                // Necesitamos obtener las variantes creadas para asignarles imágenes
                const { data: variantesCreadas } = await getVariants(productoId);

                // Mapear las variantes creadas con las del formulario
                for (let i = 0; i < variantes.length; i++) {
                    if (variantesCreadas[i]) {
                        variantes[i].id_variante = variantesCreadas[i].id_variante;
                    }
                }

            }

            // Procesar imágenes de las variantes
            for (const v of variantes) {
                const varianteId = v.id_variante;
                if (!varianteId) continue;

                for (const img of v.imagenes) {

                    if (!img.id_imagen) {
                        // Imagen pendiente (subida de archivo aún no enviada).
                        if (img.archivo) {
                            const fd = new FormData();
                            fd.append("archivo", img.archivo);
                            fd.append(
                                "principal",
                                String(Boolean(img.principal))
                            );
                            fd.append(
                                "orden",
                                String(v.imagenes.indexOf(img) + 1)
                            );

                            await uploadVariantImage(varianteId, fd);
                        } else {
                            await addVariantImage(varianteId, {
                                imagen: img.imagen,
                                principal: img.principal || false,
                                orden: v.imagenes.indexOf(img) + 1,
                            });
                        }
                    }

                }
            }

            if (onSaved) await onSaved();

            onClose();

        }

        catch (error) {

            console.error("Error completo:", error);
            console.error("Respuesta del servidor:", error.response?.data);

            let mensaje = "No fue posible conectar con el servidor.";

            if (error.response?.data) {
                const data = error.response.data;
                if (typeof data === "string") {
                    mensaje = data;
                } else if (data.detail) {
                    mensaje = data.detail;
                } else {
                    // Mostrar errores por campo del backend.
                    const campos = Object.entries(data)
                        .map(
                            ([k, v]) =>
                                `${k}: ${
                                    Array.isArray(v)
                                        ? v.join(", ")
                                        : String(v)
                                }`
                        )
                        .join(" | ");
                    mensaje = campos || "No fue posible guardar el producto.";
                }
            }

            setErrores({
                backend: mensaje,
                datos: {},
                variantes: {},
            });

            // Si el error es de datos base, saltar a esa pestaña.
            setTab("datos");

        }

        finally {

            setSubmitting(false);

        }

    };

    const onColorCreado = (nuevo) => {
        setColores((prev) => [...prev, nuevo]);
        // Auto-seleccionar el recién creado en todas las variantes.
        setVariantes((prev) =>
            prev.map((v) =>
                !v.color ? { ...v, color: nuevo.id_color } : v
            )
        );
    };

    const onTallaCreada = (nuevo) => {
        setTallas((prev) => [...prev, nuevo]);
        setVariantes((prev) =>
            prev.map((v) =>
                !v.talla ? { ...v, talla: nuevo.id_talla } : v
            )
        );
    };

    const errDatos = errores.datos || {};
    const errVars = errores.variantes || {};

    return (

        <div className="modal-overlay">

            <form
                className="product-form"
                onSubmit={handleSubmit}
                noValidate
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

                        {errores.backend && (
                            <div className="form-error-banner">
                                <HelpCircle size={16} />
                                <span>{errores.backend}</span>
                            </div>
                        )}

                        {Object.keys(errDatos).length > 0 && (
                            <div className="form-error-banner">
                                <HelpCircle size={16} />
                                <span>
                                    Completa los campos marcados en rojo
                                    antes de guardar.
                                </span>
                            </div>
                        )}

                        <div className="form-grid">

                            <div className="form-group">

                                <label>
                                    Nombre
                                    <LabelHelp texto="Nombre visible del producto para los clientes." />
                                </label>

                                <input
                                    type="text"
                                    name="nombre"
                                    value={datos.nombre}
                                    onChange={handleDatosChange}
                                    placeholder="Nombre del producto"
                                    className={errDatos.nombre ? "input-error" : ""}
                                    required
                                />

                                {errDatos.nombre && (
                                    <span className="error-text">
                                        {errDatos.nombre}
                                    </span>
                                )}

                            </div>

                            <div className="form-group">

                                <label>
                                    Categoría
                                    <LabelHelp texto="Tipo de producto (Hombre, Mujer, Niño, etc.)." />
                                </label>

                                <select
                                    name="categoria_id"
                                    value={datos.categoria_id}
                                    onChange={handleDatosChange}
                                    className={errDatos.categoria_id ? "input-error" : ""}
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

                                {errDatos.categoria_id && (
                                    <span className="error-text">
                                        {errDatos.categoria_id}
                                    </span>
                                )}

                            </div>

                            <div className="form-group">

                                <label>
                                    Precio
                                    <LabelHelp texto="Precio en pesos colombianos (COP). Usa punto para decimales." />
                                </label>

                                <input
                                    type="number"
                                    name="precio"
                                    value={datos.precio}
                                    onChange={handleDatosChange}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    className={errDatos.precio ? "input-error" : ""}
                                    required
                                />

                                {errDatos.precio && (
                                    <span className="error-text">
                                        {errDatos.precio}
                                    </span>
                                )}

                            </div>

                            <div className="form-group">

                                <label>
                                    Estado
                                    <LabelHelp texto="Activo: visible en la tienda. Inactivo: oculto." />
                                </label>

                                <select
                                    name="estado"
                                    value={datos.estado}
                                    onChange={handleDatosChange}
                                >

                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>

                                </select>

                            </div>

                        </div>

                        <div className="form-group">

                            <label>
                                Descripción
                                <LabelHelp texto="Texto libre que verán los clientes en la página del producto." />
                            </label>

                            <textarea
                                rows="4"
                                name="descripcion"
                                value={datos.descripcion}
                                onChange={handleDatosChange}
                                placeholder="Descripción del producto"
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Slug
                                <LabelHelp texto="Identificador único en la URL. Se genera automático desde el nombre." />
                            </label>

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

                        {errores.backend && (
                            <div className="form-error-banner">
                                <HelpCircle size={16} />
                                <span>{errores.backend}</span>
                            </div>
                        )}

                        {errores.variantesGlobal && (
                            <div className="form-error-banner">
                                <HelpCircle size={16} />
                                <span>{errores.variantesGlobal}</span>
                            </div>
                        )}

                        {variantes.length === 0 ? (

                            <p className="empty-state">

                                Aún no agregaste variantes.

                            </p>

                        ) : (

                            <table className="variants-table">

                                <thead>

                                    <tr>

                                        <th>
                                            Color
                                            <LabelHelp texto="Color de la variante (ej: Rojo, Azul, Negro)." />
                                        </th>
                                        <th>
                                            Talla
                                            <LabelHelp texto="Talla disponible (puedes seleccionar varias)." />
                                        </th>
                                        <th>
                                            SKU
                                            <LabelHelp texto="Código único de identificación del producto." />
                                        </th>
                                        <th>
                                            Stock
                                            <LabelHelp texto="Cantidad disponible en inventario." />
                                        </th>
                                        <th></th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {variantes.map((v, i) => {

                                        const errV = errVars[i] || {};

                                        return (

                                        <tr key={v.tempId}>

                                            <td>

                                                <div className="select-with-add">
                                                    <select
                                                        value={v.color}
                                                        onChange={(e) =>
                                                            handleVarianteChange(
                                                                i,
                                                                "color",
                                                                e.target.value
                                                            )
                                                        }
                                                        className={errV.color ? "input-error" : ""}
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

                                                    <button
                                                        type="button"
                                                        className="add-inline"
                                                        title="Crear un nuevo color"
                                                        onClick={() =>
                                                            setModalCrear("color")
                                                        }
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                {errV.color && (
                                                    <span className="error-text">
                                                        {errV.color}
                                                    </span>
                                                )}

                                            </td>

                                            <td>

                                                <div className="talla-buttons">
                                                    {tallas.map((t) => (
                                                        <button
                                                            key={t.id}
                                                            type="button"
                                                            className={`talla-button ${v.tallas.includes(t.nombre) ? 'active' : ''}`}
                                                            onClick={() => {
                                                                const tallasActuales = [...v.tallas];
                                                                if (tallasActuales.includes(t.nombre)) {
                                                                    handleVarianteChange(
                                                                        i,
                                                                        "tallas",
                                                                        tallasActuales.filter(nombre => nombre !== t.nombre)
                                                                    );
                                                                } else {
                                                                    handleVarianteChange(
                                                                        i,
                                                                        "tallas",
                                                                        [...tallasActuales, t.nombre]
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            {t.nombre}
                                                        </button>
                                                    ))}
                                                </div>

                                                {errV.tallas && (
                                                    <span className="error-text">
                                                        {errV.tallas}
                                                    </span>
                                                )}

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
                                                    className={errV.sku ? "input-error" : ""}
                                                />

                                                {errV.sku && (
                                                    <span className="error-text">
                                                        {errV.sku}
                                                    </span>
                                                )}

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
                                                    className={errV.stock ? "input-error" : ""}
                                                />

                                                {errV.stock && (
                                                    <span className="error-text">
                                                        {errV.stock}
                                                    </span>
                                                )}

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

                                    );})}

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

                            Sube una imagen desde tu PC o pega una URL. La
                            primera imagen de cada variante se marca como
                            principal.

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
                                                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23fee2e2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='10' fill='%23dc2626'%3EError%3C/text%3E%3C/svg%3E";
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
                                            type="file"
                                            accept="image/*"
                                            ref={(el) => (fileInputsRef.current[i] = el)}
                                            onChange={(e) =>
                                                handleArchivoChange(
                                                    i,
                                                    e.target.files?.[0] || null
                                                )
                                            }
                                        />

                                        <span className="input-or">o</span>

                                        <input
                                            type="url"
                                            placeholder="https://..."
                                            value={v.nuevaImagen}
                                            onChange={(e) =>
                                                handleUrlChange(i, e.target.value)
                                            }
                                        />

                                        <button
                                            type="button"
                                            onClick={() => agregarImagen(i)}
                                            disabled={!v.nuevoArchivo && !v.nuevaImagen.trim()}
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

            {modalCrear && (
                <MiniModalCrear
                    tipo={modalCrear}
                    onClose={() => setModalCrear(null)}
                    onGuardado={
                        modalCrear === "color"
                            ? onColorCreado
                            : onTallaCreada
                    }
                />
            )}

        </div>

    );

}

export default ProductForm;
