import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import appFirebase from "../credenciales";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import "./home-details.css";

const db = getFirestore(appFirebase);

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proyecto, setProyecto] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState("");
  const [tecnologias, setTecnologias] = useState("");
  const [colaboradores, setColaboradores] = useState("");

  useEffect(() => {
    const cargarProyecto = async () => {
      const docRef = doc(db, "proyectos", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setProyecto(data);
        setTitulo(data.titulo);
        setDescripcion(data.descripcion);
        setImagen(data.imagen);
        setTecnologias(data.tecnologias?.join(", "));
        setColaboradores(data.colaboradores?.join(", "));
      } else {
        console.log("No se encontró el proyecto.");
      }
    };

    cargarProyecto();
  }, [id]);

  const handleEditarProyecto = async () => {
    const proyectoRef = doc(db, "proyectos", id);
    try {
      await updateDoc(proyectoRef, {
        titulo,
        descripcion,
        imagen,
        tecnologias: tecnologias.split(",").map((tec) => tec.trim()),
        colaboradores: colaboradores.split(",").map((col) => col.trim()),
      });
      alert("Proyecto actualizado exitosamente");
      navigate("/");
    } catch (error) {
      console.error("Error al editar el proyecto:", error);
    }
  };

  const handleEliminarProyecto = async () => {
    const confirmacion = window.confirm(
      "¿Estás seguro de eliminar este proyecto?"
    );
    if (!confirmacion) return;

    const proyectoRef = doc(db, "proyectos", id);
    try {
      await deleteDoc(proyectoRef);
      alert("Proyecto eliminado exitosamente");
      navigate("/");
    } catch (error) {
      console.error("Error al eliminar el proyecto:", error);
    }
  };

  if (!proyecto) {
    return <p>Cargando proyecto...</p>;
  }

  return (
    <div className="container">
      <h2>Detalle del Proyecto</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleEditarProyecto();
        }}
      >
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
        />
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
        ></textarea>
        <input
          type="text"
          value={imagen}
          onChange={(e) => setImagen(e.target.value)}
        />
        <input
          type="text"
          value={tecnologias}
          onChange={(e) => setTecnologias(e.target.value)}
        />
        <input
          type="text"
          value={colaboradores}
          onChange={(e) => setColaboradores(e.target.value)}
        />
        <button type="submit">Actualizar Proyecto</button>
      </form>
      <button onClick={handleEliminarProyecto}>Eliminar Proyecto</button>
      <button className="back-button" onClick={() => navigate("/")}>
        Volver a Home
      </button>
    </div>
  );
};

export default ProjectDetail;
