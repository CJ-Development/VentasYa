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
    FolderOpen,
    MoreHorizontal
} from "lucide-react";

import "./CategoryTable.css";


function CategoryTable({ refreshKey, onEdit }) {

    const [categorias, setCategorias] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    const [expanded, setExpanded] = useState(new Set());


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
     * Obtener el ID del padre de forma tolerante
     */
    const getParentId = (categoria) => {
        if (!categoria) return null;
        return categoria.id_categoria_padre ??
               categoria.categoria_padre?.id_categoria ??
               categoria.categoria_padre;
    };

    /*
     * Obtener hijos de una categoría
     */
    const getChildren = (parentId) => {
        return categorias
            .filter((categoria) => Number(getParentId(categoria)) === Number(parentId))
            .sort((a, b) => (a.orden || 0) - (b.orden || 0));
    };

    /*
     * Obtener categorías raíz (sin padre)
     */
    const categoriasPrincipales = useMemo(() => {
        return categorias
            .filter((categoria) => !getParentId(categoria))
            .sort((a, b) => (a.orden || 0) - (b.orden || 0));
    }, [categorias]);

    /*
     * Calcular nivel de una categoría (1-6)
     */
    const getLevel = (categoria, allCategorias) => {
        let level = 1;
        let current = categoria;
        const visited = new Set();
        
        while (current && getParentId(current)) {
            const parentId = getParentId(current);
            if (visited.has(parentId)) {
                // Ciclo detectado, detener
                break;
            }
            visited.add(parentId);
            current = allCategorias.find(c => Number(c.id_categoria) === Number(parentId));
            if (current) level++;
            if (level > 6) break; // Máximo 6 niveles
        }
        
        return level;
    };

    /*
     * Verificar si una categoría tiene hijos
     */
    const hasChildren = (categoria) => {
        return getChildren(categoria.id_categoria).length > 0;
    };


    const toggleCategory = (id) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
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

                    {categoriasPrincipales.map((categoria) => (
                        <CategoryTreeNode
                            key={categoria.id_categoria}
                            categoria={categoria}
                            level={1}
                            expanded={expanded}
                            onToggle={toggleCategory}
                            onEdit={onEdit}
                            onDelete={eliminarCategoria}
                            getChildren={getChildren}
                            getLevel={getLevel}
                            allCategorias={categorias}
                            hasChildren={hasChildren}
                        />
                    ))}

                </div>

            )}

        </section>

    );

}


/*
 * Componente recursivo para renderizar nodos del árbol de categorías
 * Soporta hasta 6 niveles de profundidad
 */
function CategoryTreeNode({
    categoria,
    level,
    expanded,
    onToggle,
    onEdit,
    onDelete,
    getChildren,
    getLevel,
    allCategorias,
    hasChildren
}) {
    const isExpanded = expanded.has(categoria.id_categoria);
    const children = getChildren(categoria.id_categoria);
    const categoriaLevel = getLevel(categoria, allCategorias);
    const canExpand = hasChildren(categoria);
    const isLeaf = !canExpand;

    /*
     * Etiqueta de nivel para mostrar
     */
    const getLevelLabel = (lvl) => {
        if (lvl === 1) return "Categoría principal";
        if (lvl === 2) return "Subcategoría";
        if (lvl === 3) return "Sub-subcategoría";
        if (lvl === 4) return "Nivel 4";
        if (lvl === 5) return "Nivel 5";
        if (lvl === 6) return "Nivel 6";
        return `Nivel ${lvl}`;
    };

    return (
        <div className={`category-tree-node category-tree-node--level-${level}`}>
            {/* Fila de la categoría */}
            <div 
                className={`category-row category-row--level-${level} ${isExpanded ? 'category-row--expanded' : ''}`}
            >
                <div className="category-row-left">
                    {/* Botón de expansión */}
                    {canExpand ? (
                        <button
                            className="expand-button"
                            onClick={() => onToggle(categoria.id_categoria)}
                            aria-label={isExpanded ? "Colapsar" : "Expandir"}
                        >
                            {isExpanded ? (
                                <ChevronDown size={16} />
                            ) : (
                                <ChevronRight size={16} />
                            )}
                        </button>
                    ) : (
                        <span className="expand-placeholder" />
                    )}

                    {/* Icono de carpeta */}
                    <div className={`category-icon category-icon--level-${level}`}>
                        {isExpanded && canExpand ? (
                            <FolderOpen size={level === 1 ? 18 : 15} />
                        ) : (
                            <Folder size={level === 1 ? 18 : 15} />
                        )}
                    </div>

                    {/* Información de la categoría */}
                    <div className="category-info">
                        <div className="category-name">
                            {categoria.nombre}
                        </div>
                        <span className={`category-type category-type--level-${level}`}>
                            {getLevelLabel(categoriaLevel)}
                        </span>
                    </div>
                </div>

                {/* Acciones */}
                <div className="category-row-right">
                    <span
                        className={
                            categoria.estado === "activo"
                                ? "status-badge active"
                                : "status-badge inactive"
                        }
                    >
                        {categoria.estado === "activo"
                            ? "Activa"
                            : "Inactiva"}
                    </span>

                    {canExpand && (
                        <span className="children-count">
                            {children.length}
                            {children.length === 1 ? " hijo" : " hijos"}
                        </span>
                    )}

                    <div className="category-actions">
                        <button
                            className="icon-action edit"
                            onClick={() => onEdit(categoria)}
                            title="Editar categoría"
                        >
                            <Edit3 size={level === 1 ? 16 : 14} />
                        </button>

                        <button
                            className="icon-action delete"
                            onClick={() => onDelete(categoria.id_categoria, categoria.nombre)}
                            title="Eliminar categoría"
                        >
                            <Trash2 size={level === 1 ? 16 : 14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Hijos recursivos */}
            {isExpanded && canExpand && level < 6 && (
                <div className="category-children">
                    {children.map((child) => (
                        <CategoryTreeNode
                            key={child.id_categoria}
                            categoria={child}
                            level={level + 1}
                            expanded={expanded}
                            onToggle={onToggle}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            getChildren={getChildren}
                            getLevel={getLevel}
                            allCategorias={allCategorias}
                            hasChildren={hasChildren}
                        />
                    ))}
                </div>
            )}

            {/* Indicador de nivel máximo alcanzado */}
            {isExpanded && canExpand && level >= 6 && (
                <div className="category-max-level">
                    <MoreHorizontal size={14} />
                    <span>Nivel máximo alcanzado (6)</span>
                </div>
            )}
        </div>
    );
}


export default CategoryTable;