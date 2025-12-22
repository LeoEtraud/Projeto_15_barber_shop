import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Button, addToast } from "@heroui/react";
import { useNavigate } from "react-router-dom";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthProvider/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/PermissionGate";
import {
  getDashboardStats,
  DashboardStats,
} from "@/contexts/GestorProvider/util";
import { formatPrice } from "@/utils/format-price";

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
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    agendamentosHoje: 0,
    quantidadeProfissionais: 0,
    receitaMes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Função para buscar dados do dashboard
  async function fetchDashboardData() {
    try {
      setIsLoading(true);
      setHasError(false);

      // Obtém o ID da barbearia do usuário logado
      const barbeariaId = user?.user?.barbeariaId;

      if (!barbeariaId) {
        throw new Error("ID da barbearia não encontrado");
      }

      const data = await getDashboardStats(barbeariaId);

      setStats(data);
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
      setHasError(true);
      addToast({
        title: "Erro",
        description:
          error instanceof Error && error.message.includes("barbearia")
            ? "ID da barbearia não encontrado. Verifique seu perfil."
            : "Falha ao carregar dados do dashboard. Tente novamente.",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isGestor) {
      console.warn("Usuário não é um gestor");

      return;
    }

    // Busca os dados quando o componente montar
    fetchDashboardData();
  }, [isGestor]);

  return (
    <section className="min-h-screen bg-gray-800 flex flex-col text-white">
      <Header />

      <div className="px-4 py-8 md:px-8 flex-1">
        <Helmet title="Dashboard - Gestor" />

        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Dashboard do Gestor
            </h1>
            <p className="text-white">
              Bem-vindo,{" "}
              <span className="text-yellow-400 font-bold">
                {user?.user?.nome}
                {"!"}
              </span>
            </p>
          </div>

          {/* Cards de Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm mb-2">Total de Clientes</h3>
              {isLoading ? (
                <div className="h-10 w-20 bg-gray-700 rounded animate-pulse" />
              ) : hasError ? (
                <p className="text-lg text-red-400">Erro</p>
              ) : (
                <p className="text-3xl font-bold text-blue-400">
                  {stats.totalClientes}
                </p>
              )}
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm mb-2">Agendamentos Hoje</h3>
              {isLoading ? (
                <div className="h-10 w-20 bg-gray-700 rounded animate-pulse" />
              ) : hasError ? (
                <p className="text-lg text-red-400">Erro</p>
              ) : (
                <p className="text-3xl font-bold text-yellow-400">
                  {stats.agendamentosHoje}
                </p>
              )}
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm mb-2">Profissionais</h3>
              {isLoading ? (
                <div className="h-10 w-20 bg-gray-700 rounded animate-pulse" />
              ) : hasError ? (
                <p className="text-lg text-red-400">Erro</p>
              ) : (
                <p className="text-3xl font-bold text-green-400">
                  {stats.quantidadeProfissionais}
                </p>
              )}
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm mb-2">Receita do Mês</h3>
              {isLoading ? (
                <div className="h-10 w-20 bg-gray-700 rounded animate-pulse" />
              ) : hasError ? (
                <p className="text-lg text-red-400">Erro</p>
              ) : (
                <p className="text-3xl font-bold text-purple-400">
                  {formatPrice(stats.receitaMes)}
                </p>
              )}
            </div>
          </div>

          {/* Seções de Gerenciamento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gerenciar Barbeiros */}
            <PermissionGate requiredPermissions={["manage_barbers"]}>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    Gerenciar Profissionais
                  </h2>
                  <Button
                    color="primary"
                    size="sm"
                    onPress={() => navigate("/gestor/barbeiros")}
                  >
                    Ver Todos
                  </Button>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Gerencie os profissionais da barbearia
                </p>
              </div>
            </PermissionGate>

            {/* Gerenciar Serviços */}
            <PermissionGate requiredPermissions={["manage_services"]}>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    Gerenciar Serviços
                  </h2>
                  <Button
                    color="primary"
                    size="sm"
                    onPress={() => navigate("/gestor/servicos")}
                  >
                    Ver Todos
                  </Button>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Gerencie os serviços oferecidos
                </p>
              </div>
            </PermissionGate>

            {/* Gerenciar Horários */}
            <PermissionGate requiredPermissions={["manage_schedules"]}>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    Gerenciar Horários
                  </h2>
                  <Button
                    color="primary"
                    size="sm"
                    onPress={() => navigate("/gestor/horarios")}
                  >
                    Configurar
                  </Button>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Configure os horários de funcionamento da barbearia
                </p>
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
