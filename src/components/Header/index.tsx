import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthProvider/useAuth";

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // FUNÇÃO PARA GERAR LETRAS INICIAIS DO NOME DE USUÁRIO
  function getUserInitials(name: string) {
    if (!name) return "U";
    const parts = name.trim().split(" ").filter(Boolean);
    const first = parts[0]?.[0]?.toUpperCase() ?? "";
    const last =
      parts.length > 1 ? parts[parts.length - 1]?.[0]?.toUpperCase() : "";

    return first + last || "U";
  }

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <button
          aria-label="Ir para inicial"
          className="flex items-center gap-2 focus:outline-none"
          type="button"
          onClick={() => navigate("/home")}
        >
          <img
            alt="Logo da Barbearia"
            className="h-9 w-9 select-none border-1 border-gray-300 rounded-lg "
            src="/logo-ia.png"
          />
          <span className="text-white font-semibold text-lg">Barbearia</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <button className="rounded-full focus:outline-none">
              <Avatar isBordered className="w-10 h-10 text-md" color="primary">
                {getUserInitials(user?.user.nome ?? "")}
              </Avatar>
            </button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Menu do usuário"
            onAction={(key) => {
              if (key === "profile") {
                if (user?.user?.id) {
                  navigate(`/user-profile/${user.user.id}`);
                }
              }
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
  );
}
