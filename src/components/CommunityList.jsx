import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  orderBy,
  limit,
  where
} from "firebase/firestore";
import appFirebase from "../credenciales";
import "./CommunityList.css";

const db = getFirestore(appFirebase);

const CommunityList = ({ usuario }) => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCommunities = async () => {
      setLoading(true);
      try {
        let communitiesQuery;
        
        if (activeTab === "all") {
          communitiesQuery = query(
            collection(db, "communities"),
            orderBy("miembros", "desc"),
            limit(50)
          );
        } else if (activeTab === "my") {
          if (!usuario) {
            setCommunities([]);
            setLoading(false);
            return;
          }
          
          // Obtener primero las comunidades donde el usuario es miembro
          const memberQuery = query(
            collection(db, "community_members"),
            where("userId", "==", usuario.uid)
          );
          
          const memberSnapshot = await getDocs(memberQuery);
          const communityIds = memberSnapshot.docs.map(doc => doc.data().communityId);
          
          if (communityIds.length === 0) {
            setCommunities([]);
            setLoading(false);
            return;
          }
          
          communitiesQuery = query(
            collection(db, "communities"),
            where("__name__", "in", communityIds)
          );
        }
        
        const querySnapshot = await getDocs(communitiesQuery);
        
        const communitiesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filtrar por categoría si es necesario
        const filteredCommunities = categoryFilter 
          ? communitiesData.filter(community => community.categoria === categoryFilter)
          : communitiesData;
          
        setCommunities(filteredCommunities);
      } catch (error) {
        console.error("Error al cargar comunidades:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunities();
  }, [activeTab, categoryFilter, usuario]);

  const handleCommunityClick = (communityId) => {
    navigate(`/communities/${communityId}`);
  };
  
  const getCategories = () => {
    const categories = [...new Set(communities.map(c => c.categoria))];
    return categories;
  };

  return (
    <div className="communities-container">
      <div className="communities-header">
        <h2>Comunidades</h2>
        <p>Explora y únete a grupos de interés sobre temas específicos</p>
      </div>
      
      <div className="communities-tabs">
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Todas las comunidades
          </button>
          <button 
            className={`tab-button ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            Mis comunidades
          </button>
        </div>
        
        {communities.length > 0 && (
          <div className="category-filter">
            <select 
              value={categoryFilter} 
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {getCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="communities-loading">
          <div className="loading-spinner"></div>
          <p>Cargando comunidades...</p>
        </div>
      ) : communities.length === 0 ? (
        <div className="empty-communities">
          <i className="fas fa-users-slash"></i>
          <h3>No se encontraron comunidades</h3>
          {activeTab === "my" ? (
            <p>Aún no te has unido a ninguna comunidad. Explora todas las comunidades disponibles.</p>
          ) : categoryFilter ? (
            <p>No hay comunidades en la categoría seleccionada.</p>
          ) : (
            <p>No hay comunidades creadas todavía. ¡Sé el primero en crear una!</p>
          )}
          
          {activeTab === "my" && (
            <button 
              className="action-button"
              onClick={() => setActiveTab('all')}
            >
              <i className="fas fa-search"></i> Explorar comunidades
            </button>
          )}
        </div>
      ) : (
        <div className="communities-grid">
          {communities.map(community => (
            <div 
              key={community.id} 
              className="community-card"
              onClick={() => handleCommunityClick(community.id)}
            >
              <div 
                className="community-image" 
                style={{ backgroundImage: `url(${community.imagen || "https://via.placeholder.com/300x150?text=Comunidad"})` }}
              >
                <div className="community-category">{community.categoria}</div>
              </div>
              <div className="community-content">
                <h3>{community.nombre}</h3>
                <p>{community.descripcion}</p>
                <div className="community-stats">
                  <div className="stat">
                    <i className="fas fa-users"></i> {community.miembros || 0} miembros
                  </div>
                  <div className="stat">
                    <i className="fas fa-comments"></i> {community.discussions || 0} discusiones
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {usuario && (
        <div className="communities-actions">
          <button 
            className="create-community-btn"
            onClick={() => navigate('/communities/new')}
          >
            <i className="fas fa-plus"></i> Crear nueva comunidad
          </button>
        </div>
      )}
    </div>
  );
};

export default CommunityList;