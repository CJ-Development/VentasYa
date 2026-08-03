import "./Brands.css";

import BrandForm from "../../components/BrandForm/BrandForm";
import BrandTable from "../../components/BrandTable/BrandTable";

function Brands() {

    return (

        <div className="brands-page">

            <div className="page-header">

                <div>

                    <h1>Marcas</h1>

                    <p>
                        Administra las marcas disponibles para tus productos.
                    </p>

                </div>

            </div>

            <BrandForm />

            <BrandTable />

        </div>

    );

}

export default Brands;