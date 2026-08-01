import { ShoppingCart } from "lucide-react";

function CartButton() {
    return (
        <button className="icon-button cart-button">
            <ShoppingCart />
            <span className="cart-badge">3</span>
        </button>
    );
}

export default CartButton;