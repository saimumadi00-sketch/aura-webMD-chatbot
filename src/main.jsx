import React from "react";
import { createRoot } from "react-dom/client";
import AppWrapper from "./components/App";
import "./index.css";
import "../styles/custom.css";


const root = createRoot(document.getElementById("root"));
root.render(<AppWrapper />);