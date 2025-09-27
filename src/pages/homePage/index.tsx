import { Helmet } from "react-helmet-async";
import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthProvider/useAuth";
import { Footer } from "@/components/Footer";

export function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function getUserInitials(name?: string) {
    if (!name) return "U";
    const parts = name.trim().split(" ").filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";

    return (first + last).toUpperCase() || "U";
  }

  return (
    <section className="min-h-screen bg-gray-800 flex flex-col">
      {/* Header fixo */}
      <header className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            aria-label="Ir para inicial"
            className="flex items-center gap-2 focus:outline-none"
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            <img
              alt="Logo da Barbearia"
              className="h-8 w-auto select-none"
              src="/logo-ia.png"
            />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <button className="rounded-full focus:outline-none">
                <Avatar
                  isBordered
                  className="w-7 h-7 text-sm"
                  color="default"
                  name={user?.user?.nome}
                >
                  {getUserInitials(user?.user?.nome)}
                </Avatar>
              </button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Menu do usuário"
              onAction={(key) => {
                if (key === "profile") navigate("/about");
                if (key === "logout") logout();
              }}
            >
              <DropdownItem key="profile">Perfil</DropdownItem>
              <DropdownItem key="logout" className="text-danger" color="danger">
                Sair
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="px-4 py-8 md:px-8 flex-1">
        <Helmet title="Dashboard" />

        <div className="mx-auto max-w-2xl">
          {/* Banner de boas-vindas */}
          <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 h-32 mb-6">
            <img
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              src="/image-1.png"
            />
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                Bem-vindo à Balata Barbearia
              </h1>
            </div>
          </div>

          {/* Cards de opções */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Card Realizar Agendamento */}
            <button
              className="flex flex-col items-center gap-4 rounded-lg bg-gray-900 p-6 shadow hover:shadow-md transition-shadow text-center"
              type="button"
              onClick={() => navigate("/choice-barber")}
            >
              <div className="text-4xl">✂️</div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Realizar Agendamento
                </h3>
                <p className="text-sm text-gray-400">
                  Agende seu horário com nossos barbeiros
                </p>
              </div>
            </button>

            {/* Card Histórico de Agendamentos */}
            <button
              className="flex flex-col items-center gap-4 rounded-lg bg-gray-900 p-6 shadow hover:shadow-md transition-shadow text-center"
              type="button"
              onClick={() => {
                // TODO: Implementar página de histórico
                alert("Funcionalidade em desenvolvimento");
              }}
            >
              <div className="text-4xl">📅</div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Histórico de Agendamentos
                </h3>
                <p className="text-sm text-gray-400">
                  Veja seus agendamentos anteriores
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <Footer />
    </section>
  );
}
