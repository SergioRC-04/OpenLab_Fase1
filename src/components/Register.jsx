import React, { useState } from "react";
import appFirebase from "../credenciales";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore"; // Importar Firestore
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const auth = getAuth(appFirebase);
const db = getFirestore(appFirebase); // Inicializar Firestore

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
      // Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        correo,
        contraseña
      );

      const userId = userCredential.user.uid; // Obtener el UID del usuario

      // Guardar información adicional en Firestore
      await setDoc(doc(db, "usuarios", userId), {
        nombre,
        apellido,
        edad,
        correo,
      });

      setError(""); // Limpia errores si el registro es exitoso
      alert("Usuario registrado exitosamente.");
      navigate("/login"); // Redirige a Login
    } catch (error) {
      setError("Error al registrar el usuario. Intente nuevamente.");
      console.error("Error:", error);
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
