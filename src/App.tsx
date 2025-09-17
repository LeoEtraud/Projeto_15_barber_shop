import { Helmet, HelmetProvider } from "react-helmet-async";
import { ToastProvider } from "@heroui/react";

import { Router } from "./routes";
import { AuthProvider } from "./contexts/AuthProvider";

function App() {
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
