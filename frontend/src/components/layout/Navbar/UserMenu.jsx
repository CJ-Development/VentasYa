import { User } from "lucide-react";

function UserMenu() {
    return (
        <button className="icon-button">
            <User />
            <span>Iniciar sesión</span>
        </button>
    );
}

export default UserMenu;