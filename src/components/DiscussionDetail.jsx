import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp
} from "firebase/firestore";
import appFirebase from "../credenciales";
import ThemeToggle from "./ThemeToggle";
import "./DiscussionDetail.css";
import ReputacionService from "../services/ReputacionService";

const db = getFirestore(appFirebase);

const DiscussionDetail = ({ usuario }) => {
  const { discussionId } = useParams();
  const navigate = useNavigate();
  
  const [discussion, setDiscussion] = useState(null);
  const [community, setCommunity] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReply, setNewReply] = useState("");
  const [isMember, setIsMember] = useState(false);
  
  useEffect(() => {
    const incrementViewCount = async () => {
      if (!discussionId) return;
      
      try {
        const discussionRef = doc(db, "discussions", discussionId);
        await updateDoc(discussionRef, {
          views: increment(1)
        });
      } catch (error) {
        console.error("Error incrementando contador de vistas:", error);
      }
    };
    
    const fetchDiscussionDetails = async () => {
      if (!discussionId) return;
      
      setLoading(true);
      try {
        // Incrementar contador de vistas
        await incrementViewCount();
        
        // Obtener detalles de la discusión
        const discussionDoc = await getDoc(doc(db, "discussions", discussionId));
        if (!discussionDoc.exists()) {
          console.error("Discusión no encontrada");
          navigate("/communities");
          return;
        }
        
        const discussionData = {
          id: discussionDoc.id,
          ...discussionDoc.data()
        };
        setDiscussion(discussionData);
        
        // Obtener detalles de la comunidad
        if (discussionData.communityId) {
          const communityDoc = await getDoc(doc(db, "communities", discussionData.communityId));
          if (communityDoc.exists()) {
            setCommunity({
              id: communityDoc.id,
              ...communityDoc.data()
            });
            
            // Verificar si el usuario es miembro de la comunidad
            if (usuario) {
              const membershipQuery = query(
                collection(db, "community_members"),
                where("communityId", "==", discussionData.communityId),
                where("userId", "==", usuario.uid)
              );
              
              const memberSnapshot = await getDocs(membershipQuery);
              setIsMember(!memberSnapshot.empty);
            }
          }
        }
        
        // Obtener respuestas
        const repliesQuery = query(
          collection(db, "discussion_replies"),
          where("discussionId", "==", discussionId),
          orderBy("createdAt", "asc")
        );
        
        const repliesSnapshot = await getDocs(repliesQuery);
        const repliesData = repliesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setReplies(repliesData);
      } catch (error) {
        console.error("Error cargando detalles de la discusión:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDiscussionDetails();
  }, [discussionId, usuario, navigate]);
  
  const handleJoinCommunity = async () => {
    if (!usuario) {
      alert("Debes iniciar sesión para unirte a esta comunidad");
      return navigate("/login");
    }
    
    if (!community) return;
    
    try {
      // Añadir al usuario como miembro
      await addDoc(collection(db, "community_members"), {
        communityId: community.id,
        userId: usuario.uid,
        role: "member",
        joinedAt: serverTimestamp()
      });
      
      // Incrementar conteo de miembros
      const communityRef = doc(db, "communities", community.id);
      await updateDoc(communityRef, {
        miembros: (community.miembros || 0) + 1
      });
      
      // Actualizar estado
      setIsMember(true);
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
  
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    
    if (!usuario) {
      alert("Debes iniciar sesión para responder");
      return navigate("/login");
    }
    
    if (!discussion || !newReply.trim()) return;
    
    try {
      // Crear la respuesta
      const replyData = {
        discussionId,
        authorId: usuario.uid,
        authorName: usuario.email.split("@")[0],
        content: newReply.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0
      };
      
      await addDoc(collection(db, "discussion_replies"), replyData);
      
      // Actualizar contador de respuestas
      const updatedReplies = [...replies, {
        ...replyData,
        createdAt: new Date(),
        id: Math.random().toString() // Temporal, hasta refrescar
      }];
      setReplies(updatedReplies);
      
      // Limpiar formulario
      setNewReply("");
      
      // Otorgar puntos al autor de la discusión por recibir una respuesta
      if (discussion.authorId && discussion.authorId !== usuario.uid) {
        await ReputacionService.otorgarPuntos(discussion.authorId, "porActividad", 3);
      }
      
      // Otorgar puntos al usuario por participar
      await ReputacionService.otorgarPuntos(usuario.uid, "porActividad", 5);
      
    } catch (error) {
      console.error("Error al publicar respuesta:", error);
      alert("Ha ocurrido un error al publicar tu respuesta");
    }
  };
  
  const handleDeleteReply = async (replyId) => {
    if (!usuario) return;
    
    if (window.confirm("¿Estás seguro de que quieres eliminar esta respuesta?")) {
      try {
        // Verificar si la respuesta existe y pertenece al usuario
        const replyRef = doc(db, "discussion_replies", replyId);
        const replyDoc = await getDoc(replyRef);
        
        if (replyDoc.exists() && replyDoc.data().authorId === usuario.uid) {
          await deleteDoc(replyRef);
          // Actualizar la lista de respuestas
          setReplies(replies.filter(reply => reply.id !== replyId));
        } else {
          alert("No tienes permisos para eliminar esta respuesta");
        }
      } catch (error) {
        console.error("Error eliminando respuesta:", error);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando discusión...</p>
      </div>
    );
  }
  
  if (!discussion) {
    return <div>Discusión no encontrada</div>;
  }

  return (
    <div className="discussion-detail-page">
      {/* Header */}
      <header className="discussion-header">
        <div className="header-content">
          <div className="nav-section">
            <button 
              className="back-btn"
              onClick={() => community ? navigate(`/communities/${community.id}`) : navigate("/communities")}
            >
              <i className="fas fa-arrow-left"></i> Volver a la comunidad
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

      {/* Discussion content */}
      <main className="discussion-main">
        <div className="discussion-container">
          {/* Community info */}
          {community && (
            <div className="community-info">
              <div 
                className="community-avatar"
                style={{ 
                  backgroundImage: community.imagen ? `url(${community.imagen})` : null,
                  backgroundColor: !community.imagen ? '#3498db' : null
                }}
              >
                {!community.imagen && community.nombre[0].toUpperCase()}
              </div>
              <div className="community-details">
                <h2 onClick={() => navigate(`/communities/${community.id}`)}>
                  {community.nombre}
                </h2>
                <div className="community-meta">
                  <span>{community.miembros || 0} miembros</span>
                  <span>{community.categoria}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Discussion header */}
          <div className="discussion-full-header">
            <div className="discussion-category">
              <span className="category-badge">{discussion.categoria}</span>
            </div>
            <h1 className="discussion-full-title">{discussion.titulo}</h1>
            <div className="discussion-author-info">
              <div className="author-avatar">
                {discussion.authorName[0].toUpperCase()}
              </div>
              <div className="author-details">
                <span className="author-name">{discussion.authorName}</span>
                <span className="discussion-date">
                  {discussion.createdAt 
                    ? new Date(discussion.createdAt.toDate()).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : "Fecha desconocida"
                  }
                </span>
              </div>
            </div>
          </div>
          
          {/* Discussion content */}
          <div className="discussion-full-content">
            {discussion.contenido.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
          
          {/* Tags */}
          {discussion.tags && discussion.tags.length > 0 && (
            <div className="discussion-tags-container">
              {discussion.tags.map(tag => (
                <span key={tag} className="discussion-tag">{tag}</span>
              ))}
            </div>
          )}
          
          {/* Discussion stats */}
          <div className="discussion-stats">
            <span className="stat-item">
              <i className="fas fa-eye"></i> {discussion.views || 0} vistas
            </span>
            <span className="stat-item">
              <i className="fas fa-comment"></i> {replies.length} respuestas
            </span>
          </div>
        </div>
        
        {/* Replies section */}
        <div className="replies-section">
          <h2>{replies.length > 0 ? 'Respuestas' : 'Aún no hay respuestas'}</h2>
          
          <div className="replies-list">
            {replies.length === 0 ? (
              <div className="no-replies">
                <i className="fas fa-comments"></i>
                <p>Sé el primero en responder a esta discusión</p>
              </div>
            ) : (
              replies.map(reply => (
                <div key={reply.id} className="reply-item">
                  <div className="reply-header">
                    <div className="reply-author">
                      <div className="author-avatar small">
                        {reply.authorName[0].toUpperCase()}
                      </div>
                      <div className="author-details">
                        <span className="author-name">{reply.authorName}</span>
                        <span className="reply-date">
                          {reply.createdAt && typeof reply.createdAt.toDate === 'function'
                            ? new Date(reply.createdAt.toDate()).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : "Ahora mismo"
                          }
                        </span>
                      </div>
                    </div>
                    
                    {usuario && usuario.uid === reply.authorId && (
                      <button 
                        className="delete-reply-btn"
                        onClick={() => handleDeleteReply(reply.id)}
                        title="Eliminar respuesta"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                  <div className="reply-content">
                    {reply.content}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Reply form */}
          <div className="reply-form-container">
            <h3>Tu respuesta</h3>
            
            {!usuario ? (
              <div className="login-required">
                <p>Debes iniciar sesión para responder</p>
                <button 
                  className="nav-button"
                  onClick={() => navigate("/login")}
                >
                  Iniciar Sesión
                </button>
              </div>
            ) : !isMember && community ? (
              <div className="login-required">
                <p>Debes ser miembro de la comunidad para responder</p>
                <button 
                  className="join-btn"
                  onClick={handleJoinCommunity}
                >
                  Unirte a la comunidad
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReply}>
                <textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  required
                  rows={5}
                ></textarea>
                <div className="form-actions">
                  <button 
                    type="submit"
                    className="submit-reply-btn"
                    disabled={!newReply.trim()}
                  >
                    <i className="fas fa-paper-plane"></i> Publicar Respuesta
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="discussion-footer">
        <div className="footer-content">
          <p>&copy; 2025 Mi OpenLab | Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  );
};

export default DiscussionDetail;