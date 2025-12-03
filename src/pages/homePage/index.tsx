import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { usePermissions } from "@/hooks/usePermissions";
import {
  getFilteredNavigation,
  navigationItems,
} from "@/config/navigation";

export function HomePage() {
  const navigate = useNavigate();
  const {
    userRole,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
  } = usePermissions();

  // Filtra os itens de navegação baseado nas permissões do usuário
  const filteredItems = useMemo(
    () =>
      getFilteredNavigation(
        userRole,
        checkPermission,
        checkAnyPermission,
        checkAllPermissions
      ),
    [userRole, checkPermission, checkAnyPermission, checkAllPermissions]
  );

  return (
    <section className="min-h-screen bg-gray-800 flex flex-col">
      {/* Header fixo */}
      <Header />

      {/* Conteúdo principal */}
      <div className="px-4 py-8 md:px-8 flex-1">
        <Helmet title="home" />

        <div className="mx-auto max-w-4xl">
          {/* Banner de boas-vindas */}
          <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 h-40 mb-6">
            <img
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-70"
              src="/image-1.png"
            />
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                Bem-vindo à Balata Barbearia
              </h1>
              <span className="text-gray-200">
                Cortamos cabelo e contamos histórias.
              </span>
            </div>
          </div>

          {/* Cards de opções - Filtrados por permissões */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className="flex flex-col items-center gap-4 rounded-lg bg-gray-900 p-6 shadow hover:shadow-md hover:border-yellow-400 border border-gray-700 transition-all text-center"
                  type="button"
                  onClick={() => navigate(item.path)}
                >
                  <div className="text-4xl">{item.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg p-12 text-center border border-gray-700">
              <p className="text-gray-400 text-lg">
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
