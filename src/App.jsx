import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./components/Home";
import MyProjects from "./components/MyProjects";
import ProjectDetail from "./components/ProjectDetail";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./components/landingpage";
import ExploreProjects from "./components/ExploreProjects";
import ProjectDetailPublic from "./components/ProjectDetailPublic";
import "./app.css";
import Profile from "./components/Profile";
import { initReputacionUsuario } from "./utils/initReputacion";
import { corregirLikesExistentes } from "./utils/likesManager";
import RankingPage from "./components/RankingPage";

function App() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Solo ejecutar cuando la aplicación inicie y tengamos usuario autenticado
    if (usuario) {
      const inicializarReputacion = async () => {
        try {
          await initReputacionUsuario(usuario.uid);
          console.log("Sistema de reputación verificado");
        } catch (error) {
          console.error("Error al verificar sistema de reputación:", error);
        }
      };

      inicializarReputacion();
    }
  }, [usuario]); // Solo se ejecuta cuando el usuario cambia (login)

  useEffect(() => {
    const verificarLikes = async () => {
      if (usuario && usuario.uid) {
        try {
          // Solo el primer usuario que acceda corregirá los likes una vez por sesión
          const likesCorregidos = sessionStorage.getItem('likesCorregidos');
          if (!likesCorregidos) {
            console.log("Verificando y corrigiendo likes...");
            const resultado = await corregirLikesExistentes();
            console.log(`Likes procesados: ${resultado.total}, Corregidos: ${resultado.corregidos}, Eliminados: ${resultado.eliminados}`);
            sessionStorage.setItem('likesCorregidos', 'true');
          }
        } catch (error) {
          console.error("Error al verificar likes:", error);
        }
      }
    };
    
    verificarLikes();
  }, [usuario]);

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Ruta pública para LandingPage */}
          <Route
            path="/"
            element={<LandingPage usuario={usuario} setUsuario={setUsuario} />}
          />

          {/* Nuevas rutas para explorar proyectos - accesibles sin login */}
          <Route
            path="/explore"
            element={<ExploreProjects usuario={usuario} />}
          />
          <Route
            path="/project-details/:id"
            element={<ProjectDetailPublic usuario={usuario} />}
          />

          {/* Ruta pública para Home */}
          <Route
            path="/home"
            element={<Home setUsuario={setUsuario} usuario={usuario} />}
          />

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
          <Route
            path="/profile"
            element={
              <ProtectedRoute usuario={usuario}>
                <Profile usuario={usuario} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ranking"
            element={<RankingPage usuario={usuario} />}
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
