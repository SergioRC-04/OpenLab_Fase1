import React, { useState, useEffect } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import appFirebase from "../credenciales";
import "./FavoriteButton.css";

const db = getFirestore(appFirebase);

const FavoriteButton = ({ projectId, currentUser }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!currentUser || !projectId) return;

      try {
        setLoading(true);
        // Añadir log para depuración
        console.log("Verificando favorito para:", currentUser.uid, projectId);
        
        const favoriteId = `${currentUser.uid}_${projectId}`;
        const favoriteRef = doc(db, "favorites", favoriteId);
        const favoriteDoc = await getDoc(favoriteRef);

        setIsFavorite(favoriteDoc.exists());
      } catch (error) {
        console.error("Error verificando estado de favorito:", error);
        // No actualizar el estado en caso de error
      } finally {
        setLoading(false);
      }
    };

    checkFavoriteStatus();
  }, [projectId, currentUser]);

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      alert("Debes iniciar sesión para guardar proyectos en favoritos");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      const favoriteId = `${currentUser.uid}_${projectId}`;
      const favoriteRef = doc(db, "favorites", favoriteId);
      
      // Mostrar datos para depuración
      console.log("Gestionando favorito:", favoriteId, "Estado actual:", isFavorite);

      if (isFavorite) {
        // Quitar de favoritos
        await deleteDoc(favoriteRef);
        console.log("Favorito eliminado correctamente");
        setIsFavorite(false);
      } else {
        // Agregar a favoritos - IMPORTANTE: Incluir el userId explícitamente
        await setDoc(favoriteRef, {
          userId: currentUser.uid,
          projectId: projectId,
          addedAt: new Date()
        });
        console.log("Favorito añadido correctamente");
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error al actualizar favorito:", error);
      alert("No se pudo actualizar el estado de favorito. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Si no hay usuario o proyecto, no mostrar nada
  if (!projectId) return null;

  return (
    <button
      className={`favorite-button ${isFavorite ? "favorite" : ""} ${loading ? "loading" : ""}`}
      onClick={handleToggleFavorite}
      disabled={loading || !currentUser}
      title={!currentUser ? "Inicia sesión para guardar" : isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
    >
      {loading ? (
        <>
          <i className="fas fa-spinner fa-spin"></i>
          <span>Procesando...</span>
        </>
      ) : (
        <>
          <i className={`${isFavorite ? "fas" : "far"} fa-bookmark`}></i>
          <span>{isFavorite ? "Guardado" : "Guardar"}</span>
        </>
      )}
    </button>
  );
};

export default FavoriteButton;