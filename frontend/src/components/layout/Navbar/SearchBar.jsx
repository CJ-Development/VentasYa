import { Search } from "lucide-react";

function SearchBar(){

    return(

        <div className="search">

            <input
                type="text"
                placeholder="Buscar productos..."
            />

            <Search className="search-icon"/>

        </div>

    )

}

export default SearchBar;