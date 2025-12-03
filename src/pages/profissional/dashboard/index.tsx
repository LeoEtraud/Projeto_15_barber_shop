import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { Button } from "@heroui/react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthProvider/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/PermissionGate";

/**
 * Dashboard do Profissional (Barbeiro)
 *
 * Funcionalidades sugeridas:
 * - Visualizar agendamentos do dia
 * - Histórico de atendimentos
 * - Perfil do profissional
 * - Horários disponíveis
 * - Estatísticas pessoais
 */
export function ProfissionalDashboardPage() {
  const { user } = useAuth();
  const { isProfissional } = usePermissions();

  useEffect(() => {
    if (!isProfissional) {
      console.warn("Usuário não é um profissional");
    }
  }, [isProfissional]);

  return (
    <section className="min-h-screen bg-gray-800 flex flex-col text-white">
      <Header />

      <div className="px-4 py-8 md:px-8 flex-1">
        <Helmet title="Dashboard - Profissional" />

        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Dashboard do Profissional
            </h1>
            <p className="text-gray-400">
              Bem-vindo, {user?.user?.nome || "Profissional"}
            </p>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm mb-2">Agendamentos Hoje</h3>
              <p className="text-3xl font-bold text-yellow-400">0</p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm mb-2">
                Agendamentos da Semana
              </h3>
              <p className="text-3xl font-bold text-blue-400">0</p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm mb-2">Avaliação Média</h3>
              <p className="text-3xl font-bold text-green-400">0.0</p>
            </div>
          </div>

          {/* Seção de Agendamentos */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Meus Agendamentos
              </h2>
              <PermissionGate requiredPermissions={["manage_schedules"]}>
                <Button color="primary" size="sm">
                  Gerenciar Horários
                </Button>
              </PermissionGate>
            </div>

            <div className="text-center py-8 text-gray-400">
              <p>Nenhum agendamento encontrado</p>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              Ações Rápidas
            </h2>
            <div className="flex flex-wrap gap-3">
              <Button color="primary" variant="flat">
                Ver Perfil
              </Button>
              <Button color="secondary" variant="flat">
                Meus Horários
              </Button>
              <Button color="success" variant="flat">
                Histórico
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
}
