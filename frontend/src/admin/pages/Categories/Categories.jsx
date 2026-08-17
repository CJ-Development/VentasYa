import { useState } from "react";

import "./Categories.css";

import CategoryForm from "../../components/CategoryForm/CategoryForm";
import CategoryTable from "../../components/CategoryTable/CategoryTable";

function Categories() {

    const [showForm, setShowForm] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleNewCategory = () => {

        setSelectedCategory(null);
        setShowForm(true);

    };

    const handleEditCategory = (category) => {

        setSelectedCategory(category);
        setShowForm(true);

    };

    const handleCloseForm = () => {

        setSelectedCategory(null);
        setShowForm(false);

    };

    const handleCreated = () => {

        setRefreshKey((prev) => prev + 1);
        setShowForm(false);
        setSelectedCategory(null);

    };

    if (showForm) {

        return (

            <CategoryForm

                category={selectedCategory}

                onClose={handleCloseForm}

                onCreated={handleCreated}

            />

        );

    }

    return (

        <div className="categories-page">

            <div className="categories-header">

                <div>

                    <h1>Categorías</h1>

                    <p>
                        Organiza las categorías y subcategorías de la tienda.
                    </p>

                </div>

                <button
                    className="new-category-button"
                    onClick={handleNewCategory}
                >

                    <span>+</span>

                    Nueva categoría

                </button>

            </div>

            <CategoryTable

                refreshKey={refreshKey}

                onEdit={handleEditCategory}

            />

        </div>

    );

}

export default Categories;