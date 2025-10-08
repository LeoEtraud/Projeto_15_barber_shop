import { Helmet, HelmetProvider } from "react-helmet-async";
import { ToastProvider } from "@heroui/react";

import { Router } from "./routes";
import { AuthProvider } from "./contexts/AuthProvider";
import { UserProvider } from "./contexts/UserProvider";

function App() {
  return (
    <HelmetProvider>
      <Helmet titleTemplate="%s | Barbearia" />
      <ToastProvider placement="top-right" toastOffset={60} />
      <UserProvider>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </UserProvider>
    </HelmetProvider>
  );
}

export default App;
