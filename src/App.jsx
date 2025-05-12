import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./components/Home";
import MyProjects from "./components/MyProjects";
import ProjectDetail from "./components/ProjectDetail";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./components/LandingPage"; 
import ExploreProjects from "./components/ExploreProjects"; // Importar nuevo componente
import ProjectDetailPublic from "./components/ProjectDetailPublic"; // Importar nuevo componente
import "./App.css";

function App() {
  const [usuario, setUsuario] = useState(null);

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Ruta pública para LandingPage */}
          <Route path="/" element={<LandingPage />} />

          {/* Nuevas rutas para explorar proyectos - accesibles sin login */}
          <Route path="/explore" element={<ExploreProjects usuario={usuario} />} />
          <Route path="/project-details/:id" element={<ProjectDetailPublic usuario={usuario} />} />

          {/* Ruta pública para Home */}
          <Route path="/home" element={<Home usuario={usuario} />} />

          {/* Rutas protegidas */}
          <Route
            path="/my-projects"
            element={
              <ProtectedRoute usuario={usuario}>
                <MyProjects />
              </ProtectedRoute>
            }
          />

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
    </ThemeProvider>
  );
}

export default App;
