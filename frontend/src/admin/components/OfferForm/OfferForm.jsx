import "./OfferForm.css";

function OfferForm() {

    return (

        <div className="offer-form">

            <h2>Nueva Oferta</h2>

            <form>

                <div className="grid">

                    <div className="form-group">

                        <label>Nombre de la oferta</label>

                        <input
                            type="text"
                            placeholder="Ej: Black Friday"
                        />

                    </div>

                    <div className="form-group">

                        <label>Producto</label>

                        <select>

                            <option>Seleccione un producto</option>

                        </select>

                    </div>

                    <div className="form-group">

                        <label>Tipo de descuento</label>

                        <select>

                            <option>Porcentaje (%)</option>

                            <option>Valor fijo ($)</option>

                        </select>

                    </div>

                    <div className="form-group">

                        <label>Valor</label>

                        <input
                            type="number"
                            placeholder="20"
                        />

                    </div>

                    <div className="form-group">

                        <label>Fecha inicio</label>

                        <input type="date" />

                    </div>

                    <div className="form-group">

                        <label>Fecha fin</label>

                        <input type="date" />

                    </div>

                </div>

                <div className="form-group">

                    <label>Descripción</label>

                    <textarea
                        rows="4"
                        placeholder="Descripción de la oferta..."
                    />

                </div>

                <button>

                    Guardar Oferta

                </button>

            </form>

        </div>

    );

}

export default OfferForm;