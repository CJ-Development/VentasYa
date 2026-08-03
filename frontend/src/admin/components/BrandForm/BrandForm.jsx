import "./BrandForm.css";

function BrandForm() {

    return (

        <div className="brand-form-card">

            <h2>Nueva Marca</h2>

            <form>

                <div className="grid">

                    <div className="form-group">

                        <label>Nombre</label>

                        <input
                            type="text"
                            placeholder="Ej: Nike"
                        />

                    </div>

                    <div className="form-group">

                        <label>Estado</label>

                        <select>

                            <option>Activo</option>

                            <option>Inactivo</option>

                        </select>

                    </div>

                </div>

                <div className="form-group">

                    <label>Descripción</label>

                    <textarea
                        rows="4"
                        placeholder="Descripción de la marca..."
                    />

                </div>

                <div className="form-group">

                    <label>Logo</label>

                    <input
                        type="file"
                    />

                </div>

                <button>

                    Guardar Marca

                </button>

            </form>

        </div>

    );

}

export default BrandForm;