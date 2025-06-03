import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';
import appFirebase from '../credenciales';

const db = getFirestore(appFirebase);

// Constantes para tipos de actividad y puntos
export const TIPOS_ACTIVIDAD = {
  REGISTRO: 'REGISTRO',
  LOGIN: 'LOGIN',
  PERFIL_COMPLETO: 'PERFIL_COMPLETO',
  PROYECTO_CREADO: 'PROYECTO_CREADO',
  PROYECTO_EDITADO: 'PROYECTO_EDITADO',
  LIKE_RECIBIDO: 'LIKE_RECIBIDO',
  LIKE_DADO: 'LIKE_DADO',
  COMENTARIO: 'COMENTARIO',
  COMENTARIO_RECIBIDO: 'COMENTARIO_RECIBIDO',
  SEGUIDOR_NUEVO: 'SEGUIDOR_NUEVO',
  SEGUIR_USUARIO: 'SEGUIR_USUARIO',
  FAVORITO_AÑADIDO: 'FAVORITO_AÑADIDO',
  PROYECTO_FAVORITO: 'PROYECTO_FAVORITO',
};

export const PUNTOS_POR_ACTIVIDAD = {
  [TIPOS_ACTIVIDAD.REGISTRO]: 10,
  [TIPOS_ACTIVIDAD.LOGIN]: 1,
  [TIPOS_ACTIVIDAD.PERFIL_COMPLETO]: 20,
  [TIPOS_ACTIVIDAD.PROYECTO_CREADO]: 50,
  [TIPOS_ACTIVIDAD.PROYECTO_EDITADO]: 5,
  [TIPOS_ACTIVIDAD.LIKE_RECIBIDO]: 2,
  [TIPOS_ACTIVIDAD.LIKE_DADO]: 1,
  [TIPOS_ACTIVIDAD.COMENTARIO]: 3,
  [TIPOS_ACTIVIDAD.COMENTARIO_RECIBIDO]: 2,
  [TIPOS_ACTIVIDAD.SEGUIDOR_NUEVO]: 3,
  [TIPOS_ACTIVIDAD.SEGUIR_USUARIO]: 1,
  [TIPOS_ACTIVIDAD.FAVORITO_AÑADIDO]: 1,
  [TIPOS_ACTIVIDAD.PROYECTO_FAVORITO]: 2,
};

// Inicializar estructura de reputación para nuevo usuario
export const initReputacion = async (userId) => {
  if (!userId) {
    console.error("No se puede inicializar reputación: ID de usuario no válido");
    return false;
  }

  try {
    // Verificar si ya existe estructura
    const userDoc = await getDoc(doc(db, "usuarios", userId));
    
    if (userDoc.exists() && userDoc.data().reputacion) {
      console.log(`El usuario ${userId} ya tiene la estructura de reputación`);
      return true;
    }

    // Crear estructura inicial
    await updateDoc(doc(db, "usuarios", userId), {
      reputacion: {
        puntos: 0,
        nivel: 1,
        ultimaActividad: serverTimestamp(),
        logros: []
      }
    });

    // Otorgar puntos por registro
    await otorgarPuntos(userId, TIPOS_ACTIVIDAD.REGISTRO, PUNTOS_POR_ACTIVIDAD[TIPOS_ACTIVIDAD.REGISTRO]);
    
    console.log(`Estructura de reputación inicializada para ${userId}`);
    return true;
  } catch (error) {
    console.error("Error inicializando reputación:", error.message);
    // No interrumpir el flujo de la aplicación
    return false;
  }
};

// Otorgar puntos al usuario por una actividad
export const otorgarPuntos = async (userId, tipo, puntos, extraData = {}) => {
  if (!userId) {
    console.log("No se pueden otorgar puntos: usuario no definido");
    return false;
  }

  try {
    // Crear registro de actividad simplificado
    const actividadData = {
      userId,
      tipo,
      puntos,
      fecha: serverTimestamp(),
    };

    // Añadir datos extra solo si existen
    if (Object.keys(extraData).length > 0) {
      actividadData.extraData = extraData;
    }

    // Usar setDoc con un ID generado manualmente para evitar problemas de permisos
    const actividadId = `${userId}_${tipo}_${Date.now()}`;
    const actividadRef = doc(db, "actividad", actividadId);
    await setDoc(actividadRef, actividadData);

    // Actualizar reputación del usuario de forma más robusta
    const userRef = doc(db, "usuarios", userId);
    await updateDoc(userRef, {
      "reputacion.puntos": increment(puntos),
      "reputacion.ultimaActividad": serverTimestamp()
    });
    
    console.log(`✅ ${puntos} puntos otorgados a ${userId} por ${tipo}`);
    
    // Verificar si el usuario sube de nivel
    await verificarNivel(userId);
    
    // Verificar logros sin lanzar error si falla
    try {
      await verificarLogros(userId);
    } catch (logroError) {
      console.warn("No se pudieron verificar logros:", logroError);
    }
    
    return true;
  } catch (error) {
    console.error("Error al otorgar puntos:", error);
    // No interrumpir el flujo de la app con errores
    return false;
  }
};

// Verificar y actualizar nivel del usuario
export const verificarNivel = async (userId) => {
  try {
    // Obtener puntos actuales
    const userDoc = await getDoc(doc(db, "usuarios", userId));
    if (!userDoc.exists() || !userDoc.data().reputacion) return false;
    
    const { puntos, nivel } = userDoc.data().reputacion;
    
    // Fórmula simple para calcular nivel basado en puntos
    // Nivel 1: 0-99, Nivel 2: 100-299, Nivel 3: 300-599, etc.
    const nuevoNivel = Math.floor(Math.sqrt(puntos / 100)) + 1;
    
    // Actualizar nivel si cambió
    if (nuevoNivel > nivel) {
      await updateDoc(doc(db, "usuarios", userId), {
        "reputacion.nivel": nuevoNivel
      });
      
      console.log(`🎉 Usuario ${userId} subió al nivel ${nuevoNivel}`);
      
      // Registrar subida de nivel como actividad
      const actividadId = `${userId}_NIVEL_${nuevoNivel}_${Date.now()}`;
      await setDoc(doc(db, "actividad", actividadId), {
        userId,
        tipo: "SUBIDA_NIVEL",
        nivel: nuevoNivel,
        fecha: serverTimestamp()
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn("Error al verificar nivel:", error);
    return false;
  }
};

// Verificar y otorgar logros pendientes
export const verificarLogros = async (userId) => {
  if (!userId) return false;
  
  try {
    // Obtener datos del usuario
    const userDoc = await getDoc(doc(db, "usuarios", userId));
    if (!userDoc.exists() || !userDoc.data().reputacion) return false;
    
    // Obtener logros ya conseguidos
    const logrosConseguidos = userDoc.data().reputacion.logros || [];
    const logrosIds = logrosConseguidos.map(l => l.id);
    
    // Obtener actividad del usuario (últimos 50 registros max)
    const actividadQuery = query(
      collection(db, "actividad"),
      where("userId", "==", userId)
    );
    
    const actividadSnapshot = await getDocs(actividadQuery);
    const actividadData = [];
    actividadSnapshot.forEach(doc => {
      const data = doc.data();
      actividadData.push({
        ...data,
        fecha: data.fecha instanceof Timestamp ? data.fecha.toDate() : new Date()
      });
    });
    
    // Obtener definiciones de logros
    const logrosQuery = query(collection(db, "logros"));
    const logrosSnapshot = await getDocs(logrosQuery);
    
    const logrosNuevos = [];
    
    // Para cada logro, verificar condiciones
    logrosSnapshot.forEach(logroDoc => {
      const logro = logroDoc.data();
      const logroId = logroDoc.id;
      
      // Si ya tiene este logro, saltarlo
      if (logrosIds.includes(logroId)) return;
      
      let cumpleCondicion = false;
      
      // Verificar según el tipo de logro
      switch (logro.tipo) {
        case 'CONTADOR_ACTIVIDAD':
          // Contar actividades del tipo especificado
          const conteo = actividadData.filter(a => a.tipo === logro.actividadTipo).length;
          cumpleCondicion = conteo >= logro.cantidad;
          break;
          
        case 'NIVEL_ALCANZADO':
          // Verificar si el usuario alcanzó cierto nivel
          const nivelActual = userDoc.data().reputacion.nivel;
          cumpleCondicion = nivelActual >= logro.nivel;
          break;
          
        case 'PUNTOS_TOTALES':
          // Verificar si el usuario acumuló cierta cantidad de puntos
          const puntosTotales = userDoc.data().reputacion.puntos;
          cumpleCondicion = puntosTotales >= logro.puntos;
          break;
          
        default:
          break;
      }
      
      // Si cumple condiciones, agregar a logros nuevos
      if (cumpleCondicion) {
        logrosNuevos.push({
          id: logroId,
          nombre: logro.nombre,
          descripcion: logro.descripcion,
          icono: logro.icono,
          fechaObtencion: new Date()
        });
      }
    });
    
    // Si hay logros nuevos, actualizarlos en el perfil
    if (logrosNuevos.length > 0) {
      const todosLosLogros = [...logrosConseguidos, ...logrosNuevos];
      
      await updateDoc(doc(db, "usuarios", userId), {
        "reputacion.logros": todosLosLogros
      });
      
      // Registrar obtención de logros
      for (const logro of logrosNuevos) {
        const registroId = `${userId}_LOGRO_${logro.id}_${Date.now()}`;
        await setDoc(doc(db, "usuarios-logros", registroId), {
          userId,
          logroId: logro.id,
          fechaObtencion: serverTimestamp()
        });
      }
      
      console.log(`🏆 Usuario ${userId} obtuvo ${logrosNuevos.length} logros nuevos`);
      return logrosNuevos;
    }
    
    return [];
  } catch (error) {
    console.error("Error al verificar logros:", error);
    // No interrumpir el flujo de la app con errores
    return [];
  }
};

// Obtener el resumen de reputación de un usuario
export const obtenerReputacion = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "usuarios", userId));
    
    if (!userDoc.exists()) {
      return {
        puntos: 0,
        nivel: 1,
        logros: [],
        ultimaActividad: null
      };
    }
    
    return userDoc.data().reputacion || {
      puntos: 0,
      nivel: 1,
      logros: [],
      ultimaActividad: null
    };
  } catch (error) {
    console.error("Error al obtener reputación:", error);
    return {
      puntos: 0,
      nivel: 1,
      logros: [],
      ultimaActividad: null,
      error: error.message
    };
  }
};

// Obtener historial de actividad del usuario
export const obtenerHistorialActividad = async (userId, limite = 10) => {
  try {
    const actividadQuery = query(
      collection(db, "actividad"),
      where("userId", "==", userId),
      // No usar orderBy para evitar problemas de índices
    );
    
    const snapshot = await getDocs(actividadQuery);
    
    const actividades = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      actividades.push({
        id: doc.id,
        ...data,
        fecha: data.fecha instanceof Timestamp ? data.fecha.toDate() : new Date()
      });
    });
    
    // Ordenar manualmente por fecha
    actividades.sort((a, b) => b.fecha - a.fecha);
    
    // Devolver solo los más recientes
    return actividades.slice(0, limite);
  } catch (error) {
    console.error("Error al obtener historial de actividad:", error);
    return [];
  }
};

export default {
  initReputacion,
  otorgarPuntos,
  verificarLogros,
  verificarNivel,
  obtenerReputacion,
  obtenerHistorialActividad,
  TIPOS_ACTIVIDAD,
  PUNTOS_POR_ACTIVIDAD
};