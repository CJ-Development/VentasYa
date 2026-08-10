import "./Offers.css";

import { useState } from "react";

import OfferForm from "../../components/OfferForm/OfferForm";
import OfferTable from "../../components/OfferTable/OfferTable";

function Offers() {

    const [showModal, setShowModal] = useState(false);

    const [selectedOffer, setSelectedOffer] = useState(null);

    const [refreshKey, setRefreshKey] = useState(0);

    const handleNewOffer = () => {

        setSelectedOffer(null);

        setShowModal(true);

    };

    const handleEditOffer = (oferta) => {

        setSelectedOffer(oferta);

        setShowModal(true);

    };

    const handleSaved = () => {

        setRefreshKey((prev) => prev + 1);

    };

    const closeModal = () => {

        setShowModal(false);

        setSelectedOffer(null);

    };

    return (

        <div className="offers-page">

            <div className="page-header">

                <div>

                    <h1>Ofertas</h1>

                    <p>
                        Crea y administra las promociones de la tienda.
                    </p>

                </div>

                <button
                    className="new-offer-button"
                    onClick={handleNewOffer}
                >

                    + Nueva oferta

                </button>

            </div>

            <OfferTable
                refreshKey={refreshKey}
                onEdit={handleEditOffer}
            />

            {

                showModal && (

                    <OfferForm
                        offer={selectedOffer}
                        onClose={closeModal}
                        onSaved={handleSaved}
                    />

                )

            }

        </div>

    );

}

export default Offers;
