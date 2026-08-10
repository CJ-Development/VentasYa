import { useState } from "react";

import "./Products.css";

import ProductForm from "../../components/ProductForm/ProductForm";
import ProductTable from "../../components/ProductTable/ProductTable";

function Products() {

    const [openForm, setOpenForm] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState(null);

    const [refreshKey, setRefreshKey] = useState(0);

    const handleNewProduct = () => {

        setSelectedProduct(null);

        setOpenForm(true);

    };

    const handleEditProduct = (product) => {

        setSelectedProduct(product);

        setOpenForm(true);

    };

    const closeForm = () => {

        setOpenForm(false);

        setSelectedProduct(null);

    };

    const handleSaved = () => {

        setRefreshKey((prev) => prev + 1);

    };

    return (

        <div className="products-page">

            <div className="page-header">

                <div>

                    <span className="page-badge">

                        Catálogo

                    </span>

                    <h1>

                        Productos

                    </h1>

                    <p>

                        Administra todos los productos registrados.

                    </p>

                </div>

                <button
                    className="new-product-button"
                    onClick={handleNewProduct}
                >

                    + Nuevo producto

                </button>

            </div>

            <ProductTable
                refreshKey={refreshKey}
                onEdit={handleEditProduct}
            />

            {

                openForm && (

                    <ProductForm
                        product={selectedProduct}
                        onClose={closeForm}
                        onSaved={handleSaved}
                    />

                )

            }

        </div>

    );

}

export default Products;
