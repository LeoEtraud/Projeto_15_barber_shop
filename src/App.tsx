import { Helmet, HelmetProvider } from "react-helmet-async";
import { ToastProvider } from "@heroui/react";

import { Router } from "./routes";
import { AuthProvider } from "./contexts/AuthProvider";
import { UserProvider } from "./contexts/UserProvider";
import { ScheduleProvider } from "./contexts/ScheduleProvider";
import { useScrollToTop } from "./hooks/useScrollToTop";

function AppContent() {
  useScrollToTop();
  
  return <Router />;
}

function App() {
  return (
    <HelmetProvider>
      <Helmet titleTemplate="%s | Barbearia" />
      <ToastProvider placement="top-right" toastOffset={60} />
      <UserProvider>
        <ScheduleProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ScheduleProvider>
      </UserProvider>
    </HelmetProvider>
  );
}

export default App;
