import { ShoppingCart } from "lucide-react";

import { useCart } from "../../../hooks/useCart";

function CartButton() {
    const { count, openDrawer } = useCart();

    return (
        <button
            type="button"
            className="cart-button"
            onClick={openDrawer}
            title="Ver carrito"
            aria-label="Ver carrito"
        >
            <ShoppingCart />

            <span className="cart-badge">
                {count > 99 ? "99+" : count}
            </span>
        </button>
    );
}

export default CartButton;