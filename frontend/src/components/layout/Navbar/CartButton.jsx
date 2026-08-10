import { ShoppingCart } from "lucide-react";

import { useCart } from "../../../hooks/useCart";

function CartButton() {

    const { count, openDrawer } = useCart();

    return (
        <button
            type="button"
            className="icon-button cart-button"
            onClick={openDrawer}
            title="Ver carrito"
            aria-label="Ver carrito"
        >
            <ShoppingCart />
            {count > 0 && (
                <span className="cart-badge">{count > 99 ? "99+" : count}</span>
            )}
        </button>
    );
}

export default CartButton;
