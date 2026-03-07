import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Button, addToast } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import {
  UsersIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

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
import { useLoading } from "@/contexts/LoadingProvider";

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
  const { withLoading } = useLoading();
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
    // Obtém o ID da barbearia do usuário logado
    const barbeariaId = user?.user?.barbeariaId;

    if (!barbeariaId) {
      setHasError(true);
      setIsLoading(false);
      addToast({
        title: "Erro",
        description: "ID da barbearia não encontrado. Verifique seu perfil.",
        color: "danger",
        timeout: 5000,
      });
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);

      const data = await withLoading(getDashboardStats(barbeariaId));

      setStats(data);
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
      setHasError(true);
      addToast({
        title: "Erro",
        description: "Falha ao carregar dados do dashboard. Tente novamente.",
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
    <section className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Header />

      <div className="px-4 py-6 md:py-8 md:px-6 lg:px-8 flex-1 pb-28 md:pb-36 lg:pb-40">
        <Helmet title="Dashboard - Gestor" />

        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
              Dashboard do Gestor
            </h1>
            <p className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
              Bem-vindo,{" "}
              <span className="font-bold transition-colors duration-300" style={{ color: "var(--accent-primary)" }}>
                {user?.user?.nome}
                {"!"}
              </span>
            </p>
          </div>

          {/* Cards de Estatísticas Gerais - mobile: 1 col, tablet: 2x2, desktop: 4 col */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 md:mb-6">
            <div className="metric-card p-3 sm:p-4 lg:p-6 border transition-colors duration-300" style={{ backgroundColor: "#0080ff", borderColor: "rgba(128, 128, 128, 0.6)" }}>
              <div className="flex items-start justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                <h3 className="text-xs sm:text-sm transition-colors duration-300 font-bold text-white">Total de Clientes</h3>
                <UserGroupIcon aria-hidden className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 flex-shrink-0 text-black" />
              </div>
              {isLoading ? (
                <div className="h-7 w-14 sm:h-8 sm:w-16 lg:h-10 lg:w-20 rounded animate-pulse bg-white/20" />
              ) : hasError ? (
                <p className="text-sm sm:text-base lg:text-lg text-red-200">Erro</p>
              ) : (
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {stats.totalClientes}
                </p>
              )}
            </div>

            <div className="metric-card p-3 sm:p-4 lg:p-6 border transition-colors duration-300" style={{ backgroundColor: "#0080ff", borderColor: "rgba(128, 128, 128, 0.6)" }}>
              <div className="flex items-start justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                <h3 className="text-xs sm:text-sm transition-colors duration-300 font-bold text-white">Agendamentos Hoje</h3>
                <CalendarDaysIcon aria-hidden className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 flex-shrink-0 text-black" />
              </div>
              {isLoading ? (
                <div className="h-7 w-14 sm:h-8 sm:w-16 lg:h-10 lg:w-20 rounded animate-pulse bg-white/20" />
              ) : hasError ? (
                <p className="text-sm sm:text-base lg:text-lg text-red-200">Erro</p>
              ) : (
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {stats.agendamentosHoje}
                </p>
              )}
            </div>

            <div className="metric-card p-3 sm:p-4 lg:p-6 border transition-colors duration-300" style={{ backgroundColor: "#0080ff", borderColor: "rgba(128, 128, 128, 0.6)" }}>
              <div className="flex items-start justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                <h3 className="text-xs sm:text-sm transition-colors duration-300 font-bold text-white">Profissionais</h3>
                <UsersIcon aria-hidden className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 flex-shrink-0 text-black" />
              </div>
              {isLoading ? (
                <div className="h-7 w-14 sm:h-8 sm:w-16 lg:h-10 lg:w-20 rounded animate-pulse bg-white/20" />
              ) : hasError ? (
                <p className="text-sm sm:text-base lg:text-lg text-red-200">Erro</p>
              ) : (
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {stats.quantidadeProfissionais}
                </p>
              )}
            </div>

            <div className="metric-card p-3 sm:p-4 lg:p-6 border transition-colors duration-300" style={{ backgroundColor: "#0080ff", borderColor: "rgba(128, 128, 128, 0.6)" }}>
              <div className="flex items-start justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                <h3 className="text-xs sm:text-sm transition-colors duration-300 font-bold text-white">Receita do Mês</h3>
                <CurrencyDollarIcon aria-hidden className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 flex-shrink-0 text-black" />
              </div>
              {isLoading ? (
                <div className="h-7 w-14 sm:h-8 sm:w-16 lg:h-10 lg:w-20 rounded animate-pulse bg-white/20" />
              ) : hasError ? (
                <p className="text-sm sm:text-base lg:text-lg text-red-200">Erro</p>
              ) : (
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {formatPrice(stats.receitaMes)}
                </p>
              )}
            </div>
          </div>

          {/* Seções de Gerenciamento - tablet: 2 col, desktop: 2 col */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 lg:gap-6 mb-4 md:mb-6">
            {/* Gerenciar Barbeiros */}
            <PermissionGate requiredPermissions={["manage_barbers"]}>
              <div className="metric-card p-6 border transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-semibold leading-tight transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                      Gerenciar Profissionais
                    </h2>
                    <p className="text-xs leading-tight mt-0.5 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                      Gerencie os profissionais da barbearia
                    </p>
                  </div>
                  <div className="flex items-center self-stretch flex-shrink-0">
                    <Button
                      className="min-w-[6.5rem]"
                      color="primary"
                      size="sm"
                      onPress={() => navigate("/gestor/barbeiros")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Acessar
                        <ChevronRightIcon className="w-4 h-4" aria-hidden />
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </PermissionGate>

            {/* Gerenciar Serviços */}
            <PermissionGate requiredPermissions={["manage_services"]}>
              <div className="metric-card p-6 border transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-semibold leading-tight transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                      Gerenciar Serviços
                    </h2>
                    <p className="text-xs leading-tight mt-0.5 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                      Gerencie os serviços oferecidos
                    </p>
                  </div>
                  <div className="flex items-center self-stretch flex-shrink-0">
                    <Button
                      className="min-w-[6.5rem]"
                      color="primary"
                      size="sm"
                      onPress={() => navigate("/gestor/servicos")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Acessar
                        <ChevronRightIcon className="w-4 h-4" aria-hidden />
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </PermissionGate>

            {/* Gerenciar Horários */}
            <PermissionGate requiredPermissions={["manage_schedules"]}>
              <div className="metric-card p-6 border transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-semibold leading-tight transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                      Gerenciar Horários
                    </h2>
                    <p className="text-xs leading-tight mt-0.5 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                      Configure os horários de funcionamento
                      <br />
                      da barbearia
                    </p>
                  </div>
                  <div className="flex items-center self-stretch flex-shrink-0">
                    <Button
                      className="min-w-[6.5rem]"
                      color="primary"
                      size="sm"
                      onPress={() => navigate("/gestor/horarios")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Acessar
                        <ChevronRightIcon className="w-4 h-4" aria-hidden />
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </PermissionGate>

            {/* Gerenciar Agendamentos */}
            <PermissionGate requiredPermissions={["manage_schedules"]}>
              <div className="metric-card p-6 border transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-semibold leading-tight transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                      Gerenciar Agendamentos
                    </h2>
                    <p className="text-xs leading-tight mt-0.5 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                      Visualize a grade de disponibilidade e horários
                      <br />
                      dos próximos 6 dias
                    </p>
                  </div>
                  <div className="flex items-center self-stretch flex-shrink-0">
                    <Button
                      className="min-w-[6.5rem]"
                      color="primary"
                      size="sm"
                      onPress={() => navigate("/gestor/agendamentos")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Acessar
                        <ChevronRightIcon className="w-4 h-4" aria-hidden />
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </PermissionGate>
          </div>

          {/* Relatórios */}
          <PermissionGate requiredPermissions={["view_reports"]}>
            <div className="metric-card p-6 border mb-6 transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)" }}>
              <h2 className="text-xl font-semibold mb-4 transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
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
          <div className="metric-card p-6 border transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                Todos os Agendamentos
              </h2>
              <Button color="primary" size="sm">
                Ver Todos
              </Button>
            </div>
            <div className="text-center py-8 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
              <p>Nenhum agendamento encontrado</p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <Footer />
      </div>
    </section>
  );
}
