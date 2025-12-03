import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { Button } from "@heroui/react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthProvider/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/PermissionGate";

/**
 * Dashboard do Gestor
 *
 * Funcionalidades sugeridas:
 * - Visão geral da barbearia
 * - Gerenciar barbeiros
 * - Gerenciar serviços
 * - Relatórios e estatísticas
 * - Gerenciar agendamentos
 * - Configurações da barbearia
 */
export function GestorDashboardPage() {
  const { user } = useAuth();
  const { isGestor } = usePermissions();

  useEffect(() => {
    if (!isGestor) {
      console.warn("Usuário não é um gestor");
    }
  }, [isGestor]);

  return (
    <section className="min-h-screen bg-gray-800 flex flex-col text-white">
      <Header />

      <div className="px-4 py-8 md:px-8 flex-1">
        <Helmet title="Dashboard - Gestor" />

        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Dashboard do Gestor
            </h1>
            <p className="text-gray-400">
              Bem-vindo, {user?.user?.nome || "Gestor"}
            </p>
          </div>

          {/* Cards de Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm mb-2">Total de Clientes</h3>
              <p className="text-3xl font-bold text-blue-400">0</p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm mb-2">Agendamentos Hoje</h3>
              <p className="text-3xl font-bold text-yellow-400">0</p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm mb-2">Profissionais</h3>
              <p className="text-3xl font-bold text-green-400">0</p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm mb-2">Receita do Mês</h3>
              <p className="text-3xl font-bold text-purple-400">R$ 0</p>
            </div>
          </div>

          {/* Seções de Gerenciamento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gerenciar Barbeiros */}
            <PermissionGate requiredPermissions={["manage_barbers"]}>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    Gerenciar Barbeiros
                  </h2>
                  <Button color="primary" size="sm">
                    Ver Todos
                  </Button>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Gerencie os profissionais da barbearia
                </p>
                <Button fullWidth color="primary" variant="flat">
                  Adicionar Barbeiro
                </Button>
              </div>
            </PermissionGate>

            {/* Gerenciar Serviços */}
            <PermissionGate requiredPermissions={["manage_services"]}>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    Gerenciar Serviços
                  </h2>
                  <Button color="primary" size="sm">
                    Ver Todos
                  </Button>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Gerencie os serviços oferecidos
                </p>
                <Button fullWidth color="primary" variant="flat">
                  Adicionar Serviço
                </Button>
              </div>
            </PermissionGate>
          </div>

          {/* Relatórios */}
          <PermissionGate requiredPermissions={["view_reports"]}>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Relatórios
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button color="primary" variant="flat">
                  Relatório de Vendas
                </Button>
                <Button color="secondary" variant="flat">
                  Relatório de Agendamentos
                </Button>
                <Button color="success" variant="flat">
                  Relatório de Clientes
                </Button>
              </div>
            </div>
          </PermissionGate>

          {/* Agendamentos */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Todos os Agendamentos
              </h2>
              <Button color="primary" size="sm">
                Ver Todos
              </Button>
            </div>
            <div className="text-center py-8 text-gray-400">
              <p>Nenhum agendamento encontrado</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
}
