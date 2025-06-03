import React, { useState, useEffect } from "react";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import appFirebase from "../credenciales";
import "./Profile.css";
import ReputationProfile from "./ReputationProfile";

const db = getFirestore(appFirebase);

const Profile = ({ usuario }) => {
  const [nombre, setNombre] = useState("");
  const [bio, setBio] = useState("");
  const [foto, setFoto] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPerfil = async () => {
      if (!usuario) return;
      const docRef = doc(db, "usuarios", usuario.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNombre(data.nombre || usuario.email.split("@")[0]);
        setBio(data.bio || "");
        setFoto(data.foto || "");
      } else {
        setNombre(usuario.email.split("@")[0]);
      }
      setLoading(false);
    };
    cargarPerfil();
  }, [usuario]);

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

  if (!usuario) return <p>Debes iniciar sesión para ver tu perfil.</p>;
  if (loading) return <p>Cargando perfil...</p>;

  return (
    <div className="profile-container">
      <h2>Mi Perfil</h2>
      <div className="profile-card">
        <img
          src={
            foto ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}`
          }
          alt="Foto de perfil"
          style={{ width: 120, height: 120, borderRadius: "50%" }}
        />
        <div className="profile-info">
          <h3>{nombre}</h3>
          <p>
            <b>Email:</b> {usuario.email}
          </p>
          <p>
            <b>Bio:</b>{" "}
            {bio ? bio : <span style={{ color: "#888" }}>Sin bio</span>}
          </p>
        </div>
      </div>
      <button onClick={() => setEditMode((v) => !v)}>
        {editMode ? "Cancelar" : "Editar perfil"}
      </button>
      {editMode && (
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
          <button type="submit">Guardar</button>
        </form>
      )}

      {/* Añadir el componente de reputación */}
      {usuario && <ReputationProfile userId={usuario.uid} />}
    </div>
  );
};

export default Profile;
