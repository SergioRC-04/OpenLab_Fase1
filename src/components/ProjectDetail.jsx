import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import appFirebase from "../credenciales";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import "./home-details.css";
import { ThemeContext } from "../contexts/ThemeContext";
import ThemeToggle from "./ThemeToggle";

const db = getFirestore(appFirebase);

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proyecto, setProyecto] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState("");
  const [tecnologias, setTecnologias] = useState("");
  const [colaboradores, setColaboradores] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    const cargarProyecto = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, "proyectos", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProyecto(data);
          setTitulo(data.titulo);
          setDescripcion(data.descripcion);
          setImagen(data.imagen || "");
          setTecnologias(data.tecnologias?.join(", ") || "");
          setColaboradores(data.colaboradores?.join(", ") || "");
          setError(null);
        } else {
          setError("No se encontró el proyecto");
          console.log("No se encontró el proyecto.");
        }
      } catch (err) {
        setError(`Error al cargar el proyecto: ${err.message}`);
        console.error("Error cargando proyecto:", err);
      } finally {
        setIsLoading(false);
      }
    };

    cargarProyecto();
  }, [id]);

  const handleEditarProyecto = async () => {
    try {
      const proyectoRef = doc(db, "proyectos", id);
      await updateDoc(proyectoRef, {
        titulo,
        descripcion,
        imagen,
        tecnologias: tecnologias ? tecnologias.split(",").map((tec) => tec.trim()) : [],
        colaboradores: colaboradores ? colaboradores.split(",").map((col) => col.trim()) : [],
      });
      
      alert("Proyecto actualizado exitosamente");
      navigate("/home");
    } catch (error) {
      console.error("Error al editar el proyecto:", error);
      alert(`Error al actualizar: ${error.message}`);
    }
  };

  const handleEliminarProyecto = async () => {
    const confirmacion = window.confirm(
      "¿Estás seguro de eliminar este proyecto?"
    );
    if (!confirmacion) return;

    const proyectoRef = doc(db, "proyectos", id);
    try {
      await deleteDoc(proyectoRef);
      alert("Proyecto eliminado exitosamente");
      navigate("/");
    } catch (error) {
      console.error("Error al eliminar el proyecto:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="logo-section">
              <h1>Mi OpenLab</h1>
            </div>
            <div className="user-section">
              <ThemeToggle />
              <button className="nav-button" onClick={() => navigate("/home")}>
                <i className="fas fa-arrow-left"></i> Volver al Dashboard
              </button>
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

  if (error) {
    return (
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="logo-section">
              <h1>Mi OpenLab</h1>
            </div>
            <div className="user-section">
              <ThemeToggle />
              <button className="nav-button" onClick={() => navigate("/home")}>
                <i className="fas fa-arrow-left"></i> Volver al Dashboard
              </button>
            </div>
          </div>
        </header>
        <main className="dashboard-main">
          <div className="empty-projects">
            <i className="fas fa-exclamation-triangle empty-icon"></i>
            <h4>Error</h4>
            <p>{error}</p>
            <button className="btn primary" onClick={() => navigate("/home")} style={{marginTop: "20px"}}>
              Volver al Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${darkMode ? "dark-mode" : ""}`}>
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>Mi OpenLab</h1>
          </div>
          <div className="user-section">
            <ThemeToggle />
            <button className="nav-button" onClick={() => navigate("/home")}>
              <i className="fas fa-arrow-left"></i> Volver al Dashboard
            </button>
          </div>
        </div>
      </header>
      
      <main className="dashboard-main">
        <div className="project-edit-container">
          <div className="project-edit-header">
            <h2>Editar Proyecto</h2>
            <p>Actualiza la información de tu proyecto</p>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); handleEditarProyecto(); }} className="project-edit-form">
            <div className="form-group">
              <label htmlFor="titulo">Título del proyecto</label>
              <input
                type="text"
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="descripcion">Descripción</label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows="5"
                required
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="imagen">URL de imagen</label>
              <input
                type="url"
                id="imagen"
                value={imagen}
                onChange={(e) => setImagen(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              {imagen && (
                <div className="imagen-preview">
                  <img src={imagen} alt="Vista previa" />
                </div>
              )}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tecnologias">Tecnologías (separadas por comas)</label>
                <input
                  type="text"
                  id="tecnologias"
                  value={tecnologias}
                  onChange={(e) => setTecnologias(e.target.value)}
                  placeholder="React, Firebase, CSS"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="colaboradores">Colaboradores (separados por comas)</label>
                <input
                  type="text"
                  id="colaboradores"
                  value={colaboradores}
                  onChange={(e) => setColaboradores(e.target.value)}
                  placeholder="juan@email.com, maria@email.com"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" className="delete-btn" onClick={handleEliminarProyecto}>
                <i className="fas fa-trash"></i> Eliminar
              </button>
              <div className="right-actions">
                <button type="button" className="cancel-btn" onClick={() => navigate("/home")}>
                  Cancelar
                </button>
                <button type="submit" className="save-btn">
                  <i className="fas fa-save"></i> Guardar Cambios
                </button>
              </div>
            </div>
          </form>
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

export default ProjectDetail;
