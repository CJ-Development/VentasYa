import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

import AuthProvider from "./context/AuthProvider";
import CartProvider from "./context/CartProvider";
import FavoritesProvider from "./context/FavoritesProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>

        <AuthProvider>

            <FavoritesProvider>

                <CartProvider>

                    <BrowserRouter>

                        <App />

                    </BrowserRouter>

                </CartProvider>

            </FavoritesProvider>

        </AuthProvider>

    </React.StrictMode>
);
