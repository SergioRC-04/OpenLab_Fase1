import React from "react";
import appFirebase from "../credenciales";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const auth = getAuth(appFirebase);

const Home = ({ correoUsuario }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth); // Cierra la sesión del usuario
      navigate("/login"); // Redirige a la página de login
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
    </div>
  );
};

export default Home;
