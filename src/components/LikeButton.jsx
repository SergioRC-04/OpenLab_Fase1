import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import appFirebase from "../credenciales";
import { toggleLike } from "../utils/likesManager";
import "./LikeButton.css";

const db = getFirestore(appFirebase);

const LikeButton = ({ projectId, currentUser }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        
        // Verificar si el usuario actual ha dado like
        if (currentUser) {
          const likeRef = doc(db, "likes", `${projectId}_${currentUser.uid}`);
          const likeDoc = await getDoc(likeRef);
          setLiked(likeDoc.exists());
        }
        
        // Obtener conteo total de likes
        const likesQuery = query(
          collection(db, "likes"), 
          where("projectId", "==", projectId)
        );
        const querySnapshot = await getDocs(likesQuery);
        setLikeCount(querySnapshot.size);
      } catch (error) {
        console.error("Error verificando estado del like:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkLikeStatus();
  }, [projectId, currentUser]);
  
  const handleToggleLike = async () => {
    if (!currentUser) {
      alert("Debes iniciar sesión para dar like a un proyecto");
      return;
    }
    
    if (loading) return;
    
    try {
      setLoading(true);
      const result = await toggleLike(projectId, currentUser);
      
      if (result.success) {
        setLiked(result.liked);
        // Actualizar contador
        setLikeCount(prev => result.liked ? prev + 1 : prev - 1);
      } else {
        console.error("Error al procesar like:", result.error);
      }
    } catch (error) {
      console.error("Error al dar like:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button 
      className={`like-button ${liked ? 'liked' : ''} ${loading ? 'loading' : ''}`} 
      onClick={handleToggleLike}
      disabled={loading}
    >
      <i className={`fas fa-heart ${liked ? 'filled' : ''}`}></i>
      <span>{likeCount}</span>
    </button>
  );
};

export default LikeButton;