import { Route, Routes } from "react-router-dom";

import { PrivateRoute } from "./privateRoute";

import { AboutPage } from "@/pages/aboutOwner";
import { NotFound } from "@/pages/notFound";
import { Login } from "@/pages";
import { ResetPassword } from "@/pages/resetPassword";
import { CreateAccount } from "@/pages/createAccount";
import { HomePage } from "@/pages/homePage";
import { ChoiceBarberPage } from "@/pages/choiceBarber";
import { ChoiceServicePage } from "@/pages/choiceService";
import { ChoiceSchedulePage } from "@/pages/choiceSchedule";

export function Router() {
  return (
    <Routes>
      {/* ROTA DA PÁGINA NÃO ENCONTRADA  */}
      <Route element={<NotFound />} path="*" />

      {/* ROTAS PÚBLICAS */}
      <Route element={<Login />} path="/" />
      <Route element={<CreateAccount />} path="/register" />
      <Route element={<ResetPassword />} path="/recovery" />

      {/* ROTAS PRIVADAS */}
      <Route
        element={
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
        }
        path="/dashboard"
      />

      <Route
        element={
          <PrivateRoute>
            <ChoiceBarberPage />
          </PrivateRoute>
        }
        path="/choice-barber"
      />

      <Route
        element={
          <PrivateRoute>
            <ChoiceServicePage />
          </PrivateRoute>
        }
        path="/choice-service"
      />

      <Route
        element={
          <PrivateRoute>
            <ChoiceSchedulePage />
          </PrivateRoute>
        }
        path="/choice-schedule"
      />

      <Route
        element={
          <PrivateRoute>
            <AboutPage />
          </PrivateRoute>
        }
        path="/about"
      />
    </Routes>
  );
}
