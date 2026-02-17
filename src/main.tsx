import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./app/App";
import About from "./app/About";
import Admin from "./app/components/Admin";
// Forçando importação explícita e index para debug
import MissionControlPage from "./app/mission-control/index";
import "./styles/index.css";

// DEBUG: Verificar se componente foi carregado corretamente
console.log("DEBUG: MissionControl Component:", MissionControlPage);

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/about" element={<About />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/mission-control" element={<MissionControlPage />} />
    </Routes>
  </BrowserRouter>
);
