import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthProvider/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    <header className="w-full flex items-center justify-between px-3 py-2 bg-[var(--bg-card)] border-b border-[var(--border-primary)] sticky top-0 z-50 transition-colors duration-300 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          aria-label="Ir para inicial"
          className="flex items-center gap-2 focus:outline-none"
          type="button"
          onClick={() => navigate("/home")}
        >
          <img
            alt="Logo da Barbearia"
            className="h-12 w-12 md:h-12 md:w-12 select-none border-1 border-[var(--border-primary)] rounded-lg transition-colors duration-300"
            src="/logo-ia.png"
          />
          <span className="text-[var(--text-primary)] font-semibold text-base transition-colors duration-300">
            Balata Barbearia
          </span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        {user?.user ? (
          <Dropdown
            placement="bottom-end"
            shouldBlockScroll={false}
            backdrop="transparent"
            motionProps={{
              variants: {
                enter: {
                  y: 0,
                  opacity: 1,
                  scale: 1,
                  transition: {
                    duration: 0,
                    ease: "easeOut",
                  },
                },
                exit: {
                  y: 0,
                  opacity: 0,
                  scale: 1,
                  transition: {
                    duration: 0,
                    ease: "easeIn",
                  },
                },
              },
            }}
          >
            <DropdownTrigger>
              <button
                className="flex items-center gap-4 rounded-lg px-2 py-1 hover:bg-[var(--bg-hover)] transition-colors duration-300 focus:outline-none active:scale-100"
              >
                <div className="hidden md:flex flex-col items-end text-right">
                  <span className="text-[var(--text-primary)] text-sm font-medium leading-tight transition-colors duration-300">
                    {user.user.nome || "Usuário"}
                  </span>
                  <span className="text-[var(--text-secondary)] text-xs leading-tight mt-0.5 transition-colors duration-300">
                    {user.user.email || ""}
                  </span>
                </div>
                <Avatar
                  isBordered
                  className="w-9 h-9 md:w-9 md:h-9 text-xs flex-shrink-0 active:scale-100"
                  color="default"
                >
                  {getUserInitials(user.user.nome ?? "")}
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
        ) : (
          <Avatar isBordered className="w-10 h-10 text-sm" color="default">
            U
          </Avatar>
        )}
      </div>
    </header>
  );
}
