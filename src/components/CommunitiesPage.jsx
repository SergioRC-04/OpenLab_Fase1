import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  limit
} from "firebase/firestore";
import appFirebase from "../credenciales";
import ThemeToggle from "./ThemeToggle";
import "./CommunitiesPage.css";
import ReputacionService from "../services/ReputacionService";

const db = getFirestore(appFirebase);

const CommunitiesPage = ({ usuario }) => {
  const navigate = useNavigate();
  
  const [communities, setCommunities] = useState([]);
  const [featuredCommunities, setFeaturedCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  
  const [newCommunity, setNewCommunity] = useState({
    nombre: "",
    descripcion: "",
    categoria: "Programación",
    imagen: "",
    tags: []
  });
  const [currentTag, setCurrentTag] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const fetchCommunities = async () => {
      setLoading(true);
      try {
        // Obtener comunidades destacadas
        const featuredQuery = query(
          collection(db, "communities"),
          where("destacado", "==", true),
          limit(3)
        );
        
        const featuredSnapshot = await getDocs(featuredQuery);
        const featuredData = featuredSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFeaturedCommunities(featuredData);
        
        // Si no hay comunidades destacadas, usar las más populares
        if (featuredData.length === 0) {
          const popularQuery = query(
            collection(db, "communities"),
            orderBy("miembros", "desc"),
            limit(3)
          );
          
          const popularSnapshot = await getDocs(popularQuery);
          const popularData = popularSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setFeaturedCommunities(popularData);
        }
        
        // Obtener todas las comunidades
        const communitiesQuery = query(
          collection(db, "communities"),
          orderBy("miembros", "desc")
        );
        
        const communitiesSnapshot = await getDocs(communitiesQuery);
        const communitiesData = communitiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setCommunities(communitiesData);
      } catch (error) {
        console.error("Error al cargar comunidades:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunities();
  }, []);
  
  const handleCreateCommunity = async () => {
    if (!usuario) {
      alert("Debes iniciar sesión para crear una comunidad");
      return navigate("/login");
    }
    
    if (!newCommunity.nombre.trim() || !newCommunity.descripcion.trim()) {
      alert("El nombre y la descripción son obligatorios");
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Datos de la nueva comunidad
      const communityData = {
        ...newCommunity,
        creador: usuario.uid,
        creadorNombre: usuario.email.split("@")[0],
        fechaCreacion: serverTimestamp(),
        miembros: 1,
        destacado: false
      };
      
      // Crear la comunidad
      const docRef = await addDoc(collection(db, "communities"), communityData);
      
      // Añadir al usuario como miembro/admin de la comunidad
      await addDoc(collection(db, "community_members"), {
        communityId: docRef.id,
        userId: usuario.uid,
        role: "admin", // El creador es administrador
        joinedAt: serverTimestamp()
      });
      
      // Otorgar puntos de reputación por crear comunidad
      await ReputacionService.otorgarPuntos(usuario.uid, "porActividad", 20);
      
      // Cerrar modal y navegar a la comunidad
      setShowCreateModal(false);
      
      // Mostrar mensaje de éxito
      alert("¡Comunidad creada con éxito!");
      
      // Navegar a la comunidad
      navigate(`/communities/${docRef.id}`);
      
    } catch (error) {
      console.error("Error al crear comunidad:", error);
      alert("Ha ocurrido un error al crear la comunidad");
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleAddTag = () => {
    if (!currentTag.trim()) return;
    
    if (newCommunity.tags.includes(currentTag.trim())) {
      alert("Esta etiqueta ya ha sido añadida");
      return;
    }
    
    if (newCommunity.tags.length >= 10) {
      alert("Máximo 10 etiquetas por comunidad");
      return;
    }
    
    setNewCommunity({
      ...newCommunity,
      tags: [...newCommunity.tags, currentTag.trim()]
    });
    setCurrentTag("");
  };
  
  const handleRemoveTag = (tagToRemove) => {
    setNewCommunity({
      ...newCommunity,
      tags: newCommunity.tags.filter(tag => tag !== tagToRemove)
    });
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  // Filtrar comunidades según búsqueda y categoría
  const filteredCommunities = communities.filter(community => {
    const matchesSearch = 
      community.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      community.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "Todas" || community.categoria === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="communities-page">
      {/* Header */}
      <header className="communities-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Mi OpenLab</h1>
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
                  onClick={() => navigate("/profile")}
                  title="Ver perfil"
                >
                  <span>{usuario.email[0].toUpperCase()}</span>
                </div>
                <button className="nav-btn" onClick={() => navigate("/home")}>
                  <i className="fas fa-home"></i> Dashboard
                </button>
                <button 
                  className="create-community-btn" 
                  onClick={() => navigate("/create-community")}
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "white",
                    borderRadius: "20px",
                    padding: "8px 16px",
                  }}
                >
                  <i className="fas fa-plus-circle"></i> Crear Comunidad
                </button>
              </>
            ) : (
              <>
                <button className="nav-button" onClick={() => navigate("/login")}>
                  Iniciar Sesión
                </button>
                <button className="nav-button" onClick={() => navigate("/explore")}>
                  <i className="fas fa-search"></i> Explorar Proyectos
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero section */}
      <div className="communities-hero">
        <div className="hero-content">
          <h1>Comunidades Mi OpenLab</h1>
          <p>Conéctate con otros desarrolladores, comparte conocimientos y aprende juntos en nuestras comunidades temáticas.</p>
          {usuario && (
            <button 
              className="create-community-btn" 
              onClick={() => setShowCreateModal(true)}
            >
              <i className="fas fa-plus-circle"></i> Crear nueva comunidad
            </button>
          )}
        </div>
      </div>

      {/* Featured communities */}
      <section className="featured-communities">
        <h2>Comunidades Destacadas</h2>
        <div className="featured-grid">
          {featuredCommunities.length === 0 ? (
            <div className="empty-communities" style={{ gridColumn: "1 / -1" }}>
              <p>No hay comunidades destacadas en este momento.</p>
              {usuario && (
                <button 
                  className="create-community-btn" 
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "white"
                  }}
                >
                  <i className="fas fa-plus-circle"></i> Sé el primero en crear una comunidad
                </button>
              )}
            </div>
          ) : (
            featuredCommunities.map(community => (
              <div 
                key={community.id} 
                className="featured-community-card"
                onClick={() => navigate(`/communities/${community.id}`)}
              >
                <div 
                  className="community-banner" 
                  style={{ 
                    backgroundImage: community.imagen 
                      ? `url(${community.imagen})` 
                      : `url(https://via.placeholder.com/800x400?text=${encodeURIComponent(community.nombre)})` 
                  }}
                >
                  <div className="community-members">
                    <i className="fas fa-users"></i> {community.miembros || 0} miembros
                  </div>
                </div>
                <div className="community-content">
                  <h3>{community.nombre}</h3>
                  <p>{community.descripcion}</p>
                  <div className="community-tags">
                    {community.tags?.slice(0, 5).map(tag => (
                      <span key={tag} className="community-tag">{tag}</span>
                    ))}
                    {community.tags?.length > 5 && (
                      <span className="more-tag">+{community.tags.length - 5}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Tools for search and filter */}
      <div className="communities-tools">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Buscar comunidades por nombre, descripción o etiquetas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <label>Categoría:</label>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="Todas">Todas</option>
            <option value="Programación">Programación</option>
            <option value="Diseño">Diseño</option>
            <option value="Inteligencia Artificial">Inteligencia Artificial</option>
            <option value="DevOps">DevOps</option>
            <option value="Móvil">Desarrollo Móvil</option>
            <option value="Frontend">Frontend</option>
            <option value="Backend">Backend</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
      </div>

      {/* Communities list */}
      <main className="communities-list">
        <h2>Todas las comunidades</h2>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando comunidades...</p>
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="empty-communities">
            <i className="fas fa-users-slash"></i>
            <h3>No hay comunidades que coincidan con tu búsqueda</h3>
            <p>Intenta con otros términos o crea una nueva comunidad</p>
            {usuario && (
              <button 
                className="create-community-btn" 
                onClick={() => setShowCreateModal(true)}
                style={{
                  backgroundColor: "var(--primary)",
                  color: "white"
                }}
              >
                <i className="fas fa-plus-circle"></i> Crear nueva comunidad
              </button>
            )}
          </div>
        ) : (
          <div className="communities-grid">
            {filteredCommunities.map(community => (
              <div 
                key={community.id} 
                className="community-card"
                onClick={() => navigate(`/communities/${community.id}`)}
              >
                <div className="community-icon">
                  {community.imagen ? (
                    <img src={community.imagen} alt={community.nombre} />
                  ) : (
                    <div className="placeholder-icon">{community.nombre[0].toUpperCase()}</div>
                  )}
                </div>
                <div className="community-info">
                  <h3>{community.nombre}</h3>
                  <p className="community-description">
                    {community.descripcion?.length > 100
                      ? community.descripcion.substring(0, 100) + "..."
                      : community.descripcion}
                  </p>
                  <div className="community-meta">
                    <span className="community-category">
                      <i className="fas fa-tag"></i> {community.categoria}
                    </span>
                    <span className="community-members">
                      <i className="fas fa-users"></i> {community.miembros || 0}
                    </span>
                  </div>
                  {community.tags && community.tags.length > 0 && (
                    <div className="community-tags small">
                      {community.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="community-tag">{tag}</span>
                      ))}
                      {community.tags.length > 3 && (
                        <span className="more-tag">+{community.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal para crear comunidad */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Crear Nueva Comunidad</h2>
              <button 
                className="close-modal-btn" 
                onClick={() => setShowCreateModal(false)}
                aria-label="Cerrar"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre de la comunidad *</label>
                <input 
                  type="text" 
                  value={newCommunity.nombre}
                  onChange={e => setNewCommunity({...newCommunity, nombre: e.target.value})}
                  placeholder="Ej: Desarrolladores React"
                  maxLength={50}
                />
              </div>
              <div className="form-group">
                <label>Descripción *</label>
                <textarea 
                  value={newCommunity.descripcion}
                  onChange={e => setNewCommunity({...newCommunity, descripcion: e.target.value})}
                  placeholder="Describe el propósito de esta comunidad..."
                  rows={4}
                  maxLength={500}
                ></textarea>
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select
                  value={newCommunity.categoria}
                  onChange={e => setNewCommunity({...newCommunity, categoria: e.target.value})}
                >
                  <option value="Programación">Programación</option>
                  <option value="Diseño">Diseño</option>
                  <option value="Inteligencia Artificial">Inteligencia Artificial</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Móvil">Desarrollo Móvil</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div className="form-group">
                <label>Imagen (URL)</label>
                <input 
                  type="text" 
                  value={newCommunity.imagen}
                  onChange={e => setNewCommunity({...newCommunity, imagen: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
                {newCommunity.imagen && (
                  <div className="image-preview" style={{ marginTop: "10px" }}>
                    <img 
                      src={newCommunity.imagen} 
                      alt="Vista previa" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/800x400?text=Imagen+no+disponible";
                      }}
                      style={{ width: "100%", borderRadius: "8px" }}
                    />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Etiquetas <small>(máx. 10)</small></label>
                <div className="tags-input">
                  <input 
                    type="text" 
                    value={currentTag}
                    onChange={e => setCurrentTag(e.target.value)}
                    placeholder="Ej: javascript, react, frontend"
                    onKeyPress={handleKeyPress}
                  />
                  <button 
                    type="button"
                    className="add-tag-btn"
                    onClick={handleAddTag}
                    disabled={!currentTag.trim()}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                <div className="tags-container">
                  {newCommunity.tags.length === 0 ? (
                    <small style={{ color: "var(--neutral-dark)" }}>
                      Añade etiquetas para categorizar tu comunidad
                    </small>
                  ) : (
                    newCommunity.tags.map(tag => (
                      <div key={tag} className="tag-item">
                        <span>{tag}</span>
                        <button 
                          type="button"
                          className="remove-tag-btn"
                          onClick={() => handleRemoveTag(tag)}
                          aria-label={`Eliminar etiqueta ${tag}`}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="create-btn"
                onClick={handleCreateCommunity}
                disabled={isCreating || !newCommunity.nombre.trim() || !newCommunity.descripcion.trim()}
              >
                {isCreating ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Creando...
                  </>
                ) : (
                  'Crear Comunidad'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="communities-footer">
        <div className="footer-content">
          <p>&copy; 2025 Mi OpenLab | Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  );
};

export default CommunitiesPage;