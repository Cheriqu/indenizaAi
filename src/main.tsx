import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./app/App";
import About from "./app/About";
import Admin from "./app/components/Admin";
<<<<<<< HEAD
// Forçando importação explícita e index para debug
import MissionControlPage from "./app/mission-control/index";
=======
import MissionControl from "./app/components/MissionControl";
>>>>>>> e920a5f1ef9942d4a29d5d1191319f43e2cce6ea
import "./styles/index.css";

// DEBUG: Verificar se componente foi carregado corretamente
console.log("DEBUG: MissionControl Component:", MissionControlPage);

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/about" element={<About />} />
      <Route path="/admin" element={<Admin />} />
<<<<<<< HEAD
      <Route path="/mission-control" element={<MissionControlPage />} />
=======
      <Route path="/mission-control" element={<MissionControl />} />
>>>>>>> e920a5f1ef9942d4a29d5d1191319f43e2cce6ea
    </Routes>
  </BrowserRouter>
);
