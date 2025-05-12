import React, { useState, useEffect } from "react";
import appFirebase from "../credenciales";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import "./home-details.css";
import ThemeToggle from './ThemeToggle';


const auth = getAuth(appFirebase);
const db = getFirestore(appFirebase);

const Home = ({ usuario }) => {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState("");
  const [tecnologias, setTecnologias] = useState("");
  const [colaboradores, setColaboradores] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar solo los proyectos del usuario actual
  useEffect(() => {
    const cargarMisProyectos = async () => {
      if (!usuario) return;
      
      setIsLoading(true);
      try {
        const proyectosRef = collection(db, "proyectos");
        const q = query(proyectosRef, where("usuario", "==", usuario.uid));
        const querySnapshot = await getDocs(q);
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

    cargarMisProyectos();
  }, [usuario]);

  const handleCrearProyecto = async (e) => {
    e.preventDefault();
    if (!titulo || !descripcion) return;

    try {
      const nuevoProyecto = {
        titulo,
        descripcion,
        imagen: imagen || "https://via.placeholder.com/300x200?text=Proyecto",
        tecnologias: tecnologias ? tecnologias.split(",").map(t => t.trim()) : [],
        colaboradores: colaboradores ? colaboradores.split(",").map(c => c.trim()) : [],
        fecha: new Date().toISOString(),
        usuario: usuario ? usuario.uid : "anónimo",
        nombreUsuario: usuario ? usuario.email.split('@')[0] : "anónimo",
        estado: "En desarrollo"
      };

      const docRef = await addDoc(collection(db, "proyectos"), nuevoProyecto);
      setProyectos([...proyectos, { id: docRef.id, ...nuevoProyecto }]);
      
      // Reset form fields
      setTitulo("");
      setDescripcion("");
      setImagen("");
      setTecnologias("");
      setColaboradores("");
      setMostrarFormulario(false);
      
    } catch (error) {
      console.error("Error creando el proyecto:", error);
    }
  };

  const handleCerrarSesion = () => {
    signOut(auth).then(() => {
      navigate("/");
    });
  };

  return (
    <div className="dashboard-container">
      {/* Header with user info */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>Mi OpenLab</h1>
          </div>
         <div className="user-section">
          {usuario && (
            <>
              <ThemeToggle />
              <div className="user-info">
                <span className="user-name">{usuario.email.split('@')[0]}</span>
                <span className="user-email">{usuario.email}</span>
              </div>
                <div className="user-avatar">
                  <span>{usuario.email[0].toUpperCase()}</span>
                </div>
                <button className="explore-btn" onClick={() => navigate("/explore")}>
                  <i className="fas fa-compass"></i>
                  <span>Explorar</span>
                </button>
                <button className="logout-btn" onClick={handleCerrarSesion}>
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Cerrar sesión</span>
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
            <h2>Bienvenido a tu espacio creativo, {usuario ? usuario.email.split('@')[0] : "Usuario"}</h2>
            <p>Crea, gestiona y comparte tus proyectos con la comunidad.</p>
          </div>
          <button 
            className={`new-project-btn ${mostrarFormulario ? 'active' : ''}`}
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
          >
            {mostrarFormulario ? (
              <>
                <i className="fas fa-times"></i>
                <span>Cancelar</span>
              </>
            ) : (
              <>
                <i className="fas fa-plus"></i>
                <span>Nuevo Proyecto</span>
              </>
            )}
          </button>
        </div>

        {/* New project form */}
        {mostrarFormulario && (
          <div className="form-container">
            <h3>Crear nuevo proyecto</h3>
            <form onSubmit={handleCrearProyecto} className="project-form">
              <div className="form-group">
                <label htmlFor="titulo">Título del proyecto <span className="required">*</span></label>
                <input
                  type="text"
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: App de gestión de tareas"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="descripcion">Descripción <span className="required">*</span></label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe tu proyecto en detalle"
                  rows="4"
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="imagen">URL de imagen (opcional)</label>
                <input
                  type="url"
                  id="imagen"
                  value={imagen}
                  onChange={(e) => setImagen(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
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
                <button type="button" className="cancel-btn" onClick={() => setMostrarFormulario(false)}>
                  Cancelar
                </button>
                <button type="submit" className="submit-btn">
                  <i className="fas fa-save"></i> Guardar Proyecto
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects display - SOLO MIS PROYECTOS */}
        <div className="projects-section">
          <h3>Mis Proyectos</h3>
          
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando tus proyectos...</p>
            </div>
          ) : proyectos.length === 0 ? (
            <div className="empty-projects">
              <i className="fas fa-folder-open empty-icon"></i>
              <h4>No tienes ningún proyecto creado aún</h4>
              <p>¡Crea tu primer proyecto haciendo clic en "Nuevo Proyecto"!</p>
            </div>
          ) : (
            <div className="projects-grid">
              {proyectos.map((proyecto) => (
                <div className="project-card" key={proyecto.id}>
                  <div 
                    className="project-image" 
                    style={{ backgroundImage: `url(${proyecto.imagen || "https://via.placeholder.com/300x200?text=Proyecto"})` }}
                  >
                    <div className="project-status">{proyecto.estado}</div>
                  </div>
                  <div className="project-content">
                    <h4>{proyecto.titulo}</h4>
                    <p className="project-description">{proyecto.descripcion.length > 100 
                      ? proyecto.descripcion.substring(0, 100) + "..." 
                      : proyecto.descripcion}
                    </p>
                    
                    {proyecto.tecnologias && proyecto.tecnologias.length > 0 && (
                      <div className="project-tech">
                        {proyecto.tecnologias.map((tech, index) => (
                          <span key={index} className="tech-tag">{tech}</span>
                        ))}
                      </div>
                    )}
                    
                    <div className="project-footer">
                      <div className="project-author">
                        <div className="author-avatar">
                          {(proyecto.nombreUsuario || "A")[0].toUpperCase()}
                        </div>
                        <span>{proyecto.nombreUsuario || "Anónimo"}</span>
                      </div>
                      
                      <button 
                        className="edit-btn"
                        onClick={() => navigate(`/proyecto/${proyecto.id}`)}
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <p>&copy; 2025 Mi OpenLab | Todos los derechos reservados</p>
          <div className="footer-links">
            <a href="#">Términos</a>
            <a href="#">Privacidad</a>
            <a href="#">Ayuda</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
