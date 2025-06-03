import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import appFirebase from "../credenciales";

const db = getFirestore(appFirebase);

// Función para inicializar el sistema de reputación solo para el usuario actual
export async function initReputacionUsuario(userId) {
  if (!userId) {
    console.error("No hay usuario autenticado");
    return false;
  }

  try {
    console.log(`Verificando sistema de reputación para usuario: ${userId}`);
    
    // Obtener los datos actuales del usuario
    const userDocRef = doc(db, "usuarios", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.warn(`No se encontró el documento del usuario ${userId}`);
      return false;
    }
    
    const userData = userDoc.data();
    
    // Comprobar si necesita actualización
    const needsUpdate = !userData.puntos || !userData.nivel || !userData.logros;
    
    if (needsUpdate) {
      console.log(`Actualizando usuario: ${userId}`);
      
      // Preparar datos para actualización, preservando los existentes
      const updateData = {};
      
      if (!userData.puntos) {
        updateData.puntos = {
          total: 0,
          porProyectos: 0,
          porLikes: 0,
          porComentarios: 0,
          porActividad: 0
        };
      }
      
      if (!userData.nivel) {
        updateData.nivel = {
          actual: 1,
          siguienteNivel: 100,
          progreso: 0
        };
      }
      
      if (!userData.logros) {
        updateData.logros = [];
      }
      
      // Actualizar solo los campos necesarios
      await setDoc(userDocRef, updateData, { merge: true });
      console.log(`Usuario ${userId} actualizado correctamente`);
    } else {
      console.log(`El usuario ${userId} ya tiene la estructura de reputación`);
    }
    
    return true;
  } catch (error) {
    console.error("Error inicializando sistema de reputación:", error);
    return false;
  }
}