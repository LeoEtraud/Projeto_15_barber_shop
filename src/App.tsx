import { Helmet, HelmetProvider } from "react-helmet-async";
import { ToastProvider } from "@heroui/react";
import { useEffect } from "react";

import { Router } from "./routes";
import { AuthProvider } from "./contexts/AuthProvider";

function App() {
  useEffect(() => {
    // Dispara a chamada para acordar o servidor Render
    fetch("https://barber-shop-api-i1me.onrender.com/healthz", {
      method: "GET",
    })
      .then((res) => {
        console.log("Servidor acordado:", res.status);
      })
      .catch((err) => {
        console.error("Erro ao acordar servidor:", err);
      });
  }, []); // Executa apenas uma vez ao iniciar a aplicação

  return (
    <HelmetProvider>
      <Helmet titleTemplate="%s | Barbearia" />
      <ToastProvider placement="top-right" toastOffset={60} />
      <AuthProvider>
        <Router />
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
