import { Helmet } from "react-helmet-async";
import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthProvider/useAuth";

export function ChoiceServicePage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { barberId?: string } };
  const barberId = location.state?.barberId;
  const { user, logout } = useAuth();

  function getUserInitials(name?: string) {
    if (!name) return "U";
    const parts = name.trim().split(" ").filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";

    return (first + last).toUpperCase() || "U";
  }

  return (
    <section className="min-h-screen bg-gray-800">
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
              src="/img-barber-icon.png"
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
      <div className="px-4 py-8 md:px-8">
        <Helmet title="Selecionar serviço" />

        <div className="mx-auto max-w-2xl">
          <button
            className="text-sm text-gray-300 hover:text-white mb-4"
            type="button"
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>

          {/* Banner com imagem de fundo */}
          <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 h-32 mb-6">
            <img
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              src="/image-1.png"
            />
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                Selecione o serviço {barberId ? `(Barbeiro #${barberId})` : ""}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                id: "haircut",
                label: "Corte de cabelo",
                price: "R$ 25,00",
                duration: "30 min",
              },
              {
                id: "beard",
                label: "Barba",
                price: "R$ 20,00",
                duration: "25 min",
              },
              {
                id: "line",
                label: "Pé de cabelo",
                price: "R$ 15,00",
                duration: "15 min",
              },
              {
                id: "skin",
                label: "Limpeza de pele",
                price: "R$ 35,00",
                duration: "45 min",
              },
            ].map((service) => (
              <button
                key={service.id}
                className="rounded-lg bg-gray-900 p-4 text-left shadow hover:shadow-md transition-shadow"
                type="button"
                onClick={() =>
                  navigate("/choice-schedule", {
                    state: {
                      barberId,
                      serviceId: service.id,
                      serviceName: service.label,
                      servicePrice: service.price,
                      serviceDuration: service.duration,
                    },
                  })
                }
              >
                <div className="text-white font-medium mb-2">
                  {service.label}
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-green-400 font-semibold">
                    {service.price}
                  </span>
                  <span className="text-blue-400 text-sm">
                    {service.duration}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  Toque para selecionar
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
