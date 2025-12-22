import { Route, Routes } from "react-router-dom";

import { PrivateRoute } from "./privateRoute";
import { RoleProtectedRoute } from "./roleProtectedRoute";

import { UserRole } from "@/types/roles";
import { UserProfilePage } from "@/pages/userProfile";
import { NotFound } from "@/pages/notFound";
import { Login } from "@/pages";
import { ResetPassword } from "@/pages/resetPassword";
import { CreateAccount } from "@/pages/createAccount";
import { HomePage } from "@/pages/homePage";
import { ChoiceBarberPage } from "@/pages/choiceBarber";
import { ChoiceServicePage } from "@/pages/choiceService";
import { ChoiceSchedulePage } from "@/pages/choiceSchedule";
import { ConfirmAppointmentPage } from "@/pages/confirmAppointment";
import { HistoryAppointmentsPage } from "@/pages/historyAppointments";
import { ProfissionalDashboardPage } from "@/pages/profissional/dashboard";
import { GestorDashboardPage } from "@/pages/gestor/dashboard";
import { GestorBarbeirosPage } from "@/pages/gestor/barbeiros";
import { GestorServicosPage } from "@/pages/gestor/servicos";
import { GestorHorariosPage } from "@/pages/gestor/horarios";

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
        path="/home"
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
            <ConfirmAppointmentPage />
          </PrivateRoute>
        }
        path="/confirm-appointment"
      />

      <Route
        element={
          <PrivateRoute>
            <HistoryAppointmentsPage />
          </PrivateRoute>
        }
        path="/history-appointments"
      />

      <Route
        element={
          <PrivateRoute>
            <UserProfilePage />
          </PrivateRoute>
        }
        path="/user-profile/:id"
      />

      {/* ROTAS PROTEGIDAS POR ROLE - PROFISSIONAL */}
      <Route
        element={
          <RoleProtectedRoute
            accessDeniedMessage="Apenas profissionais podem acessar esta página."
            allowedRoles={[UserRole.PROFISSIONAL, UserRole.GESTOR]}
          >
            <ProfissionalDashboardPage />
          </RoleProtectedRoute>
        }
        path="/profissional/dashboard"
      />

      {/* ROTAS PROTEGIDAS POR ROLE - GESTOR */}
      <Route
        element={
          <RoleProtectedRoute
            accessDeniedMessage="Apenas gestores podem acessar esta página."
            allowedRoles={[UserRole.GESTOR]}
          >
            <GestorDashboardPage />
          </RoleProtectedRoute>
        }
        path="/gestor/dashboard"
      />
      <Route
        element={
          <RoleProtectedRoute
            accessDeniedMessage="Você precisa de permissão para gerenciar barbeiros."
            allowedRoles={[UserRole.GESTOR]}
            requiredPermissions={["manage_barbers"]}
          >
            <GestorBarbeirosPage />
          </RoleProtectedRoute>
        }
        path="/gestor/barbeiros"
      />
      <Route
        element={
          <RoleProtectedRoute
            accessDeniedMessage="Você precisa de permissão para gerenciar serviços."
            allowedRoles={[UserRole.GESTOR]}
            requiredPermissions={["manage_services"]}
          >
            <GestorServicosPage />
          </RoleProtectedRoute>
        }
        path="/gestor/servicos"
      />
      <Route
        element={
          <RoleProtectedRoute
            accessDeniedMessage="Você precisa de permissão para gerenciar horários."
            allowedRoles={[UserRole.GESTOR]}
            requiredPermissions={["manage_schedules"]}
          >
            <GestorHorariosPage />
          </RoleProtectedRoute>
        }
        path="/gestor/horarios"
      />
    </Routes>
  );
}
