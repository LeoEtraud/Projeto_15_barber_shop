import { Helmet, HelmetProvider } from "react-helmet-async";
import { ToastProvider } from "@heroui/react";

import { Router } from "./routes";
import { AuthProvider } from "./contexts/AuthProvider";
import { UserProvider } from "./contexts/UserProvider";
import { ScheduleProvider } from "./contexts/ScheduleProvider";

function App() {
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
