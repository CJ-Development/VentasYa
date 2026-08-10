import { useState } from "react";

import "./Categories.css";

import CategoryForm from "../../components/CategoryForm/CategoryForm";
import CategoryTable from "../../components/CategoryTable/CategoryTable";
import { getCategories } from "../../../services/adminService";

function Categories() {

    const [showModal, setShowModal] = useState(false);

    const [refreshKey, setRefreshKey] = useState(0);

    const handleCreated = async () => {

        // Confirmamos la creación contra la BD antes de refrescar la tabla.
        try {

            await getCategories();

        } finally {

            setRefreshKey((prev) => prev + 1);

        }

    };

    return (

        <div className="categories-page">

            <div className="page-header">

                <div>

                    <h1>

                        Categorías

                    </h1>

                    <p>

                        Organiza los productos de la tienda.

                    </p>

                </div>

                <button

                    className="new-category"

                    onClick={() => setShowModal(true)}

                >

                    + Nueva categoría

                </button>

            </div>

            <CategoryTable refreshKey={refreshKey} />

            {

                showModal && (

                    <CategoryForm

                        onClose={() => setShowModal(false)}

                        onCreated={handleCreated}

                    />

                )

            }

        </div>

    );

}

export default Categories;