import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

// Force cache invalidation - Build: 2026-01-14-v3
console.log('🚀 SmartStock v2.0.1 - Build: 2026-01-14T13:00:00Z');

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
