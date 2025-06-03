"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
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
import ReputationProfile from "./ReputationProfile";
import FavoriteProjects from './FavoriteProjects';

const db = getFirestore(appFirebase)

const Profile = ({ usuario }) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [nombre, setNombre] = useState("")
  const [bio, setBio] = useState("")
  const [foto, setFoto] = useState("")

  // Nuevos campos CV
  const [estudios, setEstudios] = useState("")
  const [experiencia, setExperiencia] = useState("")
  const [habilidadesCV, setHabilidadesCV] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [stackTecnologico, setStackTecnologico] = useState("")

  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [perfilUsuario, setPerfilUsuario] = useState(null)
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const isOwnProfile = !id || (usuario && id === usuario.uid)
  const profileId = isOwnProfile ? (usuario ? usuario.uid : null) : id

  useEffect(() => {
    const cargarPerfil = async () => {
      if (!profileId) return
      try {
        const docRef = doc(db, "usuarios", profileId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setPerfilUsuario({ id: profileId, ...data })
          setNombre(data.nombre || (isOwnProfile ? usuario.email.split("@")[0] : "Usuario"))
          setBio(data.bio || "")
          setFoto(data.foto || "")

          // Cargar nuevos campos CV
          setEstudios(data.estudios || "")
          setExperiencia(data.experiencia || "")
          setHabilidadesCV(data.habilidadesCV || "")
          setLinkedin(data.linkedin || "")
          setStackTecnologico(data.stackTecnologico || "")
        } else {
          setNombre(isOwnProfile ? usuario.email.split("@")[0] : "Usuario")
        }
      } catch (error) {
        console.error("Error cargando perfil:", error)
      } finally {
        setLoading(false)
      }
    }
    cargarPerfil()
  }, [profileId, usuario, isOwnProfile])

  useEffect(() => {
    if (!profileId) return

    const followersQuery = query(collection(db, "follows"), where("followingId", "==", profileId))

    const followingQuery = query(collection(db, "follows"), where("followerId", "==", profileId))

    const unsubscribeFollowers = onSnapshot(followersQuery, async (snapshot) => {
      const followersData = []
      for (const docu of snapshot.docs) {
        const followData = docu.data()
        const userDoc = await getDoc(doc(db, "usuarios", followData.followerId))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          followersData.push({
            id: followData.followerId,
            nombre: userData.nombre || userData.correo?.split("@")[0] || "Usuario",
            email: userData.correo,
            foto: userData.foto,
          })
        }
      }
      setFollowers(followersData)
    })

    const unsubscribeFollowing = onSnapshot(followingQuery, async (snapshot) => {
      const followingData = []
      for (const docu of snapshot.docs) {
        const followData = docu.data()
        const userDoc = await getDoc(doc(db, "usuarios", followData.followingId))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          followingData.push({
            id: followData.followingId,
            nombre: userData.nombre || userData.correo?.split("@")[0] || "Usuario",
            email: userData.correo,
            foto: userData.foto,
          })
        }
      }
      setFollowing(followingData)
    })

    const checkIfFollowing = async () => {
      if (usuario && profileId !== usuario.uid) {
        const followCheckQuery = query(
          collection(db, "follows"),
          where("followerId", "==", usuario.uid),
          where("followingId", "==", profileId),
        )
        const snapshot = await getDocs(followCheckQuery)
        setIsFollowing(!snapshot.empty)
      }
    }

    if (usuario) checkIfFollowing()

    return () => {
      unsubscribeFollowers()
      unsubscribeFollowing()
    }
  }, [profileId, usuario])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!usuario) return
    const docRef = doc(db, "usuarios", usuario.uid)
    await setDoc(
      docRef,
      {
        nombre,
        bio,
        foto,
        correo: usuario.email,
        // Guardar nuevos campos CV
        estudios,
        experiencia,
        habilidadesCV,
        linkedin,
        stackTecnologico,
      },
      { merge: true },
    )
    setEditMode(false)
  }

  const handleFollow = async () => {
    if (!usuario) {
      alert("Debes iniciar sesión para seguir a otros usuarios")
      navigate("/login")
      return
    }
    if (isProcessing) return
    try {
      setIsProcessing(true)
      setIsFollowing((prev) => !prev)
      const followQuery = query(
        collection(db, "follows"),
        where("followerId", "==", usuario.uid),
        where("followingId", "==", profileId),
      )
      const snapshot = await getDocs(followQuery)
      if (isFollowing) {
        if (!snapshot.empty) {
          await deleteDoc(snapshot.docs[0].ref)
        }
      } else {
        if (snapshot.empty) {
          await addDoc(collection(db, "follows"), {
            followerId: usuario.uid,
            followingId: profileId,
            timestamp: new Date().toISOString(),
          })
        }
      }
      await refreshFollowLists()
    } catch (error) {
      console.error("Error al actualizar seguimiento:", error)
      setIsFollowing((prev) => !prev)
    } finally {
      setIsProcessing(false)
    }
  }

  const refreshFollowLists = async () => {
    if (!profileId) return
    try {
      if (usuario && profileId !== usuario.uid) {
        const followCheckQuery = query(
          collection(db, "follows"),
          where("followerId", "==", usuario.uid),
          where("followingId", "==", profileId),
        )
        const snapshot = await getDocs(followCheckQuery)
        setIsFollowing(!snapshot.empty)
      }
    } catch (error) {
      console.error("Error al actualizar estado de seguimiento:", error)
    }
  }

  const navigateToProfile = (userId) => {
    navigate(userId === usuario?.uid ? "/profile" : `/profile/${userId}`)
    setShowFollowers(false)
    setShowFollowing(false)
  }

  // Función para renderizar el stack tecnológico como badges
  const renderStackTecnologico = () => {
    if (!stackTecnologico) return <span className="text-muted">No especificado</span>

    const technologies = stackTecnologico
      .split(",")
      .map((tech) => tech.trim())
      .filter((tech) => tech)
    return (
      <div className="tech-stack">
        {technologies.map((tech, index) => (
          <span key={index} className="badge tech-badge">
            {tech}
          </span>
        ))}
      </div>
    )
  }

  if (!profileId && !usuario)
    return (
      <div className="profile-container">
        <h2>Acceso denegado</h2>
        <p>Debes iniciar sesión para ver perfiles de usuario.</p>
        <button onClick={() => navigate("/login")}>Iniciar sesión</button>
      </div>
    )

  if (loading)
    return (
      <div className="profile-container">
        <h2>Cargando perfil...</h2>
        <div className="loading-spinner"></div>
      </div>
    )

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
          src={foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre) || "/placeholder.svg"}`}
          alt="Foto de perfil"
          className="profile-avatar"
        />
        <div className="profile-info">
          <h3>{nombre}</h3>
          <p>
            <b>Email:</b> {perfilUsuario?.correo || ""}
          </p>
          <p>
            <b>Bio:</b> {bio ? bio : <span className="text-muted">Sin bio</span>}
          </p>
          <div className="follow-stats">
            <div className="follow-stat" onClick={() => setShowFollowers(true)} title="Ver seguidores">
              <span className="follow-count">{followers.length}</span>
              <span>Seguidores</span>
            </div>
            <div className="follow-stat" onClick={() => setShowFollowing(true)} title="Ver seguidos">
              <span className="follow-count">{following.length}</span>
              <span>Seguidos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección CV Profesional */}
      <div className="cv-container">
        <h3 className="cv-title">
          <i className="fas fa-briefcase"></i> Perfil Profesional
        </h3>

        <div className="cv-section">
          <h4>
            <i className="fas fa-graduation-cap"></i> Estudios
          </h4>
          {editMode ? (
            <textarea
              value={estudios}
              onChange={(e) => setEstudios(e.target.value)}
              placeholder="Describe tu formación académica..."
              className="cv-textarea"
            />
          ) : (
            <p className="cv-content">{estudios || <span className="text-muted">No especificado</span>}</p>
          )}
        </div>

        <div className="cv-section">
          <h4>
            <i className="fas fa-briefcase"></i> Experiencia Profesional
          </h4>
          {editMode ? (
            <textarea
              value={experiencia}
              onChange={(e) => setExperiencia(e.target.value)}
              placeholder="Describe tu experiencia laboral..."
              className="cv-textarea"
            />
          ) : (
            <p className="cv-content">{experiencia || <span className="text-muted">No especificado</span>}</p>
          )}
        </div>

        <div className="cv-section">
          <h4>
            <i className="fas fa-star"></i> Habilidades
          </h4>
          {editMode ? (
            <textarea
              value={habilidadesCV}
              onChange={(e) => setHabilidadesCV(e.target.value)}
              placeholder="Describe tus habilidades profesionales..."
              className="cv-textarea"
            />
          ) : (
            <p className="cv-content">{habilidadesCV || <span className="text-muted">No especificado</span>}</p>
          )}
        </div>

        <div className="cv-section">
          <h4>
            <i className="fas fa-code"></i> Stack Tecnológico
          </h4>
          {editMode ? (
            <input
              type="text"
              value={stackTecnologico}
              onChange={(e) => setStackTecnologico(e.target.value)}
              placeholder="React, Node.js, Firebase, etc."
              className="cv-input"
            />
          ) : (
            renderStackTecnologico()
          )}
        </div>

        <div className="cv-section">
          <h4>
            <i className="fab fa-linkedin"></i> LinkedIn
          </h4>
          {editMode ? (
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/tu-perfil"
              className="cv-input"
            />
          ) : linkedin ? (
            <a href={linkedin} target="_blank" rel="noopener noreferrer" className="linkedin-btn">
              <i className="fab fa-linkedin"></i>
              Ver perfil de LinkedIn
            </a>
          ) : (
            <span className="text-muted">No disponible</span>
          )}
        </div>
      </div>

      {isOwnProfile ? (
        <button onClick={() => setEditMode((v) => !v)} className="action-btn edit-profile-btn">
          {editMode ? (
            <>Cancelar</>
          ) : (
            <>
              <i className="fas fa-edit"></i> Editar perfil
            </>
          )}
        </button>
      ) : (
        <button
          onClick={handleFollow}
          className={`action-btn follow-btn ${isFollowing ? "following" : ""}`}
          disabled={!usuario || isProcessing}
        >
          {isProcessing ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Procesando...
            </>
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
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div>
            <label>Bio:</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Escribe algo sobre ti..." />
          </div>
          <div>
            <label>URL de foto de perfil:</label>
            <input value={foto} onChange={(e) => setFoto(e.target.value)} placeholder="https://..." />
          </div>
          <button type="submit" className="action-btn save-btn">
            <i className="fas fa-save"></i> Guardar
          </button>
        </form>
      )}

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
                followers.map((f) => (
                  <div key={f.id} className="follow-item" onClick={() => navigateToProfile(f.id)}>
                    <img
                      src={f.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.nombre)}`}
                      alt={f.nombre}
                    />
                    <div>
                      <strong>{f.nombre}</strong>
                      <span>{f.email}</span>
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
                following.map((f) => (
                  <div key={f.id} className="follow-item" onClick={() => navigateToProfile(f.id)}>
                    <img
                      src={f.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.nombre)}`}
                      alt={f.nombre}
                    />
                    <div>
                      <strong>{f.nombre}</strong>
                      <span>{f.email}</span>
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

      {isOwnProfile && <FavoriteProjects userId={usuario.uid} />}
      {usuario && <ReputationProfile userId={usuario.uid} />}
    </div>
  )
}

export default Profile
