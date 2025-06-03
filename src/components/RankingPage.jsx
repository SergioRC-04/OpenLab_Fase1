import React from "react";
import { useNavigate } from "react-router-dom";
import UserRanking from "./UserRanking";
import ThemeToggle from "./ThemeToggle";
import "./home-details.css";

const RankingPage = ({ usuario }) => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div
            className="logo-section"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            <h1>Mi OpenLab</h1>
          </div>
          <div className="user-section">
            <ThemeToggle />
            {usuario ? (
              <>
                <div className="user-info">
                  <span className="user-name">
                    {usuario.email.split("@")[0]}
                  </span>
                  <span className="user-email">{usuario.email}</span>
                </div>
                <div
                  className="user-avatar"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate("/profile")}
                  title="Ver perfil"
                >
                  <span>{usuario.email[0].toUpperCase()}</span>
                </div>
                <button className="nav-btn" onClick={() => navigate("/home")}>
                  <i className="fas fa-home"></i>
                  <span>Mi Dashboard</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className="nav-button"
                  onClick={() => navigate("/login")}
                >
                  Iniciar Sesión
                </button>
              </>
            )}
            <button className="nav-button" onClick={() => navigate("/explore")}>
              <i className="fas fa-arrow-left"></i> Volver a Explorar
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="dashboard-main">
        <div className="dashboard-welcome">
          <div className="welcome-text">
            <h2>Ranking de la Comunidad</h2>
            <p>Descubre quiénes son los usuarios más activos y con mayor reputación en Mi OpenLab</p>
          </div>
        </div>

        {/* Ranking completo */}
        <div className="container">
          <UserRanking maxUsers={50} />
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <p>&copy; 2025 Mi OpenLab | Todos los derechos reservados</p>
          <div className="footer-links">
            <a href="/">Inicio</a>
            <a href="/#about">Sobre nosotros</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RankingPage;