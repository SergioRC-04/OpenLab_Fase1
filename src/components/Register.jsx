import React, { useState } from "react";
import appFirebase from "../credenciales";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./Auth.css"; // Importar estilos

const auth = getAuth(appFirebase);

const Register = () => {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    const nombre = e.target.nombre.value;
    const apellido = e.target.apellido.value;
    const edad = e.target.edad.value;
    const correo = e.target.email.value;
    const contraseña = e.target.password.value;

    if (contraseña.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, correo, contraseña);
      setError(""); // Limpia errores si el registro es exitoso
      alert(
        `Usuario registrado exitosamente:\nNombre: ${nombre} ${apellido}\nEdad: ${edad}`
      );
      navigate("/login"); // Redirige a Login
    } catch {
      setError("Error al registrar el usuario. Intente nuevamente.");
    }
  };

  return (
    <div className="auth-container">
      <h2>Registro</h2>
      <form onSubmit={handleRegister}>
        <input type="text" name="nombre" placeholder="Nombre" required />
        <input type="text" name="apellido" placeholder="Apellido" required />
        <input type="number" name="edad" placeholder="Edad" required />
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
        {error && <p>{error}</p>}
        <button type="submit">Registrarse</button>
      </form>
      <p>
        ¿Ya tienes cuenta?{" "}
        <button onClick={() => navigate("/login")}>Inicia Sesión</button>
      </p>
    </div>
  );
};

export default Register;
