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
    <section className="flex flex-col gap-4 py-0 md:py-0 bg-stone-900 min-h-screen">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-4 py-3 bg-stone-950">
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

      {/* Conteúdo */}
      <div className="flex flex-col gap-6 px-4 py-2 md:px-8 flex-1">
        <Helmet title="Agendamento" />

        {/* Card principal 1/4 da página */}
        <div className="relative w-full rounded-xl overflow-hidden shadow-lg bg-gray-800 min-h-[25vh]">
          <img
            alt="Banner"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            src="/image-1.png"
          />
          <div className="absolute bottom-0 left-0 p-4">
            <span className="text-white text-xl md:text-2xl font-semibold drop-shadow">
              Escolha um barbeiro
            </span>
          </div>
        </div>

        {/* Lista de barbeiros */}
        <div className="grid grid-cols-1 mb-4 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              id: "1",
              firstName: "Léo",
              lastName: "Balata",
              services: 128,
              img: "/barber-1.png",
            },
            {
              id: "2",
              firstName: "Felipe",
              lastName: "Souza",
              services: 73,
              img: "/barber-2.png",
            },
            {
              id: "3",
              firstName: "João",
              lastName: "Pereira",
              services: 99,
              img: "/barber-3.png",
            },
            {
              id: "4",
              firstName: "Henrique",
              lastName: "Oliveira",
              services: 85,
              img: "/barber-4.png",
            },
          ].map((barber) => (
            <button
              key={barber.id}
              className="flex items-center gap-3 rounded-lg bg-stone-950 p-3 shadow hover:shadow-md transition-shadow text-left"
              type="button"
              onClick={() =>
                navigate("/choice-barber", { state: { barberId: barber.id } })
              }
            >
              <img
                alt={`Barbeiro ${barber.firstName}`}
                className="h-16 w-14 rounded-md object-cover"
                src={barber.img}
              />
              <div className="flex-1">
                <div className="text-white font-semibold">
                  {barber.firstName} {barber.lastName}
                </div>
                <div className="text-xs text-gray-400">
                  {barber.services} atendimentos
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} aria-hidden className="text-yellow-400">
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
