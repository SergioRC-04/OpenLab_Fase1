import React, { useState, useEffect } from "react";
import appFirebase from "../credenciales";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import "./home-details.css";

const auth = getAuth(appFirebase);
const db = getFirestore(appFirebase);

const MyProjects = () => {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState([]);

  const proyectosRef = collection(db, "proyectos");

  useEffect(() => {
    const cargarMisProyectos = async () => {
      const userId = auth.currentUser.uid;
      const q = query(proyectosRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const proyectosCargados = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProyectos(proyectosCargados);
    };

    cargarMisProyectos();
  }, []);

  return (
    <div className="container">
      <h2>Mis proyectos</h2>
      <ul>
        {proyectos.map((proyecto) => (
          <li key={proyecto.id}>
            <h3>{proyecto.titulo}</h3>
            <p>{proyecto.descripcion}</p>
            <p>Autor: {proyecto.autor}</p>
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
      <button onClick={() => navigate("/")}>
        Volver a Todos los Proyectos
      </button>
    </div>
  );
};

export default MyProjects;
