import { lazy, Suspense } from "react";
import { CircularProgress } from "@heroui/react";
import { Route, Routes } from "react-router-dom";

import { PrivateRoute } from "./privateRoute";
import { RoleProtectedRoute } from "./roleProtectedRoute";

import { UserRole } from "@/types/roles";

const Login = lazy(() =>
  import("@/pages").then((module) => ({ default: module.Login }))
);
const CreateAccount = lazy(() =>
  import("@/pages/createAccount").then((module) => ({
    default: module.CreateAccount,
  }))
);
const ResetPassword = lazy(() =>
  import("@/pages/resetPassword").then((module) => ({
    default: module.ResetPassword,
  }))
);
const HomePage = lazy(() =>
  import("@/pages/homePage").then((module) => ({ default: module.HomePage }))
);
const ChoiceBarberPage = lazy(() =>
  import("@/pages/choiceBarber").then((module) => ({
    default: module.ChoiceBarberPage,
  }))
);
const ChoiceServicePage = lazy(() =>
  import("@/pages/choiceService").then((module) => ({
    default: module.ChoiceServicePage,
  }))
);
const ChoiceSchedulePage = lazy(() =>
  import("@/pages/choiceSchedule").then((module) => ({
    default: module.ChoiceSchedulePage,
  }))
);
const ConfirmAppointmentPage = lazy(() =>
  import("@/pages/confirmAppointment").then((module) => ({
    default: module.ConfirmAppointmentPage,
  }))
);
const HistoryAppointmentsPage = lazy(() =>
  import("@/pages/historyAppointments").then((module) => ({
    default: module.HistoryAppointmentsPage,
  }))
);
const UserProfilePage = lazy(() =>
  import("@/pages/userProfile").then((module) => ({
    default: module.UserProfilePage,
  }))
);
const ProfissionalDashboardPage = lazy(() =>
  import("@/pages/profissional/dashboard").then((module) => ({
    default: module.ProfissionalDashboardPage,
  }))
);
const GestorDashboardPage = lazy(() =>
  import("@/pages/gestor/dashboard").then((module) => ({
    default: module.GestorDashboardPage,
  }))
);
const GestorBarbeirosPage = lazy(() =>
  import("@/pages/gestor/barbeiros").then((module) => ({
    default: module.GestorBarbeirosPage,
  }))
);
const GestorServicosPage = lazy(() =>
  import("@/pages/gestor/servicos").then((module) => ({
    default: module.GestorServicosPage,
  }))
);
const GestorHorariosPage = lazy(() =>
  import("@/pages/gestor/horarios").then((module) => ({
    default: module.GestorHorariosPage,
  }))
);
const GestorAgendamentosPage = lazy(() =>
  import("@/pages/gestor/agendamentos").then((module) => ({
    default: module.GestorAgendamentosPage,
  }))
);
const NotFound = lazy(() =>
  import("@/pages/notFound").then((module) => ({ default: module.NotFound }))
);

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <CircularProgress
        aria-label="Carregando página..."
        color="primary"
        label="Carregando página..."
      />
    </div>
  );
}

export function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
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
        <Route
          element={
            <RoleProtectedRoute
              accessDeniedMessage="Você precisa de permissão para visualizar agendamentos."
              allowedRoles={[UserRole.GESTOR]}
              requiredPermissions={["manage_schedules"]}
            >
              <GestorAgendamentosPage />
            </RoleProtectedRoute>
          }
          path="/gestor/agendamentos"
        />
      </Routes>
    </Suspense>
  );
}
