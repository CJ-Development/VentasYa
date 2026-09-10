import { useState, useMemo } from "react";
import { Search, ArrowLeft, X, Folder, FolderOpen, ChevronRight, ChevronDown, Check } from "lucide-react";
import "./CategorySelector.css";

function CategorySelector({
    categories,
    value,
    onChange,
    excludeId = null,
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPath, setCurrentPath] = useState([]);
    const [viewMode, setViewMode] = useState("tree"); // "tree" or "search"

    // Obtener categoría seleccionada
    const selectedCategory = useMemo(() => {
        if (!value) return null;
        return categories.find(cat => Number(cat.id_categoria) === Number(value));
    }, [categories, value]);

    // Construir ruta completa de una categoría
    const buildPath = (category) => {
        const path = [];
        let current = category;
        
        while (current) {
            path.unshift(current);
            const parentId = current.id_categoria_padre ?? current.categoria_padre?.id_categoria ?? current.categoria_padre;
            current = categories.find(cat => Number(cat.id_categoria) === Number(parentId));
        }
        
        return path;
    };

    // Obtener hijos de una categoría
    const getChildren = (parentId) => {
        return categories.filter(cat => {
            const parent = cat.id_categoria_padre ?? cat.categoria_padre?.id_categoria ?? cat.categoria_padre;
            return Number(parent) === Number(parentId);
        });
    };

    // Obtener categorías principales (nivel 1)
    const rootCategories = useMemo(() => {
        return categories.filter(cat => {
            const parent = cat.id_categoria_padre ?? cat.categoria_padre?.id_categoria ?? cat.categoria_padre;
            return !parent;
        });
    }, [categories]);

    // Filtrar categorías excluyendo la actual (para edición)
    const filterExcluded = (cats) => {
        if (!excludeId) return cats;
        return cats.filter(cat => Number(cat.id_categoria) !== Number(excludeId));
    };

    // Obtener categorías en el nivel actual
    const currentCategories = useMemo(() => {
        if (currentPath.length === 0) {
            return filterExcluded(rootCategories);
        }
        const currentParent = currentPath[currentPath.length - 1];
        return filterExcluded(getChildren(currentParent.id_categoria));
    }, [categories, currentPath, rootCategories, excludeId]);

    // Búsqueda con rutas completas
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        
        const query = searchQuery.toLowerCase();
        
        return categories.filter(cat => {
            if (excludeId && Number(cat.id_categoria) === Number(excludeId)) return false;
            
            const path = buildPath(cat);
            const pathNames = path.map(c => c.nombre.toLowerCase()).join(" > ");
            
            return pathNames.includes(query);
        }).map(cat => ({
            category: cat,
            path: buildPath(cat)
        }));
    }, [categories, searchQuery, excludeId]);

    // Calcular nivel de una categoría
    const getLevel = (category) => {
        if (!category) return 0;
        const path = buildPath(category);
        return path.length;
    };

    // Navegar a una categoría
    const navigateTo = (category) => {
        const path = buildPath(category);
        setCurrentPath(path);
        setViewMode("tree");
    };

    // Ir atrás
    const goBack = () => {
        if (currentPath.length > 0) {
            setCurrentPath(currentPath.slice(0, -1));
        }
    };

    // Seleccionar categoría
    const selectCategory = (category) => {
        onChange(category.id_categoria);
        setIsOpen(false);
        setSearchQuery("");
        setCurrentPath([]);
        setViewMode("tree");
    };

    // Limpiar selección
    const clearSelection = () => {
        onChange("");
        setIsOpen(false);
        setSearchQuery("");
        setCurrentPath([]);
        setViewMode("tree");
    };

    // Obtener ruta de texto
    const getRouteText = (path) => {
        return path.map(cat => cat.nombre).join(" > ");
    };

    // Calcular nivel resultante
    const resultLevel = selectedCategory ? getLevel(selectedCategory) + 1 : 1;
    const levelText = resultLevel === 1 ? "Categoría principal" : 
                     resultLevel === 2 ? "Subcategoría" : 
                     resultLevel === 3 ? "Sub-subcategoría" : "";

    // Verificar si excede nivel 3
    const exceedsMaxLevel = resultLevel > 3;

    return (
        <div className="category-selector">
            <label>
                Categoría padre
            </label>

            {/* Selector visible */}
            <div className={`category-selector-trigger ${isOpen ? 'open' : ''}`}>
                {selectedCategory ? (
                    <div className="category-selector-selected">
                        <Folder size={16} />
                        <span>{getRouteText(buildPath(selectedCategory))}</span>
                        <button
                            type="button"
                            className="category-selector-clear"
                            onClick={clearSelection}
                            disabled={disabled}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="category-selector-placeholder">
                        Ninguna — categoría principal
                    </div>
                )}
                <button
                    type="button"
                    className="category-selector-toggle"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                >
                    <ChevronDown size={16} />
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="category-selector-dropdown">
                    {/* Búsqueda */}
                    <div className="category-selector-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Buscar categoría..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (e.target.value.trim()) {
                                    setViewMode("search");
                                } else {
                                    setViewMode("tree");
                                }
                            }}
                            autoFocus
                        />
                    </div>

                    {/* Breadcrumbs */}
                    {viewMode === "tree" && currentPath.length > 0 && (
                        <div className="category-selector-breadcrumbs">
                            <button
                                type="button"
                                className="breadcrumb-back"
                                onClick={goBack}
                            >
                                <ArrowLeft size={14} />
                                Volver
                            </button>
                            <div className="breadcrumb-path">
                                {currentPath.map((cat, index) => (
                                    <span key={cat.id_categoria}>
                                        {index > 0 && <ChevronRight size={12} />}
                                        {cat.nombre}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Lista de categorías */}
                    <div className="category-selector-list">
                        {viewMode === "search" ? (
                            // Resultados de búsqueda
                            searchResults.length > 0 ? (
                                searchResults.map(({ category, path }) => (
                                    <div
                                        key={category.id_categoria}
                                        className={`category-selector-item ${Number(value) === Number(category.id_categoria) ? 'selected' : ''}`}
                                        onClick={() => selectCategory(category)}
                                    >
                                        <Folder size={14} />
                                        <div className="category-selector-item-content">
                                            <span className="category-name">{category.nombre}</span>
                                            <span className="category-path">{getRouteText(path)}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="category-selector-empty">
                                    No se encontraron categorías
                                </div>
                            )
                        ) : (
                            // Navegación por árbol
                            currentPath.length === 0 ? (
                                // Nivel 1
                                currentCategories.map(cat => {
                                    const children = getChildren(cat.id_categoria);
                                    
                                    return (
                                        <div
                                            key={cat.id_categoria}
                                            className={`category-selector-item ${Number(value) === Number(cat.id_categoria) ? 'selected' : ''}`}
                                        >
                                            <div className="category-selector-item-main">
                                                <Folder size={14} />
                                                <span>{cat.nombre}</span>
                                            </div>
                                            <div className="category-selector-item-actions">
                                                <button
                                                    type="button"
                                                    className="category-select-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        selectCategory(cat);
                                                    }}
                                                    title="Seleccionar como padre"
                                                >
                                                    <Check size={14} />
                                                    Seleccionar
                                                </button>
                                                {children.length > 0 && (
                                                    <button
                                                        type="button"
                                                        className="category-navigate-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigateTo(cat);
                                                        }}
                                                        title="Ver subcategorías"
                                                    >
                                                        Ver hijos
                                                        <ChevronRight size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                // Niveles 2 y 3
                                currentCategories.map(cat => {
                                    const children = getChildren(cat.id_categoria);
                                    const level = getLevel(cat);
                                    
                                    return (
                                        <div
                                            key={cat.id_categoria}
                                            className={`category-selector-item ${Number(value) === Number(cat.id_categoria) ? 'selected' : ''}`}
                                        >
                                            <div className="category-selector-item-main">
                                                <Folder size={14} />
                                                <span>{cat.nombre}</span>
                                            </div>
                                            <div className="category-selector-item-actions">
                                                <button
                                                    type="button"
                                                    className="category-select-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        selectCategory(cat);
                                                    }}
                                                    title="Seleccionar como padre"
                                                >
                                                    <Check size={14} />
                                                    Seleccionar
                                                </button>
                                                {children.length > 0 && level < 2 && (
                                                    <button
                                                        type="button"
                                                        className="category-navigate-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigateTo(cat);
                                                        }}
                                                        title="Ver subcategorías"
                                                    >
                                                        Ver hijos
                                                        <ChevronRight size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )
                        )}
                    </div>
                </div>
            )}

            {/* Info de nivel */}
            {selectedCategory && (
                <div className={`category-selector-level ${exceedsMaxLevel ? 'error' : ''}`}>
                    <span className="level-label">Nivel resultante:</span>
                    <span className="level-value">{levelText}</span>
                    {exceedsMaxLevel && (
                        <span className="level-error">
                            No se pueden crear categorías por debajo del tercer nivel.
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default CategorySelector;
