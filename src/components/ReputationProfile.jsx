import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import appFirebase from "../credenciales";
import "./ReputationProfile.css";

const db = getFirestore(appFirebase);

const ReputationProfile = ({ userId }) => {
  const [userData, setUserData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [likes, setLikes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Obtener datos de usuario
        const userDoc = await getDoc(doc(db, "usuarios", userId));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
        
        // Obtener proyectos del usuario
        const projectsQuery = query(collection(db, "proyectos"), where("usuario", "==", userId));
        const projectsSnapshot = await getDocs(projectsQuery);
        setProjects(projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Obtener likes recibidos en todos los proyectos del usuario
        let totalLikes = 0;
        for (const projectDoc of projectsSnapshot.docs) {
          const likesQuery = query(collection(db, "likes"), where("projectId", "==", projectDoc.id));
          const likesSnapshot = await getDocs(likesQuery);
          totalLikes += likesSnapshot.size;
        }
        setLikes(totalLikes);
      } catch (error) {
        console.error("Error al cargar datos de usuario:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (loading) {
    return <div className="reputation-loading"><div className="loading-spinner"></div></div>;
  }

  if (!userData) {
    return <div className="reputation-error">No se encontró información del usuario</div>;
  }

  // Asegurar que existen las estructuras de datos
  const puntos = userData.puntos || { total: 0 };
  const nivel = userData.nivel || { actual: 1, progreso: 0, siguienteNivel: 100 };
  const logros = userData.logros || [];

  return (
    <div className="reputation-profile">
      <h2>Perfil de Reputación</h2>
      
      {/* Tarjeta de nivel */}
      <div className="level-card">
        <div className="level-header">
          <h3>Nivel {nivel.actual}</h3>
          <div className="level-points">{puntos.total} puntos</div>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${nivel.progreso}%` }}
          ></div>
        </div>
        <div className="level-info">
          {nivel.progreso}% completado para nivel {nivel.actual + 1}
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="stats-summary">
        <div className="stat-item">
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">Proyectos</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{likes}</div>
          <div className="stat-label">Likes recibidos</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{logros.length}</div>
          <div className="stat-label">Logros</div>
        </div>
      </div>

      {/* Desglose de puntos */}
      <div className="points-breakdown">
        <h3>Desglose de Puntos</h3>
        <div className="points-grid">
          <div className="points-item">
            <div className="points-value">{puntos.porProyectos || 0}</div>
            <div className="points-label">Proyectos</div>
          </div>
          <div className="points-item">
            <div className="points-value">{puntos.porLikes || 0}</div>
            <div className="points-label">Likes</div>
          </div>
          <div className="points-item">
            <div className="points-value">{puntos.porComentarios || 0}</div>
            <div className="points-label">Comentarios</div>
          </div>
          <div className="points-item">
            <div className="points-value">{puntos.porLogros || 0}</div>
            <div className="points-label">Logros</div>
          </div>
        </div>
      </div>

      {/* Logros */}
      <div className="achievements">
        <h3>Logros Conseguidos</h3>
        {logros.length === 0 ? (
          <div className="empty-achievements">
            <p>¡Todavía no has conseguido ningún logro!</p>
            <p>Sigue creando y compartiendo proyectos para desbloquear logros.</p>
          </div>
        ) : (
          <div className="achievements-grid">
            {logros.map((logro) => (
              <div key={logro.id} className="achievement-item">
                <div className="achievement-icon">{logro.icono}</div>
                <div className="achievement-info">
                  <div className="achievement-name">{logro.nombre}</div>
                  <div className="achievement-desc">{logro.descripcion}</div>
                  <div className="achievement-date">
                    Conseguido el {logro.fechaConseguido ? new Date(logro.fechaConseguido.seconds * 1000).toLocaleDateString() : 'fecha desconocida'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReputationProfile;