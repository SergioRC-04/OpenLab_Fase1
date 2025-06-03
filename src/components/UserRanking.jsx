import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import appFirebase from "../credenciales";
import { useNavigate } from "react-router-dom";
import "./UserRanking.css";

const db = getFirestore(appFirebase);

const UserRanking = ({ maxUsers = 10 }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reputation');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Obtener todos los usuarios
        const usersSnapshot = await getDocs(collection(db, "usuarios"));
        
        // Procesar los datos para el ranking
        const usersData = usersSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(user => user.puntos && user.nivel) // Solo usuarios con sistema de reputación inicializado
          .sort((a, b) => {
            // Ordenar según la pestaña activa
            if (activeTab === 'reputation') {
              return (b.puntos?.total || 0) - (a.puntos?.total || 0);
            } else if (activeTab === 'projects') {
              return (b.puntos?.porProyectos || 0) - (a.puntos?.porProyectos || 0);
            } else if (activeTab === 'likes') {
              return (b.puntos?.porLikes || 0) - (a.puntos?.porLikes || 0);
            } else {
              return (b.logros?.length || 0) - (a.logros?.length || 0);
            }
          })
          .slice(0, maxUsers);
        
        setUsers(usersData);
      } catch (error) {
        console.error("Error al cargar el ranking de usuarios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [activeTab, maxUsers]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleUserClick = (userId) => {
    // En una implementación futura, podrías redirigir a un perfil público
    // Por ahora simplemente mostramos un mensaje
    console.log(`Ver perfil de usuario ${userId}`);
    // navigate(`/user-profile/${userId}`); // Si implementas perfiles públicos
  };

  return (
    <div className="user-ranking-container">
      <div className="user-ranking-header">
        <h2>Ranking de Usuarios</h2>
        <p>Los usuarios con mayor puntuación en Mi OpenLab</p>
      </div>

      <div className="ranking-tabs">
        <button 
          className={`ranking-tab ${activeTab === 'reputation' ? 'active' : ''}`} 
          onClick={() => handleTabChange('reputation')}
        >
          Reputación Total
        </button>
        <button 
          className={`ranking-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => handleTabChange('projects')}
        >
          Proyectos
        </button>
        <button 
          className={`ranking-tab ${activeTab === 'likes' ? 'active' : ''}`}
          onClick={() => handleTabChange('likes')}
        >
          Likes
        </button>
        <button 
          className={`ranking-tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => handleTabChange('achievements')}
        >
          Logros
        </button>
      </div>

      {loading ? (
        <div className="ranking-loading">
          <div className="loading-spinner"></div>
          <p>Cargando ranking...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-ranking">
          <i className="fas fa-trophy"></i>
          <p>No hay suficientes usuarios para mostrar un ranking</p>
        </div>
      ) : (
        <div className="ranking-table">
          <div className="table-header">
            <div className="rank-col">Posición</div>
            <div className="user-col">Usuario</div>
            <div className="score-col">
              {activeTab === 'reputation' && 'Puntos Totales'}
              {activeTab === 'projects' && 'Puntos por Proyectos'}
              {activeTab === 'likes' && 'Puntos por Likes'}
              {activeTab === 'achievements' && 'Logros Conseguidos'}
            </div>
            <div className="level-col">Nivel</div>
          </div>
          
          <div className="table-body">
            {users.map((user, index) => (
              <div 
                key={user.id} 
                className="table-row"
                onClick={() => handleUserClick(user.id)}
              >
                <div className="rank-col">
                  <div className={`rank-badge rank-${index < 3 ? index + 1 : 'other'}`}>
                    {index + 1}
                  </div>
                </div>
                
                <div className="user-col">
                  <div className="user-avatar">
                    {user.nombre ? user.nombre[0].toUpperCase() : 'U'}
                  </div>
                  <div className="user-info">
                    <div className="user-name">
                      {user.nombre || (user.correo ? user.correo.split('@')[0] : 'Usuario')}
                    </div>
                    <div className="user-details">
                      {activeTab === 'reputation' && 
                        `${user.puntos?.total || 0} pts totales`}
                      {activeTab === 'projects' && 
                        `${user.puntos?.porProyectos || 0} pts en proyectos`}
                      {activeTab === 'likes' && 
                        `${user.puntos?.porLikes || 0} pts en likes`}
                      {activeTab === 'achievements' && 
                        `${user.logros?.length || 0} logros conseguidos`}
                    </div>
                  </div>
                </div>
                
                <div className="score-col">
                  {activeTab === 'reputation' && (user.puntos?.total || 0)}
                  {activeTab === 'projects' && (user.puntos?.porProyectos || 0)}
                  {activeTab === 'likes' && (user.puntos?.porLikes || 0)}
                  {activeTab === 'achievements' && (user.logros?.length || 0)}
                </div>
                
                <div className="level-col">
                  <div className="level-badge">
                    {user.nivel?.actual || 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRanking;