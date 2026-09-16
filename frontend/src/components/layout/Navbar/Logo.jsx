import { Link } from "react-router-dom";
import logo from "../../../assets/images/Logo.png";

function Logo() {
    return (
        <Link to="/" className="logo-link">
            <img
                src={logo}
                alt="Baúl Mágico Shop"
                className="logo"
            />
        </Link>
    );
}

export default Logo;