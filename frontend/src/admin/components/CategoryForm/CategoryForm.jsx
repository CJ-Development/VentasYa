import "./CategoryForm.css";

function CategoryForm() {

    return (

        <div className="category-form-card">

            <h2>Nueva categoría</h2>

            <form>

                <div className="grid">

                    <div className="form-group">

                        <label>

                            Nombre

                        </label>

                        <input
                            type="text"
                            placeholder="Ej: Hombre"
                        />

                    </div>

                    <div className="form-group">

                        <label>

                            Estado

                        </label>

                        <select>

                            <option>

                                Activo

                            </option>

                            <option>

                                Inactivo

                            </option>

                        </select>

                    </div>

                </div>

                <div className="form-group">

                    <label>

                        Descripción

                    </label>

                    <textarea
                        rows="4"
                        placeholder="Descripción..."
                    />

                </div>

                <div className="form-group">

                    <label>

                        Imagen

                    </label>

                    <input
                        type="file"
                    />

                </div>

                <button>

                    Guardar categoría

                </button>

            </form>

        </div>

    );

}

export default CategoryForm;