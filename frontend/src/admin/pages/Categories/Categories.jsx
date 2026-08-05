import { useState } from "react";

import "./Categories.css";

import CategoryForm from "../../components/CategoryForm/CategoryForm";
import CategoryTable from "../../components/CategoryTable/CategoryTable";

function Categories() {

    const [showModal, setShowModal] = useState(false);

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

            <CategoryTable />

            {

                showModal && (

                    <CategoryForm

                        onClose={() => setShowModal(false)}

                    />

                )

            }

        </div>

    );

}

export default Categories;