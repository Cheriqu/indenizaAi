import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./app/App";
import About from "./app/About";
import Admin from "./app/components/Admin";
import MissionControl from "./app/components/MissionControl";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/about" element={<About />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/mission-control" element={<MissionControl />} />
    </Routes>
  </BrowserRouter>
);
