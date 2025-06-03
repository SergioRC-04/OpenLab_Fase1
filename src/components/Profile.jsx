import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import appFirebase from "../credenciales";
import "./Profile.css";
import ThemeToggle from "./ThemeToggle";

const db = getFirestore(appFirebase);

const Profile = ({ usuario }) => {
  const navigate = useNavigate();
  const { id } = useParams(); // Para ver perfiles de otros usuarios
  const [nombre, setNombre] = useState("");
  const [bio, setBio] = useState("");
  const [foto, setFoto] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  // Estados para seguidores
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Añadir este estado

  const isOwnProfile = !id || (usuario && id === usuario.uid);
  const profileId = isOwnProfile ? (usuario ? usuario.uid : null) : id;

  useEffect(() => {
    const cargarPerfil = async () => {
      if (!profileId) return;

      try {
        const docRef = doc(db, "usuarios", profileId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPerfilUsuario({
            id: profileId,
            ...data,
          });
          setNombre(data.nombre || (isOwnProfile ? usuario.email.split("@")[0] : "Usuario"));
          setBio(data.bio || "");
          setFoto(data.foto || "");
        } else {
          setNombre(isOwnProfile ? usuario.email.split("@")[0] : "Usuario");
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, [profileId, usuario, isOwnProfile]);

  // Cargar seguidores y seguidos
  useEffect(() => {
    if (!profileId) return;

    // Obtener seguidores
    const followersQuery = query(
      collection(db, "follows"),
      where("followingId", "==", profileId)
    );

    // Obtener seguidos
    const followingQuery = query(
      collection(db, "follows"),
      where("followerId", "==", profileId)
    );

    const unsubscribeFollowers = onSnapshot(followersQuery, async (querySnapshot) => {
      const followersData = [];
      for (const followDoc of querySnapshot.docs) {
        const followData = followDoc.data();
        const userDoc = await getDoc(doc(db, "usuarios", followData.followerId));
        if (userDoc.exists()) {
          followersData.push({
            id: followData.followerId,
            nombre: userDoc.data().nombre || userDoc.data().correo?.split("@")[0] || "Usuario",
            email: userDoc.data().correo,
            foto: userDoc.data().foto,
          });
        }
      }
      setFollowers(followersData);
    });

    const unsubscribeFollowing = onSnapshot(followingQuery, async (querySnapshot) => {
      const followingData = [];
      for (const followDoc of querySnapshot.docs) {
        const followData = followDoc.data();
        const userDoc = await getDoc(doc(db, "usuarios", followData.followingId));
        if (userDoc.exists()) {
          followingData.push({
            id: followData.followingId,
            nombre: userDoc.data().nombre || userDoc.data().correo?.split("@")[0] || "Usuario",
            email: userDoc.data().correo,
            foto: userDoc.data().foto,
          });
        }
      }
      setFollowing(followingData);
    });

    // Verificar si el usuario actual sigue a este perfil
    const checkIfFollowing = async () => {
      if (usuario && profileId !== usuario.uid) {
        const followCheckQuery = query(
          collection(db, "follows"),
          where("followerId", "==", usuario.uid),
          where("followingId", "==", profileId)
        );
        const followSnapshot = await getDocs(followCheckQuery);
        setIsFollowing(!followSnapshot.empty);
      }
    };

    if (usuario) {
      checkIfFollowing();
    }

    return () => {
      unsubscribeFollowers();
      unsubscribeFollowing();
    };
  }, [profileId, usuario]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!usuario) return;
    const docRef = doc(db, "usuarios", usuario.uid);
    await setDoc(
      docRef,
      {
        nombre,
        bio,
        foto,
        correo: usuario.email,
      },
      { merge: true }
    );
    setEditMode(false);
  };

  const handleFollow = async () => {
    if (!usuario) {
      alert("Debes iniciar sesión para seguir a otros usuarios");
      navigate("/login");
      return;
    }
    
    if (isProcessing) return; // Evitar múltiples clics
    
    try {
      setIsProcessing(true); // Indicar que estamos procesando la acción
      
      // Actualizar inmediatamente la UI para feedback instantáneo
      setIsFollowing(prevState => !prevState);
      
      if (isFollowing) {
        // Dejar de seguir
        const followQuery = query(
          collection(db, "follows"),
          where("followerId", "==", usuario.uid),
          where("followingId", "==", profileId)
        );
        const followSnapshot = await getDocs(followQuery);
        
        if (!followSnapshot.empty) {
          await deleteDoc(followSnapshot.docs[0].ref);
        }
      } else {
        // Verificar primero si ya existe la relación
        const checkQuery = query(
          collection(db, "follows"),
          where("followerId", "==", usuario.uid),
          where("followingId", "==", profileId)
        );
        const checkSnapshot = await getDocs(checkQuery);
        
        // Solo crear si no existe
        if (checkSnapshot.empty) {
          await addDoc(collection(db, "follows"), {
            followerId: usuario.uid,
            followingId: profileId,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Recargar la lista de seguidores/seguidos
      await refreshFollowLists();
      
    } catch (error) {
      console.error("Error al actualizar seguimiento:", error);
      // Si hay error, revertir el cambio en la UI
      setIsFollowing(prevState => !prevState);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Función para actualizar listas de seguidores/seguidos
  const refreshFollowLists = async () => {
    if (!profileId) return;
    
    try {
      // Verificar nuevamente si el usuario sigue al perfil
      if (usuario && profileId !== usuario.uid) {
        const followCheckQuery = query(
          collection(db, "follows"),
          where("followerId", "==", usuario.uid),
          where("followingId", "==", profileId)
        );
        const followSnapshot = await getDocs(followCheckQuery);
        setIsFollowing(!followSnapshot.empty);
      }
    } catch (error) {
      console.error("Error al actualizar estado de seguimiento:", error);
    }
  };

  const navigateToProfile = (userId) => {
    if (userId === usuario?.uid) {
      navigate("/profile");
    } else {
      navigate(`/profile/${userId}`);
    }
    setShowFollowers(false);
    setShowFollowing(false);
  };

  if (!profileId && !usuario)
    return (
      <div className="profile-container">
        <h2>Acceso denegado</h2>
        <p>Debes iniciar sesión para ver perfiles de usuario.</p>
        <button onClick={() => navigate("/login")}>Iniciar sesión</button>
      </div>
    );

  if (loading)
    return (
      <div className="profile-container">
        <h2>Cargando perfil...</h2>
        <div className="loading-spinner"></div>
      </div>
    );

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-nav">
          <button className="back-btn" onClick={() => navigate("/home")}>
            <i className="fas fa-arrow-left"></i> Volver
          </button>
          <ThemeToggle />
        </div>
        <h2>Perfil</h2>
      </div>

      <div className="profile-card">
        <img
          src={
            foto ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}`
          }
          alt="Foto de perfil"
          className="profile-avatar"
        />
        <div className="profile-info">
          <h3>{nombre}</h3>
          <p>
            <b>Email:</b> {perfilUsuario?.correo || ""}
          </p>
          <p>
            <b>Bio:</b>{" "}
            {bio ? bio : <span className="text-muted">Sin bio</span>}
          </p>

          <div className="follow-stats">
            <div
              className="follow-stat"
              onClick={() => setShowFollowers(true)}
              title="Ver seguidores"
            >
              <span className="follow-count">{followers.length}</span>
              <span>Seguidores</span>
            </div>
            <div
              className="follow-stat"
              onClick={() => setShowFollowing(true)}
              title="Ver seguidos"
            >
              <span className="follow-count">{following.length}</span>
              <span>Seguidos</span>
            </div>
          </div>
        </div>
      </div>

      {isOwnProfile ? (
        <button
          onClick={() => setEditMode((v) => !v)}
          className="action-btn edit-profile-btn"
        >
          {editMode ? (
            <>Cancelar</>
          ) : (
            <><i className="fas fa-edit"></i> Editar perfil</>
          )}
        </button>
      ) : (
        <button
          onClick={handleFollow}
          className={`action-btn follow-btn ${isFollowing ? "following" : ""}`}
          disabled={!usuario || isProcessing}
        >
          {isProcessing ? (
            <><i className="fas fa-spinner fa-spin"></i> Procesando...</>
          ) : isFollowing ? (
            <>Dejar de seguir</>
          ) : (
            <>Seguir</>
          )}
        </button>
      )}

      {editMode && isOwnProfile && (
        <form onSubmit={handleSave} className="profile-edit-form">
          <div>
            <label>Nombre:</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Bio:</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Escribe algo sobre ti..."
            />
          </div>
          <div>
            <label>URL de foto de perfil:</label>
            <input
              value={foto}
              onChange={(e) => setFoto(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <button type="submit" className="action-btn save-btn">
            <i className="fas fa-save"></i> Guardar
          </button>
        </form>
      )}

      {/* Modal de seguidores */}
      {showFollowers && (
        <div className="follow-modal">
          <div className="follow-modal-content">
            <div className="follow-modal-header">
              <h3>Seguidores</h3>
              <button onClick={() => setShowFollowers(false)} className="close-btn">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="follow-list">
              {followers.length > 0 ? (
                followers.map((follower) => (
                  <div
                    key={follower.id}
                    className="follow-item"
                    onClick={() => navigateToProfile(follower.id)}
                  >
                    <img
                      src={follower.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.nombre)}`}
                      alt={follower.nombre}
                    />
                    <div>
                      <strong>{follower.nombre}</strong>
                      <span>{follower.email}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-message">No hay seguidores todavía</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de seguidos */}
      {showFollowing && (
        <div className="follow-modal">
          <div className="follow-modal-content">
            <div className="follow-modal-header">
              <h3>Seguidos</h3>
              <button onClick={() => setShowFollowing(false)} className="close-btn">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="follow-list">
              {following.length > 0 ? (
                following.map((follow) => (
                  <div
                    key={follow.id}
                    className="follow-item"
                    onClick={() => navigateToProfile(follow.id)}
                  >
                    <img
                      src={follow.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(follow.nombre)}`}
                      alt={follow.nombre}
                    />
                    <div>
                      <strong>{follow.nombre}</strong>
                      <span>{follow.email}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-message">No sigues a nadie todavía</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
