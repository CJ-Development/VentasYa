import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

// Públicas
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";

// Usuario
import Profile from "../pages/Profile/Profile";
import Favorites from "../pages/Favorites/Favorites";

import Settings from "../pages/Settings/Settings";

// Admin
import AdminLayout from "../admin/layout/AdminLayout";
import Dashboard from "../admin/pages/Dashboard";
import AdminRoute from "./AdminRoute";
import Products from "../admin/pages/Products/Products";
import Categories from "../admin/pages/Categories/Categories";
import Brands from "../admin/pages/Brands/Brands";
import Offers from "../admin/pages/Offers/Offers";
import Orders from "../admin/pages/Orders/Orders";
import Users from "../admin/pages/Users/Users";

function AppRouter() {
    return (
        <Routes>

            {/* Sitio público */}
            <Route element={<MainLayout />}>

                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/profile" element={<Profile />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/settings" element={<Settings />} />

            </Route>

            {/* Panel administrador */}
            <Route path="/admin" element={ <AdminRoute> <AdminLayout /> </AdminRoute>} >
                <Route index element={<Dashboard />} />
                <Route path="categories" element={<Categories />}/>
                <Route path="products" element={<Products />} />
                <Route path="brands" element={<Brands />} />
                <Route path="offers" element={<Offers />} />
                <Route path="orders" element={<Orders />} />
                <Route path="users" element={<Users />}/>
            </Route>

        </Routes>
    );
}

export default AppRouter;