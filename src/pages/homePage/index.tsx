import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { usePermissions } from "@/hooks/usePermissions";
import { UserRole } from "@/types/roles";
import { getFilteredNavigation } from "@/config/navigation";

export function HomePage() {
  const navigate = useNavigate();
  const { userRole, checkAnyPermission, checkAllPermissions } =
    usePermissions();

  // Filtra os itens de navegação baseado nas permissões do usuário
  const filteredItems = useMemo(
    () => {
      try {
        if (!userRole) {
          return [];
        }

        return getFilteredNavigation(
          userRole,
          checkAnyPermission,
          checkAllPermissions
        );
      } catch (error) {
        console.error("Erro ao filtrar navegação:", error);

        return [];
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userRole]
  );

  return (
    <section className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Header fixo */}
      <Header />

      {/* Conteúdo principal */}
      <div className="px-4 py-8 md:px-8 flex-1">
        <Helmet title="home" />

        <div className="mx-auto max-w-4xl">
          {/* Banner de boas-vindas */}
          <div className="relative rounded-xl overflow-hidden shadow-lg h-40 mb-6 transition-colors duration-300" style={{ backgroundColor: "var(--bg-secondary)" }}>
            <img
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-70"
              src="/image-1.png"
            />
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-2xl font-bold drop-shadow-lg transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                Bem-vindo à Balata Barbearia
              </h1>
              <span className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                Cortamos cabelo e contamos histórias.
              </span>
            </div>
          </div>

          {/* Cards de opções - Filtrados por permissões */}
          {filteredItems.length > 0 ? (
            <div
              className={`grid gap-4 ${
                userRole === UserRole.CLIENTE && filteredItems.length === 2
                  ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className="flex flex-col items-center gap-4 rounded-lg p-6 shadow hover:shadow-md hover:border-yellow-400 border transition-all text-center transition-colors duration-300"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}
                  type="button"
                  onClick={() => navigate(item.path)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-amber)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-primary)";
                  }}
                >
                  <div className="text-4xl">{item.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                      {item.title}
                    </h3>
                    <p className="text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg p-12 text-center border transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
              <p className="text-lg transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                Nenhuma página disponível para seu perfil.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé */}
      <Footer />
    </section>
  );
}
