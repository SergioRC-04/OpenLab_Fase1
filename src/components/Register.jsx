"use client"

import { useState, useContext } from "react" // Añadir useContext aquí
import appFirebase from "../credenciales"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { getFirestore, doc, setDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import "./Auth.css"
import { ThemeContext } from "../contexts/ThemeContext"
import ThemeToggle from "./ThemeToggle"

const auth = getAuth(appFirebase)
const db = getFirestore(appFirebase) // Inicializar Firestore

const Register = () => {
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { darkMode } = useContext(ThemeContext)

  const handleRegister = async (e) => {
    e.preventDefault()
    const nombre = e.target.nombre.value
    const apellido = e.target.apellido.value
    const edad = e.target.edad.value
    const correo = e.target.email.value
    const contraseña = e.target.password.value

    // Nuevos campos agregados
    const estudios = e.target.estudios.value
    const experiencia = e.target.experiencia.value
    const habilidadesCV = e.target.habilidadesCV.value
    const linkedin = e.target.linkedin.value
    const stackTecnologico = e.target.stackTecnologico.value

    if (contraseña.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }

    try {
      // Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, correo, contraseña)

      const userId = userCredential.user.uid

      // Guardar información adicional en Firestore incluyendo la estructura de reputación
      await setDoc(doc(db, "usuarios", userId), {
        // Información básica del usuario
        nombre,
        apellido,
        edad,
        correo,
        fechaRegistro: new Date(),

        // Nuevos campos agregados
        estudios,
        experiencia,
        habilidadesCV,
        linkedin,
        stackTecnologico,

        // Campos para el sistema de reputación
        puntos: {
          total: 0,
          porProyectos: 0,
          porLikes: 0,
          porComentarios: 0,
          porActividad: 0,
        },
        nivel: {
          actual: 1,
          siguienteNivel: 100,
          progreso: 0,
        },
        logros: [],
      })

      setError("") // Limpia errores si el registro es exitoso
      alert("Usuario registrado exitosamente.")
      navigate("/login") // Redirige a Login
    } catch (error) {
      setError("Error al registrar el usuario. Intente nuevamente.")
      console.error("Error:", error)
    }
  }

  return (
    <div className="auth-container">
      <div style={{ position: "absolute", top: "20px", right: "20px" }}>
        <ThemeToggle />
      </div>
      <h2>Registro</h2>
      <form onSubmit={handleRegister}>
        <input type="text" name="nombre" placeholder="Nombre" required />
        <input type="text" name="apellido" placeholder="Apellido" required />
        <input type="number" name="edad" placeholder="Edad" required />
        <input type="email" name="email" placeholder="Correo electrónico" required />
        <input type="password" name="password" placeholder="Contraseña" required />

        {/* Nuevos campos agregados */}
        <input
          type="text"
          name="estudios"
          placeholder="Estudios (ej: Ingeniería en Sistemas, Licenciatura en...)"
          required
        />
        <input
          type="text"
          name="experiencia"
          placeholder="Experiencia laboral (ej: 2 años como desarrollador...)"
          required
        />
        <input
          type="text"
          name="habilidadesCV"
          placeholder="Habilidades profesionales (ej: Liderazgo, Comunicación...)"
          required
        />
        <input
          type="url"
          name="linkedin"
          placeholder="URL de LinkedIn (ej: https://linkedin.com/in/tu-perfil)"
          required
        />
        <input
          type="text"
          name="stackTecnologico"
          placeholder="Stack tecnológico (ej: React, Node.js, Python, Firebase)"
          required
        />

        {error && <p>{error}</p>}
        <button type="submit">Registrarse</button>
      </form>
      <p>
        ¿Ya tienes cuenta? <button onClick={() => navigate("/login")}>Inicia Sesión</button>
      </p>
    </div>
  )
}

export default Register
