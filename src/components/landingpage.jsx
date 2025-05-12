import React from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css"; // Using your existing Auth.css that contains landing page styles

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Header/Navigation */}
      <header className="header">
        <div className="container">
          <div className="logo">Mi OpenLab</div>
          <nav className="nav">
            <ul>
              <li><a href="#features">Características</a></li>
              <li><a href="#about">¿Qué es?</a></li>
              <li><button onClick={() => navigate("/login")} className="nav-button">Iniciar Sesión</button></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Crea, Comparte y Explora Proyectos en Mi OpenLab</h1>
            <p className="subtitle">Un espacio para makers, estudiantes y desarrolladores que quieren construir y mostrar sus ideas.</p>
            <p className="subheadline">Gestiona tus proyectos, colabora con otros y descubre lo que está creando la comunidad.</p>
            <div className="cta-buttons">
              <button onClick={() => navigate("/register")} className="btn primary">Registrarse Gratis</button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <h2>¿Qué es Mi OpenLab?</h2>
          <p className="section-description">Tu laboratorio digital para experimentar, aprender y colaborar.</p>
          <p>Mi OpenLab es una plataforma donde puedes registrar tus ideas, llevar control de tus avances y compartir tus proyectos con el mundo.</p>
          
          <div className="features-list">
            <div className="feature">
              <span className="emoji">🧠</span>
              <p>Ideal para estudiantes, profesores, hackers y creativos.</p>
            </div>
            <div className="feature">
              <span className="emoji">🔒</span>
              <p>Tus proyectos privados, protegidos.</p>
            </div>
            <div className="feature">
              <span className="emoji">🌐</span>
              <p>Tus proyectos públicos, al alcance de todos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="features">
        <div className="container">
          <h2>Características clave</h2>
          <div className="feature-cards">
            <div className="card">
              <div className="card-icon">🚀</div>
              <h3>Crea proyectos fácilmente</h3>
              <p>Con una interfaz intuitiva que se adapta a cualquier tipo de proyecto.</p>
            </div>
            <div className="card">
              <div className="card-icon">👥</div>
              <h3>Gestiona tu perfil</h3>
              <p>Personaliza tu espacio y haz que otros conozcan tu trabajo.</p>
            </div>
            <div className="card">
              <div className="card-icon">🔍</div>
              <h3>Explora proyectos públicos</h3>
              <p>Inspírate viendo lo que otros usuarios están creando.</p>
            </div>
            <div className="card">
              <div className="card-icon">📂</div>
              <h3>Organización clara</h3>
              <p>Usa etiquetas, estados y categorías para mantener el orden.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container">
          <h2>Lo que dicen nuestros usuarios</h2>
          <div className="testimonial-container">
            <div className="testimonial">
              <p className="quote">"Mi OpenLab me ayudó a organizar mis proyectos de universidad y mostrarlos en mi portafolio."</p>
              <p className="author">— Carlos M., estudiante de ingeniería</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>Empieza a construir tus ideas hoy</h2>
          <p>No necesitas experiencia previa. ¡Únete gratis y comienza a crear!</p>
          <button onClick={() => navigate("/register")} className="btn primary large">Crear Cuenta Gratuita</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <h3>Mi OpenLab</h3>
              <p>Tu espacio para crear y colaborar</p>
            </div>
            <div className="footer-links">
              <div className="link-group">
                <h4>Plataforma</h4>
                <ul>
                  <li><a href="#features">Características</a></li>
                  <li><a href="#about">Sobre nosotros</a></li>
                  <li><a href="#">Precios</a></li>
                </ul>
              </div>
             
              <div className="link-group">
                <h4>Social</h4>
                <div className="social-links">
                  <a href="#" className="social-link">
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a href="#" className="social-link">
                    <i className="fab fa-github"></i>
                  </a>
                  <a href="#" className="social-link">
                    <i className="fab fa-linkedin"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="copyright">
            <p>&copy; 2025 Mi OpenLab. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;