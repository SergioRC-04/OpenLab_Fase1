import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot
} from "firebase/firestore";
import appFirebase from "../credenciales";
import "./FavoriteProjects.css";

const db = getFirestore(appFirebase);

const FavoriteProjects = ({ userId }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    setLoading(true);

    // Crear una consulta para obtener los favoritos del usuario
    const favoritesQuery = query(
      collection(db, "favorites"),
      where("userId", "==", userId)
    );

    // Usar onSnapshot para actualizaciones en tiempo real
    const unsubscribe = onSnapshot(favoritesQuery, async (snapshot) => {
      try {
        const favoritesData = [];

        // Para cada favorito, obtener los detalles del proyecto
        for (const favoriteDoc of snapshot.docs) {
          const favorite = favoriteDoc.data();
          const projectId = favorite.projectId;

          // Obtener detalles del proyecto
          try {
            const projectDoc = await getDoc(doc(db, "proyectos", projectId));
            
            if (projectDoc.exists()) {
              const projectData = projectDoc.data();
              favoritesData.push({
                favoriteId: favoriteDoc.id,
                projectId,
                addedAt: favorite.addedAt,
                ...projectData
              });
            } else {
              console.log(`El proyecto ${projectId} ya no existe`);
            }
          } catch (err) {
            console.error(`Error obteniendo el proyecto ${projectId}:`, err);
          }
        }

        // Ordenar por fecha de adición (los más recientes primero)
        favoritesData.sort((a, b) => {
          const dateA = a.addedAt ? new Date(a.addedAt.toDate()) : new Date(0);
          const dateB = b.addedAt ? new Date(b.addedAt.toDate()) : new Date(0);
          return dateB - dateA;
        });

        setFavorites(favoritesData);
      } catch (error) {
        console.error("Error cargando favoritos:", error);
      } finally {
        setLoading(false);
      }
    });

    // Limpieza al desmontar
    return () => unsubscribe();
  }, [userId]);

  const handleProjectClick = (projectId) => {
    navigate(`/project-details/${projectId}`);
  };

  if (loading) {
    return (
      <div className="favorites-loading">
        <div className="loading-spinner"></div>
        <p>Cargando proyectos favoritos...</p>
      </div>
    );
  }

  return (
    <div className="favorite-projects">
      <h3>Proyectos Favoritos</h3>
      
      {favorites.length === 0 ? (
        <div className="empty-favorites">
          <i className="fas fa-bookmark"></i>
          <p>No tienes proyectos guardados como favoritos</p>
          <p>Explora proyectos y guarda los que te interesen</p>
          <button className="explore-button" onClick={() => navigate('/explore')}>
            <i className="fas fa-search"></i> Explorar Proyectos
          </button>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((project) => (
            <div 
              key={project.favoriteId} 
              className="favorite-project-card"
              onClick={() => handleProjectClick(project.projectId)}
            >
              <div 
                className="favorite-project-image" 
                style={{ 
                  backgroundImage: `url(${project.imagen || "https://via.placeholder.com/300x200?text=Proyecto"})` 
                }}
              >
                <div className="favorite-project-status">
                  {project.estado || "Publicado"}
                </div>
              </div>
              <div className="favorite-project-content">
                <h4>{project.titulo || "Sin título"}</h4>
                <p className="favorite-project-description">
                  {project.descripcion
                    ? project.descripcion.length > 80
                      ? project.descripcion.substring(0, 80) + "..."
                      : project.descripcion
                    : "Sin descripción"}
                </p>
                
                {project.tecnologias && project.tecnologias.length > 0 && (
                  <div className="favorite-project-tech">
                    {project.tecnologias.slice(0, 3).map((tech, index) => (
                      <span key={index} className="tech-tag small">
                        {tech}
                      </span>
                    ))}
                    {project.tecnologias.length > 3 && (
                      <span className="tech-tag small more">
                        +{project.tecnologias.length - 3}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="favorite-project-footer">
                  <div className="favorite-added-date">
                    <i className="far fa-calendar-plus"></i>
                    Guardado: {project.addedAt 
                      ? new Date(project.addedAt.toDate()).toLocaleDateString() 
                      : "Fecha desconocida"}
                  </div>
                  <button className="view-favorite-btn">
                    Ver detalles <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoriteProjects;