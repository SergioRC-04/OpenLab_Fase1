import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  addDoc,
  collection,
  query,
  where,
  getDocs 
} from "firebase/firestore";
import appFirebase from "../credenciales";

const db = getFirestore(appFirebase);

class ReputacionService {
  // Otorga puntos a un usuario
  static async otorgarPuntos(userId, tipo, cantidad) {
    if (!userId) {
      console.warn("No se puede otorgar puntos: userId no definido");
      return false;
    }
    
    try {
      // Verificar si el usuario existe
      const userRef = doc(db, "usuarios", userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.warn(`Usuario ${userId} no encontrado en Firestore`);
        return false;
      }
      
      const userData = userDoc.data();
      
      // Si no existe la estructura de puntos, crearla primero
      if (!userData.puntos) {
        await updateDoc(userRef, {
          puntos: {
            total: cantidad,
            [tipo]: cantidad
          }
        });
      } else {
        // Actualizar puntos específicos y total
        await updateDoc(userRef, {
          [`puntos.${tipo}`]: increment(cantidad),
          "puntos.total": increment(cantidad)
        });
      }
      
      console.log(`Otorgados ${cantidad} puntos (${tipo}) a usuario ${userId}`);
      
      // Verificar si el usuario sube de nivel
      await this.verificarNivel(userId);
      
      // Verificar si el usuario ha desbloqueado nuevos logros
      await this.verificarLogros(userId);
      
      return true;
    } catch (error) {
      console.error("Error al otorgar puntos:", error);
      return false;
    }
  }
  
  // Verifica si el usuario sube de nivel
  static async verificarNivel(userId) {
    try {
      const userRef = doc(db, "usuarios", userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      
      if (!userData.nivel) {
        // Inicializar nivel si no existe
        await updateDoc(userRef, {
          nivel: {
            actual: 1,
            siguienteNivel: 100,
            progreso: 0
          }
        });
        return;
      }
      
      const { puntos, nivel } = userData;
      const puntosActuales = puntos?.total || 0;
      
      // Calculamos si hay que subir de nivel
      if (puntosActuales >= nivel.siguienteNivel) {
        const nuevoNivel = nivel.actual + 1;
        const siguienteNivel = nivel.siguienteNivel + (nuevoNivel * 50); // Fórmula ejemplo
        
        await updateDoc(userRef, {
          "nivel.actual": nuevoNivel,
          "nivel.siguienteNivel": siguienteNivel,
          "nivel.progreso": 0
        });
        
        console.log(`Usuario ${userId} subió al nivel ${nuevoNivel}`);
        
        // Añadir notificación o evento de subida de nivel
        await this.registrarEvento(userId, "nivel", `¡Has subido al nivel ${nuevoNivel}!`);
      } else {
        // Actualizar progreso
        const progreso = Math.floor((puntosActuales / nivel.siguienteNivel) * 100);
        await updateDoc(userRef, {
          "nivel.progreso": progreso
        });
      }
    } catch (error) {
      console.error("Error al verificar nivel:", error);
    }
  }
  
  // Verifica si el usuario ha desbloqueado nuevos logros
  static async verificarLogros(userId) {
    try {
      const userRef = doc(db, "usuarios", userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      
      // Si no tiene array de logros, inicializarlo
      if (!userData.logros) {
        await updateDoc(userRef, {
          logros: []
        });
      }
      
      // 1. Verificar logros por cantidad de proyectos
      const proyectosQuery = query(
        collection(db, "proyectos"),
        where("usuario", "==", userId)
      );
      const proyectosSnap = await getDocs(proyectosQuery);
      const numProyectos = proyectosSnap.size;
      
      // Verificar logro de primer proyecto
      if (numProyectos >= 1 && !this.tieneLogro(userData, "primer_proyecto")) {
        await this.otorgarLogro(userId, "primer_proyecto");
      }
      
      // Verificar logro de 5 proyectos
      if (numProyectos >= 5 && !this.tieneLogro(userData, "cinco_proyectos")) {
        await this.otorgarLogro(userId, "cinco_proyectos");
      }
      
      // 2. Verificar logros de likes recibidos
      let totalLikes = 0;
      
      // Para cada proyecto del usuario, contar sus likes
      for (const proyectoDoc of proyectosSnap.docs) {
        const proyectoId = proyectoDoc.id;
        
        const likesQuery = query(
          collection(db, "likes"),
          where("projectId", "==", proyectoId)
        );
        const likesSnap = await getDocs(likesQuery);
        totalLikes += likesSnap.size;
      }
      
      // Verificar logro de 10 likes
      if (totalLikes >= 10 && !this.tieneLogro(userData, "diez_likes")) {
        await this.otorgarLogro(userId, "diez_likes");
      }
      
    } catch (error) {
      console.error("Error al verificar logros:", error);
    }
  }
  
  // Verifica si un usuario ya tiene un logro específico
  static tieneLogro(userData, logroId) {
    if (!userData.logros) return false;
    return userData.logros.some(logro => logro.id === logroId);
  }
  
  // Otorga un nuevo logro al usuario
  static async otorgarLogro(userId, logroId) {
    try {
      // Obtener información del logro
      const logroDoc = await getDoc(doc(db, "logros", logroId));
      if (!logroDoc.exists()) {
        console.warn(`El logro ${logroId} no existe en la base de datos`);
        return;
      }
      
      const logroData = logroDoc.data();
      const nuevoLogro = {
        id: logroId,
        nombre: logroData.nombre,
        descripcion: logroData.descripcion,
        icono: logroData.icono,
        fechaConseguido: new Date()
      };
      
      console.log(`Otorgando logro "${logroData.nombre}" al usuario ${userId}`);
      
      // Añadir el logro al usuario
      await updateDoc(doc(db, "usuarios", userId), {
        logros: arrayUnion(nuevoLogro)
      });
      
      // Otorgar puntos por el logro
      if (logroData.puntosOtorgados) {
        await this.otorgarPuntos(userId, "porLogros", logroData.puntosOtorgados);
        console.log(`Otorgados ${logroData.puntosOtorgados} puntos por logro "${logroData.nombre}"`);
      }
      
      // Registrar evento
      await this.registrarEvento(userId, "logro", `¡Has conseguido el logro "${logroData.nombre}"!`);
    } catch (error) {
      console.error("Error al otorgar logro:", error);
    }
  }
  
  // Registra un evento en la actividad del usuario
  static async registrarEvento(userId, tipo, descripcion) {
    try {
      await addDoc(collection(db, "actividad"), {
        userId,
        tipo,
        descripcion,
        fecha: new Date()
      });
      console.log(`Evento registrado para ${userId}: ${descripcion}`);
    } catch (error) {
      console.error("Error al registrar evento:", error);
    }
  }
}

export default ReputacionService;