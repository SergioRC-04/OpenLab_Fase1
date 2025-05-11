import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/Home";
import ProjectDetail from "./components/ProjectDetail";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [usuario, setUsuario] = useState(null);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute usuario={usuario}>
              <Home correoUsuario={usuario?.email} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/proyecto/:id"
          element={
            <ProtectedRoute usuario={usuario}>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login setUsuario={setUsuario} />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
