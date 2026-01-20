import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"
import "./utils/console"
import "./utils/devMode"

// Force cache invalidation - Build: 2026-01-14-v3

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
