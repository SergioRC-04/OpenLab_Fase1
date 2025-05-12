import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import appFirebase from "../credenciales";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { ThemeContext } from "../contexts/ThemeContext";
import ThemeToggle from "./ThemeToggle";
import "./Auth.css";

const auth = getAuth(appFirebase);

const Login = ({ setUsuario }) => {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    const correo = e.target.email.value;
    const contraseña = e.target.password.value;

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        correo,
        contraseña
      );
      setUsuario(userCredential.user); // Guarda el usuario en el estado global
      setError(""); // Limpia errores si el inicio de sesión es exitoso
      navigate("/home"); // Cambiar esto de "/" a "/home" para redirigir correctamente
    } catch {
      setError("El correo o la contraseña son incorrectos.");
    }
  };

  return (
    <div className="auth-container">
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <ThemeToggle />
      </div>
      <h2>Inicio de Sesión</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Iniciar Sesión</button>
      </form>
      <p>
        ¿No tienes cuenta?{" "}
        <button onClick={() => navigate("/register")}>Regístrate</button>
      </p>
      <p style={{ marginTop: '10px' }}>
        <button onClick={() => navigate("/")} style={{ color: 'var(--primary)' }}>
          Volver al inicio
        </button>
      </p>
    </div>
  );
};

export default Login;
