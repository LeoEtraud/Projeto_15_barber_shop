import { Helmet, HelmetProvider } from "react-helmet-async";
import { ToastProvider } from "@heroui/react";
import { useEffect } from "react";

import { Router } from "./routes";
import { AuthProvider } from "./contexts/AuthProvider";
import { UserProvider } from "./contexts/UserProvider";
import { ScheduleProvider } from "./contexts/ScheduleProvider";
import { apiBarber } from "./services/apiServer";

function App() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await apiBarber.get("/healthz");

        if (!cancelled) console.log("API online:", data);
      } catch (err) {
        if (!cancelled) console.error("Erro ao conectar API:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <HelmetProvider>
      <Helmet titleTemplate="%s | Barbearia" />
      <ToastProvider placement="top-right" toastOffset={60} />
      <UserProvider>
        <ScheduleProvider>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </ScheduleProvider>
      </UserProvider>
    </HelmetProvider>
  );
}

export default App;
