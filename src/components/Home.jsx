import React, { useState, useEffect } from "react";
import appFirebase from "../credenciales";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { getFirestore } from "firebase/firestore";

const auth = getAuth(appFirebase);
const db = getFirestore(appFirebase);

const Home = ({ correoUsuario }) => {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [editando, setEditando] = useState(null);

  const proyectosRef = collection(db, "proyectos");

  // Cargar proyectos del usuario autenticado
  useEffect(() => {
    const cargarProyectos = async () => {
      const q = query(
        proyectosRef,
        where("userId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const proyectosCargados = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProyectos(proyectosCargados);
    };

    cargarProyectos();
  }, []);

  // Crear un nuevo proyecto
  const handleCrearProyecto = async (e) => {
    e.preventDefault();
    if (!titulo || !descripcion) return;

    try {
      await addDoc(proyectosRef, {
        titulo,
        descripcion,
        userId: auth.currentUser.uid,
      });
      setTitulo("");
      setDescripcion("");
      alert("Proyecto creado exitosamente");
      window.location.reload(); // Recargar para mostrar el nuevo proyecto
    } catch (error) {
      console.error("Error al crear el proyecto:", error);
    }
  };

  // Editar un proyecto existente
  const handleEditarProyecto = async (id) => {
    const proyectoRef = doc(db, "proyectos", id);
    try {
      await updateDoc(proyectoRef, { titulo, descripcion });
      setTitulo("");
      setDescripcion("");
      setEditando(null);
      alert("Proyecto actualizado exitosamente");
      window.location.reload(); // Recargar para mostrar los cambios
    } catch (error) {
      console.error("Error al editar el proyecto:", error);
    }
  };

  // Eliminar un proyecto
  const handleEliminarProyecto = async (id) => {
    const confirmacion = window.confirm(
      "¿Estás seguro de eliminar este proyecto?"
    );
    if (!confirmacion) return;

    const proyectoRef = doc(db, "proyectos", id);
    try {
      await deleteDoc(proyectoRef);
      alert("Proyecto eliminado exitosamente");
      window.location.reload(); // Recargar para mostrar los cambios
    } catch (error) {
      console.error("Error al eliminar el proyecto:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div>
      <h2 className="text-center mt-5">Bienvenido usuario: {correoUsuario}</h2>
      <button onClick={handleLogout} className="btn btn-primary">
        Logout
      </button>

      <h3>Crear Proyecto</h3>
      <form
        onSubmit={
          editando ? () => handleEditarProyecto(editando) : handleCrearProyecto
        }
      >
        <input
          type="text"
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />
        <textarea
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
        ></textarea>
        <button type="submit">
          {editando ? "Actualizar Proyecto" : "Crear Proyecto"}
        </button>
      </form>

      <h3>Mis Proyectos</h3>
      <ul>
        {proyectos.map((proyecto) => (
          <li key={proyecto.id}>
            <h4>{proyecto.titulo}</h4>
            <p>{proyecto.descripcion}</p>
            <button
              onClick={() => {
                setTitulo(proyecto.titulo);
                setDescripcion(proyecto.descripcion);
                setEditando(proyecto.id);
              }}
            >
              Editar
            </button>
            <button onClick={() => handleEliminarProyecto(proyecto.id)}>
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
