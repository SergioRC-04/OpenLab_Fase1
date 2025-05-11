import React, { useState, useEffect } from "react";
import appFirebase from "../credenciales";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import "./home-details.css";

const auth = getAuth(appFirebase);
const db = getFirestore(appFirebase);

const Home = () => {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState("");
  const [tecnologias, setTecnologias] = useState("");
  const [colaboradores, setColaboradores] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const proyectosRef = collection(db, "proyectos");

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

  const handleCrearProyecto = async (e) => {
    e.preventDefault();
    if (!titulo || !descripcion) return;

    try {
      const nuevoProyecto = await addDoc(proyectosRef, {
        titulo,
        descripcion,
        fechaCreacion: new Date().toISOString(),
        imagen,
        tecnologias: tecnologias.split(",").map((tec) => tec.trim()),
        colaboradores: colaboradores.split(",").map((col) => col.trim()),
        userId: auth.currentUser.uid,
      });

      setProyectos((prevProyectos) => [
        ...prevProyectos,
        {
          id: nuevoProyecto.id,
          titulo,
          descripcion,
          fechaCreacion: new Date().toISOString(),
          imagen,
          tecnologias: tecnologias.split(",").map((tec) => tec.trim()),
          colaboradores: colaboradores.split(",").map((col) => col.trim()),
        },
      ]);

      setTitulo("");
      setDescripcion("");
      setImagen("");
      setTecnologias("");
      setColaboradores("");
      setMostrarFormulario(false);
      alert("Proyecto creado exitosamente");
    } catch (error) {
      console.error("Error al crear el proyecto:", error);
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
    <div className="container">
      <h2>Mis Proyectos</h2>

      {!mostrarFormulario && (
        <button onClick={() => setMostrarFormulario(true)}>
          Crear Proyecto
        </button>
      )}

      {mostrarFormulario && (
        <form onSubmit={handleCrearProyecto}>
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
          <input
            type="text"
            placeholder="URL de la imagen"
            value={imagen}
            onChange={(e) => setImagen(e.target.value)}
          />
          <input
            type="text"
            placeholder="Tecnologías (separadas por comas)"
            value={tecnologias}
            onChange={(e) => setTecnologias(e.target.value)}
          />
          <input
            type="text"
            placeholder="Colaboradores (correos separados por comas)"
            value={colaboradores}
            onChange={(e) => setColaboradores(e.target.value)}
          />
          <button type="submit">Guardar Proyecto</button>
          <button type="button" onClick={() => setMostrarFormulario(false)}>
            Cancelar
          </button>
        </form>
      )}

      <ul>
        {proyectos.map((proyecto) => (
          <li key={proyecto.id}>
            <h3>{proyecto.titulo}</h3>
            <p>{proyecto.descripcion}</p>
            <p>
              Fecha de creación:{" "}
              {new Date(proyecto.fechaCreacion).toLocaleDateString()}
            </p>
            <p>Tecnologías: {proyecto.tecnologias?.join(", ")}</p>
            <p>Colaboradores: {proyecto.colaboradores?.join(", ")}</p>
            <button onClick={() => navigate(`/proyecto/${proyecto.id}`)}>
              Ver Detalles
            </button>
          </li>
        ))}
      </ul>
      <button onClick={handleLogout}>Cerrar Sesión</button>
    </div>
  );
};

export default Home;
