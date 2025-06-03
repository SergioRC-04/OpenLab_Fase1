import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import appFirebase from "../credenciales";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { ThemeContext } from "../contexts/ThemeContext";
import ThemeToggle from "./ThemeToggle";
import "./Auth.css";

const auth = getAuth(appFirebase);

const Login = ({ setUsuario }) => {
  const [error, setError] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
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
      setUsuario(userCredential.user);
      setError("");
      navigate("/home");
    } catch {
      setError("El correo o la contraseña son incorrectos.");
    }
  };

  // Nueva función para recuperación de contraseña
  const handleResetPassword = async () => {
    const email = document.querySelector('input[name="email"]').value;
    setResetMsg("");
    setError("");
    if (!email) {
      setError(
        "Por favor, ingresa tu correo electrónico para recuperar la contraseña."
      );
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMsg("Se ha enviado un correo para restablecer tu contraseña.");
    } catch (err) {
      setError(
        "No se pudo enviar el correo de recuperación. ¿El correo es correcto?"
      );
    }
    setResetLoading(false);
  };

  return (
    <div className="auth-container">
      <div style={{ position: "absolute", top: "20px", right: "20px" }}>
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
        {resetMsg && <p className="success">{resetMsg}</p>}
        <button type="submit">Iniciar Sesión</button>
      </form>
      <button
        type="button"
        className="link-btn"
        style={{ marginTop: 10, marginBottom: 10 }}
        onClick={handleResetPassword}
        disabled={resetLoading}
      >
        {resetLoading ? "Enviando..." : "¿Olvidaste tu contraseña?"}
      </button>
      <p>
        ¿No tienes cuenta?{" "}
        <button onClick={() => navigate("/register")}>Regístrate</button>
      </p>
      <p style={{ marginTop: "10px" }}>
        <button
          onClick={() => navigate("/")}
          style={{ color: "var(--primary)" }}
        >
          Volver al inicio
        </button>
      </p>
    </div>
  );
};

export default Login;
