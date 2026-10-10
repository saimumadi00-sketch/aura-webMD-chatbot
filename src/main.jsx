/*
 * Application entry: load shared styles, create the React root, and mount the router.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import AppWrapper from "./components/App";
import "./index.css";
import "../styles/custom.css";
import "./styles/tokens.css";
import "./styles/design-system.css";


// AppWrapper owns the router; mount it once into Vite's HTML entry point.
const root = createRoot(document.getElementById("root"));
root.render(<AppWrapper />);
