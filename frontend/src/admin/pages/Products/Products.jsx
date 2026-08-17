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

    const handleSaved = async () => {
        setRefreshKey((prev) => prev + 1);
    };

    if (openForm) {
        return (
            <div className="products-page">

                <ProductForm
                    product={selectedProduct}
                    onClose={closeForm}
                    onSaved={handleSaved}
                />

            </div>
        );
    }

    return (
        <div className="products-page">

            <header className="page-header">

                <div className="page-header-info">

                    <h1>
                        Productos
                    </h1>

                    <p>
                        Gestiona tu catálogo, inventario y variantes.
                    </p>

                </div>

                <button
                    type="button"
                    className="new-product-button"
                    onClick={handleNewProduct}
                >
                    <span>+</span>
                    Nuevo producto
                </button>

            </header>

            <ProductTable
                refreshKey={refreshKey}
                onEdit={handleEditProduct}
            />

        </div>
    );
}

export default Products;
