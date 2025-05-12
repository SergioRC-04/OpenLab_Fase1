import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import appFirebase from "../credenciales";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import "./home-details.css";
import ThemeToggle from './ThemeToggle';

const db = getFirestore(appFirebase);

const ProjectDetailPublic = ({ usuario }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proyecto, setProyecto] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarProyecto = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, "proyectos", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProyecto({
            id: docSnap.id,
            ...docSnap.data()
          });
        } else {
          console.log("No se encontró el proyecto.");
        }
      } catch (error) {
        console.error("Error cargando proyecto:", error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarProyecto();
  }, [id]);

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="logo-section" onClick={() => navigate("/")} style={{cursor: "pointer"}}>
              <h1>Mi OpenLab</h1>
            </div>
          </div>
        </header>
        <main className="dashboard-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando proyecto...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!proyecto) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="logo-section" onClick={() => navigate("/")} style={{cursor: "pointer"}}>
              <h1>Mi OpenLab</h1>
            </div>
          </div>
        </header>
        <main className="dashboard-main">
          <div className="empty-projects">
            <i className="fas fa-exclamation-triangle empty-icon"></i>
            <h4>Proyecto no encontrado</h4>
            <p>El proyecto que estás buscando no existe o ha sido eliminado.</p>
            <button 
              className="btn primary" 
              onClick={() => navigate("/explore")}
              style={{marginTop: "20px"}}
            >
              Volver a Explorar
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section" onClick={() => navigate("/")} style={{cursor: "pointer"}}>
            <h1>Mi OpenLab</h1>
          </div>
        <div className="user-section">
  <ThemeToggle />
  <button className="logout-btn" onClick={() => navigate("/explore")}>
    <i className="fas fa-arrow-left"></i>
    <span>Volver a Explorar</span>
  </button>
</div>
        </div>
      </header>
      
      <main className="dashboard-main">
        <div className="project-detail-card">
          <div className="project-detail-header">
            <div className="project-detail-title">
              <h2>{proyecto.titulo}</h2>
            </div>
            <div className="project-detail-author">
              <div className="author-avatar-large">
                {((proyecto.nombreUsuario || proyecto.autor || "A")[0]).toUpperCase()}
              </div>
              <span className="author-name">
                Por {proyecto.nombreUsuario || proyecto.autor || "Anónimo"}
              </span>
            </div>
          </div>
          
          <div className="project-detail-body">
            <h3>Descripción</h3>
            <div className="project-description-full">
              <p>{proyecto.descripcion}</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="dashboard-footer">
        <div className="footer-content">
          <p>&copy; 2025 Mi OpenLab | Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  );
};

export default ProjectDetailPublic;