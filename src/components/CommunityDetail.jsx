import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import appFirebase from "../credenciales";
import ThemeToggle from "./ThemeToggle";
import "./CommunityDetail.css";
import ReputacionService from "../services/ReputacionService";

const db = getFirestore(appFirebase);

const CommunityDetail = ({ usuario }) => {
  const { communityId } = useParams();
  const navigate = useNavigate();
  
  const [community, setCommunity] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberStatus, setMemberStatus] = useState(null); // null, "member", "admin"
  const [showCreateDiscussionModal, setShowCreateDiscussionModal] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({
    titulo: "",
    contenido: "",
    categoria: "Pregunta",
    tags: []
  });
  const [currentTag, setCurrentTag] = useState("");

  useEffect(() => {
    const fetchCommunityDetails = async () => {
      if (!communityId) return;

      setLoading(true);
      try {
        // Obtener detalles de la comunidad
        const communityDoc = await getDoc(doc(db, "communities", communityId));
        if (!communityDoc.exists()) {
          console.error("Comunidad no encontrada");
          navigate("/communities");
          return;
        }
        
        setCommunity({
          id: communityDoc.id,
          ...communityDoc.data()
        });
        
        // Verificar si el usuario es miembro
        if (usuario) {
          const membershipQuery = query(
            collection(db, "community_members"),
            where("communityId", "==", communityId),
            where("userId", "==", usuario.uid)
          );
          
          const memberSnapshot = await getDocs(membershipQuery);
          if (!memberSnapshot.empty) {
            const memberData = memberSnapshot.docs[0].data();
            setMemberStatus(memberData.role);
          } else {
            setMemberStatus(null);
          }
        }
        
        // Obtener discusiones
        const discussionsQuery = query(
          collection(db, "discussions"),
          where("communityId", "==", communityId),
          orderBy("createdAt", "desc")
        );
        
        const discussionsSnapshot = await getDocs(discussionsQuery);
        const discussionsData = await Promise.all(
          discussionsSnapshot.docs.map(async (discussionDoc) => {
            const discussion = {
              id: discussionDoc.id,
              ...discussionDoc.data()
            };
            
            // Obtener conteo de respuestas
            const repliesQuery = query(
              collection(db, "discussion_replies"),
              where("discussionId", "==", discussionDoc.id)
            );
            const repliesSnapshot = await getDocs(repliesQuery);
            
            return {
              ...discussion,
              replyCount: repliesSnapshot.size
            };
          })
        );
        
        setDiscussions(discussionsData);
      } catch (error) {
        console.error("Error al cargar comunidad:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunityDetails();
  }, [communityId, usuario, navigate]);

  const handleJoinCommunity = async () => {
    if (!usuario) {
      alert("Debes iniciar sesión para unirte a esta comunidad");
      return;
    }
    
    try {
      // Añadir al usuario como miembro
      await addDoc(collection(db, "community_members"), {
        communityId,
        userId: usuario.uid,
        role: "member",
        joinedAt: serverTimestamp()
      });
      
      // Incrementar conteo de miembros
      const communityRef = doc(db, "communities", communityId);
      await updateDoc(communityRef, {
        miembros: (community.miembros || 0) + 1
      });
      
      // Actualizar estado
      setMemberStatus("member");
      setCommunity(prev => ({
        ...prev,
        miembros: (prev.miembros || 0) + 1
      }));
      
      // Otorgar puntos al usuario por unirse a una comunidad
      await ReputacionService.otorgarPuntos(usuario.uid, "porActividad", 10);
      
    } catch (error) {
      console.error("Error al unirse a la comunidad:", error);
      alert("Ha ocurrido un error al unirse a la comunidad");
    }
  };

  const handleLeaveCommunity = async () => {
    if (!usuario || !memberStatus) return;
    
    if (window.confirm("¿Estás seguro de que quieres abandonar esta comunidad?")) {
      try {
        // Buscar la membresía
        const membershipQuery = query(
          collection(db, "community_members"),
          where("communityId", "==", communityId),
          where("userId", "==", usuario.uid)
        );
        
        const memberSnapshot = await getDocs(membershipQuery);
        if (!memberSnapshot.empty) {
          // Eliminar membresía
          await deleteDoc(memberSnapshot.docs[0].ref);
          
          // Decrementar conteo de miembros
          const communityRef = doc(db, "communities", communityId);
          await updateDoc(communityRef, {
            miembros: Math.max((community.miembros || 1) - 1, 0)
          });
          
          // Actualizar estado
          setMemberStatus(null);
          setCommunity(prev => ({
            ...prev,
            miembros: Math.max((prev.miembros || 1) - 1, 0)
          }));
        }
      } catch (error) {
        console.error("Error al abandonar la comunidad:", error);
        alert("Ha ocurrido un error al abandonar la comunidad");
      }
    }
  };

  const handleCreateDiscussion = async () => {
    if (!usuario || !memberStatus) {
      alert("Debes ser miembro de la comunidad para crear discusiones");
      return;
    }
    
    if (!newDiscussion.titulo.trim() || !newDiscussion.contenido.trim()) {
      alert("El título y contenido son obligatorios");
      return;
    }
    
    try {
      const discussionData = {
        ...newDiscussion,
        communityId,
        authorId: usuario.uid,
        authorName: usuario.email.split("@")[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        views: 0,
        featured: false
      };
      
      // Crear la discusión
      const docRef = await addDoc(collection(db, "discussions"), discussionData);
      
      // Otorgar puntos por crear una discusión
      await ReputacionService.otorgarPuntos(usuario.uid, "porActividad", 15);
      
      // Cerrar modal y redirigir a la discusión
      setShowCreateDiscussionModal(false);
      navigate(`/discussions/${docRef.id}`);
    } catch (error) {
      console.error("Error al crear discusión:", error);
      alert("Ha ocurrido un error al crear la discusión");
    }
  };

  const handleAddTag = () => {
    if (currentTag && !newDiscussion.tags.includes(currentTag)) {
      setNewDiscussion({
        ...newDiscussion,
        tags: [...newDiscussion.tags, currentTag]
      });
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNewDiscussion({
      ...newDiscussion,
      tags: newDiscussion.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleDiscussionClick = (discussionId) => {
    navigate(`/discussions/${discussionId}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando comunidad...</p>
      </div>
    );
  }
  
  if (!community) {
    return <div>Comunidad no encontrada</div>;
  }

  return (
    <div className="community-detail-page">
      {/* Header */}
      <header className="community-header">
        <div className="header-content">
          <div className="nav-section">
            <button 
              className="back-btn"
              onClick={() => navigate("/communities")}
            >
              <i className="fas fa-arrow-left"></i> Volver
            </button>
            <h1 onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Mi OpenLab</h1>
          </div>
          <div className="user-section">
            <ThemeToggle />
            {usuario ? (
              <>
                <div className="user-avatar" onClick={() => navigate("/profile")} title="Ver perfil">
                  <span>{usuario.email[0].toUpperCase()}</span>
                </div>
                <button className="nav-btn" onClick={() => navigate("/home")}>
                  <i className="fas fa-home"></i> Dashboard
                </button>
              </>
            ) : (
              <button className="nav-button" onClick={() => navigate("/login")}>
                Iniciar Sesión
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Community banner */}
      <div 
        className="community-banner-large" 
        style={{ backgroundImage: community.imagen ? `url(${community.imagen})` : null }}
      >
        <div className="banner-overlay">
          <div className="banner-content">
            <h1>{community.nombre}</h1>
            <p>{community.descripcion}</p>
            
            <div className="community-meta-large">
              <span className="meta-item">
                <i className="fas fa-users"></i> {community.miembros || 0} miembros
              </span>
              <span className="meta-item">
                <i className="fas fa-tag"></i> {community.categoria}
              </span>
            </div>
            
            <div className="banner-tags">
              {community.tags?.map(tag => (
                <span key={tag} className="banner-tag">{tag}</span>
              ))}
            </div>
            
            <div className="banner-actions">
              {!usuario ? (
                <button
                  className="login-to-join-btn"
                  onClick={() => navigate("/login")}
                >
                  Iniciar sesión para unirte
                </button>
              ) : !memberStatus ? (
                <button 
                  className="join-btn"
                  onClick={handleJoinCommunity}
                >
                  <i className="fas fa-plus"></i> Unirse a la comunidad
                </button>
              ) : (
                <div className="member-actions">
                  <span className="member-badge">
                    {memberStatus === "admin" ? "Administrador" : "Miembro"}
                  </span>
                  <button 
                    className="leave-btn"
                    onClick={handleLeaveCommunity}
                  >
                    Abandonar comunidad
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="community-content">
        <div className="discussions-section">
          <div className="discussions-header">
            <h2>Discusiones</h2>
            {memberStatus && (
              <button 
                className="create-discussion-btn"
                onClick={() => setShowCreateDiscussionModal(true)}
              >
                <i className="fas fa-plus"></i> Nueva Discusión
              </button>
            )}
          </div>
          
          {discussions.length === 0 ? (
            <div className="empty-discussions">
              <i className="fas fa-comments"></i>
              <h3>No hay discusiones todavía</h3>
              <p>Sé el primero en iniciar una conversación en esta comunidad.</p>
              {memberStatus ? (
                <button 
                  className="create-discussion-btn"
                  onClick={() => setShowCreateDiscussionModal(true)}
                >
                  <i className="fas fa-plus"></i> Iniciar una discusión
                </button>
              ) : usuario ? (
                <button 
                  className="join-to-discuss-btn"
                  onClick={handleJoinCommunity}
                >
                  Únete para poder comentar
                </button>
              ) : (
                <button
                  className="login-to-discuss-btn"
                  onClick={() => navigate("/login")}
                >
                  Iniciar sesión para participar
                </button>
              )}
            </div>
          ) : (
            <div className="discussions-list">
              {discussions.map(discussion => (
                <div 
                  key={discussion.id} 
                  className="discussion-card"
                  onClick={() => handleDiscussionClick(discussion.id)}
                >
                  <div className="discussion-main">
                    <div className="discussion-category-tag">
                      {discussion.categoria}
                    </div>
                    <h3 className="discussion-title">{discussion.titulo}</h3>
                    <p className="discussion-excerpt">
                      {discussion.contenido.length > 150
                        ? discussion.contenido.substring(0, 147) + "..."
                        : discussion.contenido}
                    </p>
                    
                    {discussion.tags && discussion.tags.length > 0 && (
                      <div className="discussion-tags">
                        {discussion.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="discussion-tag">{tag}</span>
                        ))}
                        {discussion.tags.length > 3 && (
                          <span className="more-tag">+{discussion.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="discussion-meta">
                    <div className="meta-top">
                      <div className="discussion-author">
                        <div className="author-avatar">
                          {discussion.authorName[0].toUpperCase()}
                        </div>
                        <span>{discussion.authorName}</span>
                      </div>
                      <div className="discussion-date">
                        {discussion.createdAt ? new Date(discussion.createdAt.toDate()).toLocaleDateString() : "Fecha desconocida"}
                      </div>
                    </div>
                    <div className="meta-bottom">
                      <span className="discussion-replies">
                        <i className="fas fa-comment"></i> {discussion.replyCount} respuestas
                      </span>
                      <span className="discussion-views">
                        <i className="fas fa-eye"></i> {discussion.views || 0} vistas
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal para crear discusión */}
      {showCreateDiscussionModal && (
        <div className="modal-overlay" onClick={() => setShowCreateDiscussionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Crear Nueva Discusión</h2>
              <button 
                className="close-modal-btn" 
                onClick={() => setShowCreateDiscussionModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Título *</label>
                <input 
                  type="text" 
                  value={newDiscussion.titulo}
                  onChange={e => setNewDiscussion({...newDiscussion, titulo: e.target.value})}
                  placeholder="Ej: ¿Cómo implementar autenticación en React?"
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label>Contenido *</label>
                <textarea 
                  value={newDiscussion.contenido}
                  onChange={e => setNewDiscussion({...newDiscussion, contenido: e.target.value})}
                  placeholder="Describe tu pregunta o tema de discusión..."
                  rows={6}
                  maxLength={2000}
                ></textarea>
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select
                  value={newDiscussion.categoria}
                  onChange={e => setNewDiscussion({...newDiscussion, categoria: e.target.value})}
                >
                  <option value="Pregunta">Pregunta</option>
                  <option value="Debate">Debate</option>
                  <option value="Recursos">Recursos</option>
                  <option value="Tutorial">Tutorial</option>
                  <option value="Noticia">Noticia</option>
                  <option value="Proyecto">Proyecto</option>
                </select>
              </div>
              <div className="form-group">
                <label>Etiquetas</label>
                <div className="tags-input">
                  <input 
                    type="text" 
                    value={currentTag}
                    onChange={e => setCurrentTag(e.target.value)}
                    placeholder="Añade etiquetas relevantes"
                    onKeyPress={e => e.key === 'Enter' && handleAddTag()}
                  />
                  <button 
                    type="button"
                    onClick={handleAddTag}
                    className="add-tag-btn"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                <div className="tags-container">
                  {newDiscussion.tags.map(tag => (
                    <div key={tag} className="tag-item">
                      <span>{tag}</span>
                      <button 
                        className="remove-tag-btn"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowCreateDiscussionModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="create-btn"
                onClick={handleCreateDiscussion}
              >
                Publicar Discusión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="community-footer">
        <div className="footer-content">
          <p>&copy; 2025 Mi OpenLab | Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  );
};

export default CommunityDetail;