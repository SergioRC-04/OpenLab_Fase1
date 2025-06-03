import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, setDoc } from "firebase/firestore";
import appFirebase from "../credenciales";

const db = getFirestore(appFirebase);

// Función para corregir likes existentes y verificar su estructura
export async function corregirLikesExistentes() {
  try {
    console.log("Iniciando corrección de likes existentes...");
    
    // Obtener todos los likes
    const likesSnapshot = await getDocs(collection(db, "likes"));
    console.log(`Encontrados ${likesSnapshot.size} likes para revisar`);
    
    const correcciones = [];
    const eliminar = [];
    
    // Revisar cada documento de like
    for (const likeDoc of likesSnapshot.docs) {
      const likeData = likeDoc.data();
      const likeId = likeDoc.id;
      
      // Verificar si tiene los campos necesarios y son válidos
      const needsFix = !likeData.projectId || 
                      !likeData.userId || 
                      !likeData.projectOwnerId ||
                      likeData.projectId === "" ||
                      likeData.userId === "" ||
                      likeData.projectOwnerId === "";
      
      if (needsFix) {
        console.log(`Like ${likeId} necesita corrección`);
        
        // Intentar extraer IDs del formato projectId_userId si el ID tiene ese formato
        if (likeId.includes("_")) {
          const [projectId, userId] = likeId.split("_");
          
          // Verificar si el proyecto existe
          try {
            const projectDoc = await getDoc(doc(db, "proyectos", projectId));
            
            if (projectDoc.exists()) {
              const projectData = projectDoc.data();
              const projectOwnerId = projectData.usuario;
              
              if (projectOwnerId) {
                // Podemos corregir este documento
                correcciones.push({
                  id: likeId,
                  data: {
                    projectId,
                    userId,
                    projectOwnerId,
                    timestamp: new Date()
                  }
                });
                continue;
              }
            }
          } catch (error) {
            console.error(`Error verificando proyecto para like ${likeId}:`, error);
          }
        }
        
        // Si no se pudo corregir, marcar para eliminar
        eliminar.push(likeId);
      }
    }
    
    // Aplicar correcciones
    for (const correccion of correcciones) {
      await updateDoc(doc(db, "likes", correccion.id), correccion.data);
      console.log(`Like ${correccion.id} corregido correctamente`);
    }
    
    // Eliminar likes que no se pueden corregir
    for (const likeId of eliminar) {
      await deleteDoc(doc(db, "likes", likeId));
      console.log(`Like ${likeId} eliminado por falta de información válida`);
    }
    
    console.log(`Corrección finalizada. Corregidos: ${correcciones.length}, Eliminados: ${eliminar.length}`);
    return {
      corregidos: correcciones.length,
      eliminados: eliminar.length,
      total: likesSnapshot.size
    };
  } catch (error) {
    console.error("Error corrigiendo likes:", error);
    throw error;
  }
}

// Función para dar like a un proyecto (mejorada)
export async function toggleLike(projectId, currentUser) {
  if (!currentUser || !projectId) {
    console.error("Se requiere usuario autenticado y ID del proyecto");
    return { success: false, error: "Faltan datos requeridos" };
  }
  
  try {
    const likeId = `${projectId}_${currentUser.uid}`;
    const likeRef = doc(db, "likes", likeId);
    const likeDoc = await getDoc(likeRef);
    
    // Obtener información del proyecto
    const projectRef = doc(db, "proyectos", projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (!projectDoc.exists()) {
      return { success: false, error: "El proyecto no existe" };
    }
    
    const projectOwnerId = projectDoc.data().usuario;
    
    if (likeDoc.exists()) {
      // Quitar like
      await deleteDoc(likeRef);
      console.log(`Like eliminado: ${likeId}`);
      return { success: true, liked: false };
    } else {
      // Dar like con todos los datos necesarios
      await setDoc(likeRef, {
        projectId,
        userId: currentUser.uid,
        projectOwnerId,
        timestamp: new Date()
      });
      console.log(`Like añadido: ${likeId}`);
      return { success: true, liked: true };
    }
  } catch (error) {
    console.error("Error al procesar like:", error);
    return { success: false, error: error.message };
  }
}