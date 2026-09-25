import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import ItemDetails from "./pages/ItemDetails";
import AddPurchase from "./pages/AddPurchase";
import RecordConsumption from "./pages/RecordConsumption";
import ShoppingList from "./pages/ShoppingList";
import Alerts from "./pages/Alerts";
import Suppliers from "./pages/Suppliers";
import Categories from "./pages/Categories";
import Locations from "./pages/Locations";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Primary /app/* routes */}
          <Route path="/app/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/app/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/app/inventory/:id" element={<ProtectedRoute><ItemDetails /></ProtectedRoute>} />
          <Route path="/app/purchases" element={<ProtectedRoute><AddPurchase /></ProtectedRoute>} />
          <Route path="/app/consumption" element={<ProtectedRoute><RecordConsumption /></ProtectedRoute>} />
          <Route path="/app/shopping-list" element={<ProtectedRoute><ShoppingList /></ProtectedRoute>} />
          <Route path="/app/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/app/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/app/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/app/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
          <Route path="/app/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
          <Route path="/app/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* Legacy route aliases — redirect so no old links break */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/inventory" element={<Navigate to="/app/inventory" replace />} />
          <Route path="/inventory/:id" element={<LegacyItemRedirect />} />
          <Route path="/purchases" element={<Navigate to="/app/purchases" replace />} />
          <Route path="/consumption" element={<Navigate to="/app/consumption" replace />} />
          <Route path="/alerts" element={<Navigate to="/app/alerts" replace />} />
          <Route path="/reports" element={<Navigate to="/app/reports" replace />} />
          <Route path="/categories" element={<Navigate to="/app/categories" replace />} />
          <Route path="/locations" element={<Navigate to="/app/locations" replace />} />
          <Route path="/suppliers" element={<Navigate to="/app/suppliers" replace />} />
          <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function LegacyItemRedirect() {
  const path = window.location.pathname.replace(/^\/inventory/, "/app/inventory");
  return <Navigate to={path} replace />;
}
