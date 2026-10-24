import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../style.css";
import "./admin.css";
import Admin from "./Admin.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Admin />
  </StrictMode>
);
