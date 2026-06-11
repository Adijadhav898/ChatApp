// ─── App Entry Point ──────────────────────────────────────────────────────────
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>       {/* Auth state poori app mein available */}
      <SocketProvider>   {/* Socket connection poori app mein available */}
        <App />
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
);
