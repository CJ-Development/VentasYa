import { useState } from "react";

import "./Offers.css";

import OfferForm from "../../components/OfferForm/OfferForm";
import OfferTable from "../../components/OfferTable/OfferTable";


function Offers() {

    const [showForm, setShowForm] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleNewOffer = () => {
        setSelectedOffer(null);
        setShowForm(true);
    };

    const handleEditOffer = (oferta) => {
        setSelectedOffer(oferta);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setSelectedOffer(null);
        setShowForm(false);
    };

    const handleCreated = () => {
        setRefreshKey((prev) => prev + 1);
        setShowForm(false);
        setSelectedOffer(null);
    };

    if (showForm) {
        return (
            <OfferForm
                offer={selectedOffer}
                onClose={handleCloseForm}
                onCreated={handleCreated}
            />
        );
    }

    return (
        <div className="offers-page">
            <div className="offers-header">
                <div className="offers-header-content">
                    <h1>Ofertas</h1>
                    <p>Crea y administra las promociones de tu tienda.</p>
                </div>
                <button
                    type="button"
                    className="new-offer-button"
                    onClick={handleNewOffer}
                >
                    <span className="new-offer-plus">+</span>
                    Nueva oferta
                </button>
            </div>

            <OfferTable
                refreshKey={refreshKey}
                onEdit={handleEditOffer}
            />
        </div>
    );
}

export default Offers;
