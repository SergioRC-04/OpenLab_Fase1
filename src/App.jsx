import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/Home";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [usuario, setUsuario] = useState(null);

  return (
    <Router>
      <Routes>
        {/* Ruta protegida para Home */}
        <Route
          path="/"
          element={
            <ProtectedRoute usuario={usuario}>
              <Home correoUsuario={usuario?.email} />
            </ProtectedRoute>
          }
        />
        {/* Rutas públicas */}
        <Route path="/login" element={<Login setUsuario={setUsuario} />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
