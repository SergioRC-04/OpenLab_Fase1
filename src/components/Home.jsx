import React, { useState, useEffect } from "react";
import appFirebase from "../credenciales";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, addDoc, getDoc, doc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import "./home-details.css";

const auth = getAuth(appFirebase);
const db = getFirestore(appFirebase);

const Home = ({ usuario }) => {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState("");
  const [tecnologias, setTecnologias] = useState("");
  const [colaboradores, setColaboradores] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const proyectosRef = collection(db, "proyectos");

  // Cargar todos los proyectos sin importar el usuario
  useEffect(() => {
    const cargarProyectos = async () => {
      const querySnapshot = await getDocs(proyectosRef);
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
      // Solo obtenemos el userId/autor si hay sesión iniciada
      // (aunque la lógica actual asume que "usuario" existe).
      const userId = auth.currentUser?.uid || "invitado";
      let autor = "Anónimo";
      if (userId !== "invitado") {
        const userDoc = await getDoc(doc(db, "usuarios", userId));
        autor = userDoc.exists()
          ? `${userDoc.data().nombre} ${userDoc.data().apellido}`
          : "Anónimo";
      }

      const nuevoProyecto = await addDoc(proyectosRef, {
        titulo,
        descripcion,
        fechaCreacion: new Date().toISOString(),
        imagen,
        tecnologias: tecnologias.split(",").map((tec) => tec.trim()),
        colaboradores: colaboradores.split(",").map((col) => col.trim()),
        userId,
        autor,
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
          autor,
        },
      ]);

      // Limpiar el formulario
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
      <h2>Proyectos</h2>

      {/* Si NO hay usuario, mostrar "Iniciar Sesión" y "Registrarse" */}
      {!usuario && (
        <div style={{ marginBottom: "20px" }}>
          <button onClick={() => navigate("/login")}>Iniciar Sesión</button>
          <button onClick={() => navigate("/register")}>Registrarse</button>
        </div>
      )}

      {/* Si hay usuario, mostrar "Mis proyectos", "Crear proyecto" y "Cerrar Sesión" */}
      {usuario && (
        <div style={{ marginBottom: "20px" }}>
          <button onClick={() => navigate("/my-projects")}>
            Mis proyectos
          </button>
          {!mostrarFormulario && (
            <button onClick={() => setMostrarFormulario(true)}>
              Crear Proyecto
            </button>
          )}
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      )}

      {/* Formulario visible sólo si hay usuario y se presionó "Crear Proyecto" */}
      {usuario && mostrarFormulario && (
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
            placeholder="Colaboradores (separados por comas)"
            value={colaboradores}
            onChange={(e) => setColaboradores(e.target.value)}
          />
          <button type="submit">Guardar Proyecto</button>
          <button type="button" onClick={() => setMostrarFormulario(false)}>
            Cancelar
          </button>
        </form>
      )}

      {/* Lista de todos los proyectos */}
      <ul>
        {proyectos.map((proyecto) => (
          <li key={proyecto.id}>
            <h3>{proyecto.titulo}</h3>
            <p>{proyecto.descripcion}</p>
            <p>Autor: {proyecto.autor || "Desconocido"}</p>
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
    </div>
  );
};

export default Home;
