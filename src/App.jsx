import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Home from "./components/Home";
import MyProjects from "./components/MyProjects";
import ProjectDetail from "./components/ProjectDetail";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./components/LandingPage"; // Import the new component
import "./App.css";

function App() {
  const [usuario, setUsuario] = useState(null);

  return (
    <Router>
      <Routes>
        {/* Ruta pública para LandingPage */}
        <Route path="/" element={<LandingPage />} /> {/* Set LandingPage as home */}

        {/* Ruta pública para Home */}
        <Route path="/home" element={<Home usuario={usuario} />} />

        {/* Ruta protegida para Mis Proyectos */}
        <Route
          path="/my-projects"
          element={
            <ProtectedRoute usuario={usuario}>
              <MyProjects />
            </ProtectedRoute>
          }
        />

        {/* Ruta protegida para Detalle de Proyecto */}
        <Route
          path="/proyecto/:id"
          element={
            <ProtectedRoute usuario={usuario}>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />

        {/* Rutas de autenticación */}
        <Route path="/login" element={<Login setUsuario={setUsuario} />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
