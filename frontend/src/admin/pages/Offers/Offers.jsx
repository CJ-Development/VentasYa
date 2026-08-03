import "./Offers.css";

import OfferForm from "../../components/OfferForm/OfferForm";
import OfferTable from "../../components/OfferTable/OfferTable";

function Offers() {

    return (

        <div className="offers-page">

            <div className="page-header">

                <div>

                    <h1>Ofertas</h1>

                    <p>
                        Crea y administra las promociones de la tienda.
                    </p>

                </div>

            </div>

            <OfferForm />

            <OfferTable />

        </div>

    );

}

export default Offers;