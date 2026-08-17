import { useEffect, useMemo, useState } from "react";

import {
    getCategories,
    updateCategory,
    deleteCategory
} from "../../../services/adminService";

import {
    ChevronDown,
    ChevronRight,
    Edit3,
    Trash2,
    Folder,
    FolderOpen
} from "lucide-react";

import "./CategoryTable.css";


function CategoryTable({ refreshKey, onEdit }) {

    const [categorias, setCategorias] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [expanded, setExpanded] = useState({});


    const cargarCategorias = async () => {

        setLoading(true);

        try {

            const { data } = await getCategories();

            setCategorias(data || []);

            setError(null);

        }

        catch (err) {

            console.error(err);

            setError("No fue posible cargar las categorías.");

        }

        finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        cargarCategorias();

    }, [refreshKey]);


    /*
     * El backend posteriormente podrá enviar:
     *
     * categoria_padre
     *
     * o
     *
     * id_categoria_padre
     *
     * Este componente acepta ambas posibilidades.
     */

    const categoriasPrincipales = useMemo(() => {

        return categorias.filter((categoria) => {

            const parent =
                categoria.id_categoria_padre ??
                categoria.categoria_padre?.id_categoria ??
                categoria.categoria_padre;

            return !parent;

        });

    }, [categorias]);


    const obtenerHijas = (id) => {

        return categorias.filter((categoria) => {

            const parent =
                categoria.id_categoria_padre ??
                categoria.categoria_padre?.id_categoria ??
                categoria.categoria_padre;

            return Number(parent) === Number(id);

        });

    };


    const toggleCategory = (id) => {

        setExpanded((prev) => ({

            ...prev,

            [id]: !prev[id]

        }));

    };


    const eliminarCategoria = async (id, nombre) => {

        const etiqueta = nombre ? `"${nombre}"` : "esta categoría";

        const confirmar = window.confirm(
            `¿Archivar ${etiqueta}?`
        );

        if (!confirmar) return;

        const cascada = window.confirm(
            `¿También archivar los productos vinculados a ${etiqueta} ` +
            `y a todas sus subcategorías?\n\n` +
            `• Aceptar = archivar en cascada (categoría, subcategorías y productos).\n` +
            `• Cancelar = archivar solo la categoría (los productos quedarán intactos).`
        );

        try {

            await deleteCategory(id, { cascade: cascada });

            await cargarCategorias();

        }

        catch (err) {

            console.error(err);

            alert("No fue posible archivar la categoría.");

        }

    };


    if (loading) {

        return (

            <div className="category-container">

                <div className="category-loading">

                    Cargando categorías...

                </div>

            </div>

        );

    }


    if (error) {

        return (

            <div className="category-container">

                <div className="category-error">

                    {error}

                </div>

            </div>

        );

    }


    return (

        <section className="category-container">

            <div className="category-section-header">

                <div>

                    <h2>Categorías registradas</h2>

                    <p>
                        Administra las categorías principales y sus subcategorías.
                    </p>

                </div>

                <span className="category-count">

                    {categoriasPrincipales.length}

                    {categoriasPrincipales.length === 1
                        ? " categoría"
                        : " categorías"
                    }

                </span>

            </div>


            {categorias.length === 0 ? (

                <div className="empty-categories">

                    <div className="empty-icon">

                        <Folder size={22} />

                    </div>

                    <h3>No hay categorías registradas</h3>

                    <p>
                        Crea tu primera categoría para comenzar a organizar la tienda.
                    </p>

                </div>

            ) : (

                <div className="categories-list">

                    {categoriasPrincipales.map((categoria) => {

                        const children = obtenerHijas(
                            categoria.id_categoria
                        );

                        const isExpanded =
                            expanded[categoria.id_categoria] ?? true;

                        return (

                            <div
                                className="category-group"
                                key={categoria.id_categoria}
                            >

                                <div className="category-main">

                                    <div className="category-main-left">

                                        {children.length > 0 ? (

                                            <button
                                                className="expand-button"
                                                onClick={() =>
                                                    toggleCategory(
                                                        categoria.id_categoria
                                                    )
                                                }
                                            >

                                                {isExpanded ? (

                                                    <ChevronDown size={18} />

                                                ) : (

                                                    <ChevronRight size={18} />

                                                )}

                                            </button>

                                        ) : (

                                            <span className="expand-placeholder" />

                                        )}


                                        <div className="category-icon">

                                            {isExpanded && children.length > 0 ? (

                                                <FolderOpen size={19} />

                                            ) : (

                                                <Folder size={19} />

                                            )}

                                        </div>


                                        <div className="category-info">

                                            <div className="category-name">

                                                {categoria.nombre}

                                            </div>

                                            <span className="category-type">

                                                Categoría principal

                                            </span>

                                        </div>

                                    </div>


                                    <div className="category-main-right">

                                        <span
                                            className={
                                                categoria.estado === "activo"
                                                    ? "status-badge active"
                                                    : "status-badge inactive"
                                            }
                                        >

                                            {categoria.estado === "activo"
                                                ? "Activa"
                                                : "Inactiva"
                                            }

                                        </span>


                                        <span className="subcategory-count">

                                            {children.length}

                                            {children.length === 1
                                                ? " subcategoría"
                                                : " subcategorías"
                                            }

                                        </span>


                                        <div className="category-actions">

                                            <button
                                                className="icon-action edit"
                                                onClick={() =>
                                                    onEdit(categoria)
                                                }
                                                title="Editar categoría"
                                            >

                                                <Edit3 size={17} />

                                            </button>


                                            <button
                                                className="icon-action delete"
                                                onClick={() =>
                                                    eliminarCategoria(
                                                        categoria.id_categoria,
                                                        categoria.nombre
                                                    )
                                                }
                                                title="Eliminar categoría"
                                            >

                                                <Trash2 size={17} />

                                            </button>

                                        </div>

                                    </div>

                                </div>


                                {isExpanded && children.length > 0 && (

                                    <div className="subcategory-list">

                                        {children.map((subcategoria) => (

                                            <div
                                                className="subcategory-row"
                                                key={subcategoria.id_categoria}
                                            >

                                                <div className="subcategory-name-wrapper">

                                                    <span className="tree-line" />

                                                    <div className="subcategory-icon">

                                                        <Folder size={16} />

                                                    </div>

                                                    <div>

                                                        <div className="subcategory-name">

                                                            {subcategoria.nombre}

                                                        </div>

                                                        <span className="subcategory-type">

                                                            Subcategoría

                                                        </span>

                                                    </div>

                                                </div>


                                                <div className="subcategory-actions">

                                                    <span
                                                        className={
                                                            subcategoria.estado === "activo"
                                                                ? "status-badge active"
                                                                : "status-badge inactive"
                                                        }
                                                    >

                                                        {subcategoria.estado === "activo"
                                                            ? "Activa"
                                                            : "Inactiva"
                                                        }

                                                    </span>


                                                    <button
                                                        className="icon-action edit"
                                                        onClick={() =>
                                                            onEdit(subcategoria)
                                                        }
                                                        title="Editar subcategoría"
                                                    >

                                                        <Edit3 size={16} />

                                                    </button>


                                                    <button
                                                        className="icon-action delete"
                                                        onClick={() =>
                                                            eliminarCategoria(
                                                                subcategoria.id_categoria,
                                                                subcategoria.nombre
                                                            )
                                                        }
                                                        title="Eliminar subcategoría"
                                                    >

                                                        <Trash2 size={16} />

                                                    </button>

                                                </div>

                                            </div>

                                        ))}

                                    </div>

                                )}

                            </div>

                        );

                    })}

                </div>

            )}

        </section>

    );

}


export default CategoryTable;