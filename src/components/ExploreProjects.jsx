"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import appFirebase from "../credenciales"
import { getFirestore, collection, getDocs } from "firebase/firestore"
import "./home-details.css"
import ThemeToggle from "./ThemeToggle"
import LikeButton from "./LikeButton"
import UserRanking from "./UserRanking"

const db = getFirestore(appFirebase)

const ExploreProjects = ({ usuario }) => {
  const navigate = useNavigate()
  const [proyectos, setProyectos] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedTechnology, setSelectedTechnology] = useState("")

  useEffect(() => {
    const cargarProyectos = async () => {
      setIsLoading(true)
      try {
        const proyectosRef = collection(db, "proyectos")
        const querySnapshot = await getDocs(proyectosRef)
        const proyectosCargados = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((proyecto) => proyecto.visibilidad === true) // 🔥 solo visibles

        setProyectos(proyectosCargados)
      } catch (error) {
        console.error("Error cargando proyectos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    cargarProyectos()
  }, [])

  // Extraer tecnologías únicas de todos los proyectos
  const uniqueTechnologies = useMemo(() => {
    const allTechnologies = proyectos.flatMap((proyecto) => proyecto.tecnologias || [])
    return [...new Set(allTechnologies)].sort()
  }, [proyectos])

  // Filtrar proyectos basado en los criterios de búsqueda
  const filteredProjects = useMemo(() => {
    return proyectos.filter((proyecto) => {
      // Filtro por nombre (búsqueda)
      const matchesSearch = proyecto.titulo?.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtro por estado
      const matchesStatus = selectedStatus === "" || proyecto.estado === selectedStatus

      // Filtro por tecnología
      const matchesTechnology =
        selectedTechnology === "" || (proyecto.tecnologias && proyecto.tecnologias.includes(selectedTechnology))

      return matchesSearch && matchesStatus && matchesTechnology
    })
  }, [proyectos, searchTerm, selectedStatus, selectedTechnology])

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <h1>Mi OpenLab</h1>
          </div>
          <div className="user-section">
            <ThemeToggle />
            {usuario ? (
              <>
                <div className="user-info">
                  <span className="user-name">{usuario.email.split("@")[0]}</span>
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
                <button className="nav-button" onClick={() => navigate("/login")}>
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

        {/* Filtros y búsqueda */}
        <div
          className="filters-section"
          style={{
            display: "flex",
            gap: "15px",
            marginBottom: "20px",
            padding: "20px",
            backgroundColor: "var(--card-bg, #ffffff)",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Barra de búsqueda */}
          <div style={{ flex: "1", minWidth: "250px" }}>
            <div style={{ position: "relative" }}>
              <i
                className="fas fa-search"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary, #666)",
                  fontSize: "14px",
                }}
              ></i>
              <input
                type="text"
                placeholder="Buscar proyectos por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  border: "2px solid var(--border-color, #e1e5e9)",
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: "var(--input-bg, #ffffff)",
                  color: "var(--text-primary, #333)",
                  transition: "border-color 0.2s ease",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary-color, #007bff)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border-color, #e1e5e9)")}
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div style={{ minWidth: "180px" }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid var(--border-color, #e1e5e9)",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "var(--input-bg, #ffffff)",
                color: "var(--text-primary, #333)",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">Todos los estados</option>
              <option value="En desarrollo">En desarrollo</option>
              <option value="Terminado">Terminado</option>
            </select>
          </div>

          {/* Filtro por tecnología */}
          <div style={{ minWidth: "180px" }}>
            <select
              value={selectedTechnology}
              onChange={(e) => setSelectedTechnology(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid var(--border-color, #e1e5e9)",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "var(--input-bg, #ffffff)",
                color: "var(--text-primary, #333)",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="">Todas las tecnologías</option>
              {uniqueTechnologies.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>
          </div>

          {/* Contador de resultados */}
          <div
            style={{
              fontSize: "14px",
              color: "var(--text-secondary, #666)",
              fontWeight: "500",
            }}
          >
            {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? "s" : ""} encontrado
            {filteredProjects.length !== 1 ? "s" : ""}
          </div>

          {/* Botón para limpiar filtros */}
          {(searchTerm || selectedStatus || selectedTechnology) && (
            <button
              onClick={() => {
                setSearchTerm("")
                setSelectedStatus("")
                setSelectedTechnology("")
              }}
              style={{
                padding: "8px 16px",
                backgroundColor: "var(--danger-color, #dc3545)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "var(--danger-hover, #c82333)")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "var(--danger-color, #dc3545)")}
            >
              <i className="fas fa-times" style={{ marginRight: "5px" }}></i>
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Projects display */}
        <div className="projects-section">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando proyectos...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-projects">
              <i className="fas fa-search empty-icon"></i>
              <h4>{proyectos.length === 0 ? "No hay proyectos disponibles" : "No se encontraron proyectos"}</h4>
              <p>
                {proyectos.length === 0
                  ? "¡Sé el primero en compartir un proyecto con la comunidad!"
                  : "Intenta ajustar los filtros de búsqueda."}
              </p>
            </div>
          ) : (
            <div className="projects-grid">
              {filteredProjects.map((proyecto) => (
                <div className="project-card" key={proyecto.id}>
                  <div
                    className="project-image"
                    style={{
                      backgroundImage: `url(${proyecto.imagen || "https://via.placeholder.com/300x200?text=Proyecto"})`,
                    }}
                  >
                    <div className="project-status">{proyecto.estado || "Publicado"}</div>
                  </div>
                  <div className="project-content">
                    <h4>{proyecto.titulo}</h4>
                    <p className="project-description">
                      {proyecto.descripcion?.length > 100
                        ? proyecto.descripcion.substring(0, 100) + "..."
                        : proyecto.descripcion}
                    </p>

                    {proyecto.tecnologias && proyecto.tecnologias.length > 0 && (
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
                          e.stopPropagation()
                          if (proyecto.usuario) {
                            navigate(`/profile/${proyecto.usuario}`)
                          }
                        }}
                        style={{ cursor: proyecto.usuario ? "pointer" : "default" }}
                        title={proyecto.usuario ? "Ver perfil" : ""}
                      >
                        <div className="author-avatar">
                          {(proyecto.nombreUsuario || proyecto.autor || "A")[0].toUpperCase()}
                        </div>
                        <span>{proyecto.nombreUsuario || proyecto.autor || "Anónimo"}</span>
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
                          onClick={() => navigate(`/project-details/${proyecto.id}`)}
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
  )
}

export default ExploreProjects
