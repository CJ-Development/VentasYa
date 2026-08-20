import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

// ============================================================
// PÚBLICAS
// ============================================================

import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import New from "../pages/New/New";

// ============================================================
// CLIENTE
// ============================================================

import ClientProducts from "../pages/Products/Products";
import ProductDetailPage from "../pages/Products/ProductDetailPage/ProductDetailPage";
import ClientOffers from "../pages/Offers/Offers";

import Profile from "../pages/Profile/Profile";
import Favorites from "../pages/Favorites/Favorites";
import Settings from "../pages/Settings/Settings";
import Checkout from "../pages/Checkout/Checkout";
import Cart from "../pages/Cart/Cart";
import ClientOrders from "../pages/Orders/Orders";

// ============================================================
// ADMIN
// ============================================================

import AdminLayout from "../admin/layout/AdminLayout";
import Dashboard from "../admin/pages/Dashboard";
import AdminRoute from "./AdminRoute";

import AdminProducts from "../admin/pages/Products/Products";
import Categories from "../admin/pages/Categories/Categories";
import AdminOffers from "../admin/pages/Offers/Offers";
import Orders from "../admin/pages/Orders/Orders";
import Users from "../admin/pages/Users/Users";


function AppRouter() {

    return (

        <Routes>

            {/* ==================================================
                SITIO PÚBLICO
            ================================================== */}

            <Route element={<MainLayout />}>

                {/* INICIO */}

                <Route
                    path="/"
                    element={<Home />}
                />


                {/* PRODUCTOS - CLIENTE */}

                <Route
                    path="/products"
                    element={<ClientProducts />}
                />


                {/* DETALLE DE PRODUCTO POR SLUG */}

                <Route
                    path="/producto/:slug"
                    element={<ProductDetailPage />}
                />


                {/* ==================================================
                    CATEGORÍAS
                ================================================== */}

                <Route
                    path="/hombre"
                    element={<ClientProducts />}
                />

                <Route
                    path="/mujer"
                    element={<ClientProducts />}
                />

                <Route
                    path="/nino"
                    element={<ClientProducts />}
                />

                <Route
                    path="/categoria/:slug"
                    element={<ClientProducts />}
                />


                {/* ==================================================
                    OFERTAS
                ================================================== */}

                <Route
                    path="/offers"
                    element={<ClientOffers />}
                />


                {/* ==================================================
                    NOVEDADES
                ================================================== */}

                <Route
                    path="/new"
                    element={<New />}
                />


                {/* ==================================================
                    AUTENTICACIÓN
                ================================================== */}

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />


                {/* ==================================================
                    USUARIO
                ================================================== */}

                <Route
                    path="/profile"
                    element={<Profile />}
                />

                <Route
                    path="/favorites"
                    element={<Favorites />}
                />

                <Route
                    path="/cart"
                    element={<Cart />}
                />

                <Route
                    path="/orders"
                    element={<ClientOrders />}
                />

                <Route
                    path="/checkout"
                    element={<Checkout />}
                />

                <Route
                    path="/settings"
                    element={<Settings />}
                />

            </Route>


            {/* ==================================================
                PANEL ADMINISTRADOR
            ================================================== */}

            <Route
                path="/admin"
                element={
                    <AdminRoute>
                        <AdminLayout />
                    </AdminRoute>
                }
            >

                {/* DASHBOARD */}

                <Route
                    index
                    element={<Dashboard />}
                />


                {/* CATEGORÍAS */}

                <Route
                    path="categories"
                    element={<Categories />}
                />


                {/* PRODUCTOS - ADMIN */}

                <Route
                    path="products"
                    element={<AdminProducts />}
                />


                {/* OFERTAS - ADMIN */}

                <Route
                    path="offers"
                    element={<AdminOffers />}
                />


                {/* PEDIDOS */}

                <Route
                    path="orders"
                    element={<Orders />}
                />


                {/* USUARIOS */}

                <Route
                    path="users"
                    element={<Users />}
                />

            </Route>

        </Routes>

    );

}

export default AppRouter;