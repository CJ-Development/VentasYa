import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    ArrowLeft,
    Check,
    ChevronDown,
    Folder,
    FolderOpen
} from "lucide-react";

import {
    createCategory,
    updateCategory,
    getCategories
} from "../../../services/adminService";

import "./CategoryForm.css";


function CategoryForm({
    category,
    onClose,
    onCreated
}) {

    const editing = Boolean(category);

    const [formData, setFormData] = useState({
        nombre: category?.nombre || "",

        categoria_padre_id:
            category?.categoria_padre_id ??
            category?.id_categoria_padre ??
            category?.categoria_padre?.id_categoria ??
            "",

        estado:
            category?.estado ||
            "activo",

        orden:
            category?.orden ??
            1
    });

    const [categorias, setCategorias] =
        useState([]);

    const [submitting, setSubmitting] =
        useState(false);

    const [loadingCategories, setLoadingCategories] =
        useState(true);

    const [error, setError] =
        useState("");


    /*
    =====================================================
    CARGAR CATEGORÍAS
    =====================================================
    */

    useEffect(() => {

        let mounted = true;

        const cargarCategorias = async () => {

            setLoadingCategories(true);
            setError("");

            try {

                const response =
                    await getCategories();

                const data =
                    response?.data;

                if (!mounted) {
                    return;
                }

                /*
                El backend actualmente devuelve
                directamente un array.
                */

                if (Array.isArray(data)) {

                    setCategorias(data);

                } else if (
                    Array.isArray(data?.results)
                ) {

                    setCategorias(
                        data.results
                    );

                } else {

                    setCategorias([]);
                }

            } catch (error) {

                console.error(
                    "Error cargando categorías:",
                    error
                );

                if (mounted) {

                    setCategorias([]);

                    setError(
                        "No fue posible cargar las categorías."
                    );
                }

            } finally {

                if (mounted) {
                    setLoadingCategories(false);
                }
            }
        };

        cargarCategorias();

        return () => {
            mounted = false;
        };

    }, []);


    /*
    =====================================================
    CAMBIO DE INPUT
    =====================================================
    */

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        setError("");
    };


    /*
    =====================================================
    CATEGORÍA PADRE SELECCIONADA
    =====================================================
    */

    const categoriaPadre = useMemo(() => {

        if (
            !formData.categoria_padre_id
        ) {
            return null;
        }

        return categorias.find(
            (item) =>
                Number(
                    item.id_categoria
                ) === Number(
                    formData.categoria_padre_id
                )
        );

    }, [
        categorias,
        formData.categoria_padre_id
    ]);


    /*
    =====================================================
    CATEGORÍAS PRINCIPALES
    =====================================================
    */

    const categoriasPrincipales =
        useMemo(() => {

            return categorias.filter(
                (item) => {

                    const parent =
                        item.id_categoria_padre ??
                        item.categoria_padre?.id_categoria ??
                        item.categoria_padre;

                    return !parent;
                }
            );

        }, [categorias]);


    /*
    =====================================================
    HIJAS
    =====================================================
    */

    const obtenerHijas = (id) => {

        return categorias.filter(
            (item) => {

                const parent =
                    item.id_categoria_padre ??
                    item.categoria_padre?.id_categoria ??
                    item.categoria_padre;

                return (
                    Number(parent) ===
                    Number(id)
                );
            }
        );
    };


    const previewChildren =
        categoriaPadre
            ? obtenerHijas(
                categoriaPadre.id_categoria
            )
            : [];


    /*
    =====================================================
    SUBMIT
    =====================================================
    */

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSubmitting(true);

        try {

            const payload = {

                nombre:
                    formData.nombre.trim(),

                categoria_padre_id:
                    formData.categoria_padre_id
                        ? Number(
                            formData.categoria_padre_id
                        )
                        : null,

                estado:
                    formData.estado,

                orden:
                    Number(
                        formData.orden
                    )
            };


            if (!payload.nombre) {

                throw new Error(
                    "El nombre de la categoría es obligatorio."
                );
            }


            /*
            ---------------------------------------------
            EDITAR
            ---------------------------------------------
            */

            if (editing) {

                await updateCategory(
                    category.id_categoria,
                    payload
                );

            }

            /*
            ---------------------------------------------
            CREAR
            ---------------------------------------------
            */

            else {

                await createCategory(
                    payload
                );
            }


            /*
            ---------------------------------------------
            ÉXITO
            ---------------------------------------------
            */

            if (onCreated) {
                await onCreated();
            }

        } catch (error) {

            console.error(
                "Error guardando categoría:",
                error
            );

            const backendData =
                error?.response?.data;

            let mensaje =
                editing
                    ? "No fue posible actualizar la categoría."
                    : "No fue posible crear la categoría.";


            if (
                backendData?.categoria_padre_id
            ) {

                const detalle =
                    backendData.categoria_padre_id;

                mensaje =
                    Array.isArray(detalle)
                        ? detalle[0]
                        : detalle;

            } else if (
                backendData?.nombre
            ) {

                const detalle =
                    backendData.nombre;

                mensaje =
                    Array.isArray(detalle)
                        ? detalle[0]
                        : detalle;

            } else if (
                backendData?.detail
            ) {

                mensaje =
                    backendData.detail;

            } else if (
                error?.message
            ) {

                mensaje =
                    error.message;
            }

            setError(mensaje);

        } finally {

            setSubmitting(false);
        }
    };


    return (

        <div className="category-form-page">

            <div className="category-form-top">

                <button
                    type="button"
                    className="back-button"
                    onClick={onClose}
                    disabled={submitting}
                >

                    <ArrowLeft size={18} />

                    Categorías

                </button>

            </div>


            <div className="category-form-heading">

                <div>

                    <h1>

                        {editing
                            ? "Editar categoría"
                            : "Nueva categoría"
                        }

                    </h1>

                    <p>

                        {editing
                            ? "Actualiza la información de la categoría."
                            : "Crea una categoría o subcategoría para organizar tu tienda."
                        }

                    </p>

                </div>

            </div>


            {error && (

                <div
                    className="category-form-error"
                    role="alert"
                >
                    {error}
                </div>

            )}


            <div className="category-form-layout">


                {/* =================================================
                    FORMULARIO
                ================================================= */}

                <form
                    className="category-form-card"
                    onSubmit={handleSubmit}
                >

                    <div className="form-card-header">

                        <div>

                            <h2>
                                Información de la categoría
                            </h2>

                            <p>
                                Completa los datos principales.
                            </p>

                        </div>

                    </div>


                    <div className="category-form-content">


                        <div className="form-group full">

                            <label htmlFor="nombre">

                                Nombre

                                <span>*</span>

                            </label>

                            <input
                                id="nombre"
                                type="text"
                                name="nombre"
                                value={
                                    formData.nombre
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Nombre de la categoría"
                                disabled={submitting}
                                required
                            />

                        </div>


                        <div className="form-group full">

                            <label htmlFor="categoria_padre_id">

                                Categoría padre

                            </label>


                            <div className="select-wrapper">

                                <select
                                    id="categoria_padre_id"
                                    name="categoria_padre_id"
                                    value={
                                        formData.categoria_padre_id
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        loadingCategories ||
                                        submitting
                                    }
                                >

                                    <option value="">

                                        Ninguna — categoría principal

                                    </option>


                                    {categoriasPrincipales

                                        .filter(
                                            (item) =>
                                                !editing ||
                                                Number(
                                                    item.id_categoria
                                                ) !== Number(
                                                    category.id_categoria
                                                )
                                        )

                                        .map((item) => (

                                            <option
                                                key={
                                                    item.id_categoria
                                                }
                                                value={
                                                    item.id_categoria
                                                }
                                            >

                                                {item.nombre}

                                            </option>

                                        ))

                                    }

                                </select>


                                <ChevronDown
                                    size={17}
                                />

                            </div>


                            <small>

                                Selecciona una categoría para crear una subcategoría.

                            </small>

                        </div>


                        <div className="form-row">


                            <div className="form-group">

                                <label htmlFor="estado">

                                    Estado

                                </label>


                                <div className="select-wrapper">

                                    <select
                                        id="estado"
                                        name="estado"
                                        value={
                                            formData.estado
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={
                                            submitting
                                        }
                                    >

                                        <option value="activo">
                                            Activa
                                        </option>

                                        <option value="inactivo">
                                            Inactiva
                                        </option>

                                    </select>

                                    <ChevronDown
                                        size={17}
                                    />

                                </div>

                            </div>


                            <div className="form-group">

                                <label htmlFor="orden">

                                    Orden

                                </label>

                                <input
                                    id="orden"
                                    type="number"
                                    name="orden"
                                    min="1"
                                    value={
                                        formData.orden
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        submitting
                                    }
                                />

                            </div>

                        </div>

                    </div>


                    <div className="form-actions">

                        <button
                            type="button"
                            className="cancel-form-button"
                            onClick={onClose}
                            disabled={
                                submitting
                            }
                        >
                            Cancelar
                        </button>


                        <button
                            type="submit"
                            className="save-form-button"
                            disabled={
                                submitting ||
                                loadingCategories
                            }
                        >

                            <Check size={17} />

                            {submitting

                                ? "Guardando..."

                                : editing
                                    ? "Guardar cambios"
                                    : "Crear categoría"

                            }

                        </button>

                    </div>

                </form>


                {/* =================================================
                    VISTA PREVIA
                ================================================= */}

                <div className="category-preview-card">

                    <div className="preview-header">

                        <div>

                            <h2>
                                Vista previa
                            </h2>

                            <p>
                                Así se verá en la navegación.
                            </p>

                        </div>

                    </div>


                    <div className="preview-navigation">

                        <div className="preview-column">

                            <div className="preview-column-title">

                                {categoriaPadre?.nombre ||
                                    (
                                        formData.nombre ||
                                        "Nueva categoría"
                                    )
                                }

                            </div>


                            <div className="preview-column-line" />


                            {categoriaPadre ? (

                                <>

                                    {previewChildren.map(
                                        (child) => (

                                            <div
                                                className="preview-item"
                                                key={
                                                    child.id_categoria
                                                }
                                            >

                                                {child.nombre}

                                            </div>

                                        )
                                    )}


                                    {formData.nombre && (

                                        <div className="preview-item preview-new">

                                            <span>
                                                {formData.nombre}
                                            </span>

                                            <small>
                                                Nueva
                                            </small>

                                        </div>

                                    )}

                                </>

                            ) : (

                                <div className="preview-empty">

                                    <FolderOpen
                                        size={18}
                                    />

                                    <span>
                                        Esta categoría será principal.
                                    </span>

                                </div>

                            )}

                        </div>

                    </div>


                    <div className="preview-note">

                        <Folder size={16} />

                        <span>
                            La estructura se actualizará cuando guardes los cambios.
                        </span>

                    </div>

                </div>

            </div>

        </div>
    );
}


export default CategoryForm;