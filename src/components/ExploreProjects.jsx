import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import appFirebase from "../credenciales";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import "./home-details.css";
import ThemeToggle from "./ThemeToggle";
import LikeButton from "./LikeButton";
import UserRanking from "./UserRanking";

const db = getFirestore(appFirebase);

const ExploreProjects = ({ usuario }) => {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarProyectos = async () => {
      setIsLoading(true);
      try {
        const proyectosRef = collection(db, "proyectos");
        const querySnapshot = await getDocs(proyectosRef);
        const proyectosCargados = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProyectos(proyectosCargados);
      } catch (error) {
        console.error("Error cargando proyectos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarProyectos();
  }, []);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div
            className="logo-section"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            <h1>Mi OpenLab</h1>
          </div>
          <div className="user-section">
            <ThemeToggle />
            {usuario ? (
              <>
                <div className="user-info">
                  <span className="user-name">
                    {usuario.email.split("@")[0]}
                  </span>
                  <span className="user-email">{usuario.email}</span>
                </div>
                <div
                  className="user-avatar"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate("/profile")}
                  title="Ver perfil"
                >
                  <span>{usuario.email[0].toUpperCase()}</span>
                </div>
                <button className="nav-btn" onClick={() => navigate("/home")}>
                  <i className="fas fa-home"></i>
                  <span>Mi Dashboard</span>
                </button>
                <button className="logout-btn" onClick={() => navigate("/")}>
                  <i className="fas fa-arrow-left"></i>
                  <span>Volver</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className="nav-button"
                  onClick={() => navigate("/login")}
                >
                  Iniciar Sesión
                </button>
                <button className="nav-button" onClick={() => navigate("/")}>
                  <i className="fas fa-arrow-left"></i> Volver
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <div className="welcome-text">
            <h2>Proyectos Destacados</h2>
            <p>Descubre lo que la comunidad de Mi OpenLab está creando.</p>
          </div>
        </div>

        {/* Projects display */}
        <div className="projects-section">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando proyectos...</p>
            </div>
          ) : proyectos.length === 0 ? (
            <div className="empty-projects">
              <i className="fas fa-folder-open empty-icon"></i>
              <h4>No hay proyectos disponibles</h4>
              <p>¡Sé el primero en compartir un proyecto con la comunidad!</p>
            </div>
          ) : (
            <div className="projects-grid">
              {proyectos.map((proyecto) => (
                <div className="project-card" key={proyecto.id}>
                  <div
                    className="project-image"
                    style={{
                      backgroundImage: `url(${
                        proyecto.imagen ||
                        "https://via.placeholder.com/300x200?text=Proyecto"
                      })`,
                    }}
                  >
                    <div className="project-status">
                      {proyecto.estado || "Publicado"}
                    </div>
                  </div>
                  <div className="project-content">
                    <h4>{proyecto.titulo}</h4>
                    <p className="project-description">
                      {proyecto.descripcion?.length > 100
                        ? proyecto.descripcion.substring(0, 100) + "..."
                        : proyecto.descripcion}
                    </p>

                    {proyecto.tecnologias &&
                      proyecto.tecnologias.length > 0 && (
                        <div className="project-tech">
                          {proyecto.tecnologias.map((tech, index) => (
                            <span key={index} className="tech-tag">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                    <div className="project-footer">
                      <div
                        className="project-author"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (proyecto.usuario) {
                            navigate(`/profile/${proyecto.usuario}`);
                          }
                        }}
                        style={{ cursor: proyecto.usuario ? "pointer" : "default" }}
                        title={proyecto.usuario ? "Ver perfil" : ""}
                      >
                        <div className="author-avatar">
                          {(proyecto.nombreUsuario || proyecto.autor || "A")[0].toUpperCase()}
                        </div>
                        <span>
                          {proyecto.nombreUsuario || proyecto.autor || "Anónimo"}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "center",
                        }}
                      >
                        <LikeButton projectId={proyecto.id} currentUser={usuario} />
                        <button
                          className="view-details-btn"
                          onClick={() =>
                            navigate(`/project-details/${proyecto.id}`)
                          }
                        >
                          Ver detalles
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección de ranking */}
        <div className="section-divider"></div>
        <div className="ranking-section">
          <UserRanking maxUsers={5} />
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <p>&copy; 2025 Mi OpenLab | Todos los derechos reservados</p>
          <div className="footer-links">
            <a href="/">Inicio</a>
            <a href="/#about">Sobre nosotros</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ExploreProjects;

