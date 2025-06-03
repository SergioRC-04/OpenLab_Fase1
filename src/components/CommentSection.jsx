import React, { useState, useEffect } from 'react';
import { 
  getFirestore, 
  collection, 
  doc,
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import appFirebase from '../credenciales';
import { otorgarPuntos, TIPOS_ACTIVIDAD } from '../services/ReputacionService';
import './CommentSection.css';

const db = getFirestore(appFirebase);

// Función para formatear fechas sin date-fns
const formatTimeAgo = (date) => {
  if (!date) return "Hace un momento";
  
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return "hace un momento";
  } else if (diffMin < 60) {
    return `hace ${diffMin} ${diffMin === 1 ? "minuto" : "minutos"}`;
  } else if (diffHour < 24) {
    return `hace ${diffHour} ${diffHour === 1 ? "hora" : "horas"}`;
  } else if (diffDay < 30) {
    return `hace ${diffDay} ${diffDay === 1 ? "día" : "días"}`;
  } else {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  }
};

const CommentSection = ({ projectId, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Cargar comentarios existentes
  useEffect(() => {
    if (!projectId) return;

    setLoading(true);
    setLoadError(false);

    try {
      // Intentar primero una consulta simple sin orderBy para evitar problemas de índices
      let commentsQuery = query(
        collection(db, "comments"),
        where("projectId", "==", projectId)
      );
      
      const unsubscribe = onSnapshot(
        commentsQuery,
        (snapshot) => {
          const commentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          }));
          
          // Ordenar manualmente si no se usa orderBy en la consulta
          commentsData.sort((a, b) => b.createdAt - a.createdAt);
          
          setComments(commentsData);
          setLoading(false);
        },
        (error) => {
          console.error("Error cargando comentarios:", error);
          setLoadError(true);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error en la configuración del listener:", error);
      setLoadError(true);
      setLoading(false);
    }
  }, [projectId]);

  // Agregar un nuevo comentario
  const addComment = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("Debes iniciar sesión para comentar");
      return;
    }
    
    if (!commentText.trim()) {
      setError("El comentario no puede estar vacío");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      // Crear ID único para el comentario
      const commentId = `${currentUser.uid}_${projectId}_${Date.now()}`;
      const commentRef = doc(db, "comments", commentId);
      
      // Datos del comentario
      const commentData = {
        projectId,
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || currentUser.email?.split("@")[0] || "Usuario",
        userEmail: currentUser.email || "",
        userPhoto: currentUser.photoURL || "",
        text: commentText.trim(),
        createdAt: serverTimestamp()
      };
      
      // Guardar comentario
      await setDoc(commentRef, commentData);
      
      console.log("✅ Comentario añadido correctamente");
      setCommentText("");
      
      // Otorgar puntos por comentar (sin interrumpir el flujo si falla)
      try {
        await otorgarPuntos(
          currentUser.uid, 
          TIPOS_ACTIVIDAD.COMENTARIO, 
          3, 
          { projectId }
        );
      } catch (repError) {
        console.warn("⚠️ No se pudo otorgar puntos de reputación:", repError);
      }
    } catch (error) {
      console.error("❌ Error al añadir comentario:", error);
      setError("No se pudo añadir el comentario. Inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar un comentario
  const deleteComment = async (commentId) => {
    if (!currentUser) return;
    
    try {
      await deleteDoc(doc(db, "comments", commentId));
      console.log("✅ Comentario eliminado correctamente");
    } catch (error) {
      console.error("❌ Error eliminando comentario:", error);
      alert("No se pudo eliminar el comentario");
    }
  };

  // Si no hay proyecto, no mostrar nada
  if (!projectId) return null;

  return (
    <div className="comments-section">
      <h3 className="comments-title">Comentarios</h3>

      {/* Formulario para agregar comentario */}
      {currentUser && (
        <form onSubmit={addComment} className="comment-form">
          <div className="comment-input-container">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe un comentario..."
              className="comment-input"
              disabled={isSubmitting}
            />
            {error && <p className="comment-error">{error}</p>}
          </div>
          <button 
            type="submit" 
            className="comment-submit-btn" 
            disabled={isSubmitting || !commentText.trim()}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i>
                <span>Comentar</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Mensaje si no está autenticado */}
      {!currentUser && (
        <p className="login-prompt">
          <i className="fas fa-info-circle"></i>
          Inicia sesión para dejar un comentario
        </p>
      )}

      {/* Mostrar comentarios o estado de carga */}
      <div className="comments-list">
        {loading ? (
          <div className="comments-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Cargando comentarios...</p>
          </div>
        ) : loadError ? (
          <div className="comments-error">
            <i className="fas fa-exclamation-triangle"></i>
            <p>No se pudieron cargar los comentarios</p>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-user">
                  {comment.userPhoto ? (
                    <img 
                      src={comment.userPhoto} 
                      alt={comment.userDisplayName} 
                      className="comment-avatar" 
                    />
                  ) : (
                    <div className="comment-avatar-placeholder">
                      {(comment.userDisplayName || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="comment-username">{comment.userDisplayName}</span>
                </div>
                <span className="comment-date">{formatTimeAgo(comment.createdAt)}</span>
              </div>
              
              <p className="comment-text">{comment.text}</p>
              
              {currentUser && currentUser.uid === comment.userId && (
                <button 
                  onClick={() => deleteComment(comment.id)} 
                  className="comment-delete-btn"
                  title="Eliminar comentario"
                >
                  <i className="fas fa-trash"></i>
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="no-comments">
            <i className="fas fa-comments"></i>
            No hay comentarios todavía. ¡Sé el primero!
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentSection;