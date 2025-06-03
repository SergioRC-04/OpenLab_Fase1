import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import appFirebase from "../credenciales";
import "./CreateCommunity.css";

const db = getFirestore(appFirebase);

const CreateCommunity = ({ usuario }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    categoria: "Desarrollo",
    imagen: "",
    tags: []
  });
  const [currentTag, setCurrentTag] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Categorías predefinidas
  const categorias = [
    "Desarrollo", 
    "Diseño", 
    "IA", 
    "Bases de Datos", 
    "Frontend", 
    "Backend", 
    "Mobile", 
    "DevOps", 
    "Seguridad",
    "Otros"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag]
      });
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!usuario) {
      alert("Debes iniciar sesión para crear una comunidad");
      return navigate("/login");
    }
    
    if (!formData.nombre.trim() || !formData.descripcion.trim()) {
      alert("El nombre y la descripción son obligatorios");
      return;
    }
    
    setLoading(true);
    
    try {
      // Preparar datos de la comunidad
      const communityData = {
        ...formData,
        creadorId: usuario.uid,
        creadorNombre: usuario.email.split("@")[0],
        createdAt: serverTimestamp(),
        miembros: 1, // El creador es el primer miembro
        destacada: false
      };
      
      // Crear la comunidad
      const docRef = await addDoc(collection(db, "communities"), communityData);
      
      // Añadir al creador como miembro y administrador
      await addDoc(collection(db, "community_members"), {
        communityId: docRef.id,
        userId: usuario.uid,
        role: "admin",
        joinedAt: serverTimestamp()
      });
      
      alert("¡Comunidad creada con éxito!");
      navigate(`/communities/${docRef.id}`);
    } catch (error) {
      console.error("Error al crear la comunidad:", error);
      alert("Ha ocurrido un error al crear la comunidad");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-community-page">
      <header className="create-community-header">
        <div className="header-content">
          <div className="nav-section">
            <button 
              className="back-btn"
              onClick={() => navigate("/communities")}
            >
              <i className="fas fa-arrow-left"></i> Volver a Comunidades
            </button>
            <h1 onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Mi OpenLab</h1>
          </div>
          <div className="user-section">
            {usuario && (
              <div className="user-avatar" onClick={() => navigate("/profile")} title="Ver perfil">
                <span>{usuario.email[0].toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="create-community-main">
        <div className="create-community-container">
          <h1>Crear Nueva Comunidad</h1>
          <p className="create-community-subtitle">
            Las comunidades son espacios para conectar con personas con intereses similares.
          </p>
          
          <form onSubmit={handleSubmit} className="community-form">
            <div className="form-group">
              <label htmlFor="nombre">Nombre de la comunidad *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ej: React Developers"
                required
                maxLength={50}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="descripcion">Descripción *</label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Describe de qué trata esta comunidad..."
                required
                rows={4}
                maxLength={500}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="categoria">Categoría</label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleInputChange}
              >
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="imagen">URL de la imagen (opcional)</label>
              <input
                type="url"
                id="imagen"
                name="imagen"
                value={formData.imagen}
                onChange={handleInputChange}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              {formData.imagen && (
                <div className="image-preview">
                  <img src={formData.imagen} alt="Vista previa" />
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label>Etiquetas (opcional)</label>
              <div className="tags-input">
                <input 
                  type="text" 
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Añade etiquetas relevantes"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <button 
                  type="button"
                  onClick={handleAddTag}
                  className="add-tag-btn"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              <div className="tags-container">
                {formData.tags.map(tag => (
                  <div key={tag} className="tag-item">
                    <span>{tag}</span>
                    <button 
                      type="button"
                      className="remove-tag-btn"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => navigate("/communities")}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Creando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus"></i> Crear Comunidad
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
      
      <footer className="create-community-footer">
        <div className="footer-content">
          <p>&copy; 2025 Mi OpenLab | Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  );
};

export default CreateCommunity;