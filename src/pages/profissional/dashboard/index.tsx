import { Helmet } from "react-helmet-async";
import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  addToast,
  Input,
} from "@heroui/react";
import { FunnelIcon } from "@heroicons/react/24/outline";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthProvider/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";
import { ConfirmAppointment } from "@/contexts/ScheduleProvider/util";
import { useLoading } from "@/contexts/LoadingProvider";

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
  const { fetchAppointmentsByProfessional, professionalAppointments } =
    useSchedule();
  const { withLoading } = useLoading();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Estados para filtros do histórico
  const [filterService, setFilterService] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Obtém o profissionalId do user (pode estar em user?.user?.profissionalId ou user?.user?.id)
  const profissionalId = (user?.user as any)?.profissionalId || user?.user?.id;

  useEffect(() => {
    if (!isProfissional) {
      console.warn("Usuário não é um profissional");
    }
  }, [isProfissional]);

  useEffect(() => {
    const loadAppointments = async () => {
      if (profissionalId) {
        setIsLoading(true);
        setHasError(false);
        try {
          await withLoading(fetchAppointmentsByProfessional(profissionalId) as Promise<unknown>);
        } catch {
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profissionalId]);

  // Função auxiliar para converter DD/MM/YYYY em Date ou usar hora_inicio
  const getAppointmentDate = (appointment: any): Date => {
    // Tenta usar a data formatada primeiro
    if (appointment.data) {
      const parts = appointment.data.split("/");

      if (parts.length === 3) {
        return new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0])
        );
      }
    }

    // Se não tiver data formatada, usa hora_inicio
    if (appointment.hora_inicio) {
      return new Date(appointment.hora_inicio);
    }

    return new Date(0);
  };

  // Filtra apenas agendamentos confirmados e ordena por hora_inicio (crescente - mais antigo primeiro)
  const confirmedAppointments = useMemo(() => {
    const filtered = professionalAppointments.filter(
      (appointment) => appointment.status?.toUpperCase() === "CONFIRMADO"
    );

    return [...filtered].sort((a, b) => {
      try {
        // Prioriza hora_inicio para ordenação (data/hora de início do serviço)
        let dateA: Date;
        let dateB: Date;

        if (a.hora_inicio) {
          dateA = new Date(a.hora_inicio);
        } else if (a.data) {
          dateA = getAppointmentDate(a);
        } else {
          dateA = new Date(0);
        }

        if (b.hora_inicio) {
          dateB = new Date(b.hora_inicio);
        } else if (b.data) {
          dateB = getAppointmentDate(b);
        } else {
          dateB = new Date(0);
        }

        // Ordem crescente pela data/hora de início (mais antigo primeiro)
        return dateA.getTime() - dateB.getTime();
      } catch {
        return 0;
      }
    });
  }, [professionalAppointments]);

  // Extrai todos os tipos de serviços únicos para o filtro
  const availableServices = useMemo(() => {
    const services = new Set<string>();

    professionalAppointments.forEach((appointment) => {
      if (appointment.servicos && appointment.servicos.length > 0) {
        appointment.servicos.forEach((service) => services.add(service));
      }
    });

    return Array.from(services).sort();
  }, [professionalAppointments]);

  // Filtra apenas atendimentos realizados e ordena por hora_inicio (decrescente - mais recente primeiro)
  const completedAppointments = useMemo(() => {
    let filtered = professionalAppointments.filter(
      (appointment) => appointment.status?.toUpperCase() === "REALIZADO"
    );

    // Aplica filtro por tipo de serviço
    if (filterService) {
      filtered = filtered.filter((appointment) => {
        return (
          appointment.servicos &&
          appointment.servicos.some((service) =>
            service.toLowerCase().includes(filterService.toLowerCase())
          )
        );
      });
    }

    // Aplica filtro por data
    if (filterDate) {
      filtered = filtered.filter((appointment) => {
        if (!appointment.data) return false;

        const appointmentDate = appointment.data.split("/").reverse().join("-"); // Converte DD/MM/YYYY para YYYY-MM-DD

        return appointmentDate === filterDate;
      });
    }

    return [...filtered].sort((a, b) => {
      try {
        // Prioriza hora_inicio para ordenação (data/hora de início do serviço)
        let dateA: Date;
        let dateB: Date;

        if (a.hora_inicio) {
          dateA = new Date(a.hora_inicio);
        } else if (a.data) {
          dateA = getAppointmentDate(a);
        } else {
          dateA = new Date(0);
        }

        if (b.hora_inicio) {
          dateB = new Date(b.hora_inicio);
        } else if (b.data) {
          dateB = getAppointmentDate(b);
        } else {
          dateB = new Date(0);
        }

        // Ordem decrescente pela data/hora de início (mais recente primeiro)
        return dateB.getTime() - dateA.getTime();
      } catch {
        return 0;
      }
    });
  }, [professionalAppointments, filterService, filterDate]);

  // Conta agendamentos de hoje
  const todayAppointments = useMemo(() => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return confirmedAppointments.filter((appointment) => {
      try {
        const appointmentDate = getAppointmentDate(appointment);

        appointmentDate.setHours(0, 0, 0, 0);

        return appointmentDate.getTime() === today.getTime();
      } catch {
        return false;
      }
    }).length;
  }, [confirmedAppointments]);

  // Conta agendamentos da semana
  const weekAppointments = useMemo(() => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const weekEnd = new Date(today);

    weekEnd.setDate(today.getDate() + 7);

    return confirmedAppointments.filter((appointment) => {
      try {
        const appointmentDate = getAppointmentDate(appointment);

        appointmentDate.setHours(0, 0, 0, 0);

        return (
          appointmentDate.getTime() >= today.getTime() &&
          appointmentDate.getTime() < weekEnd.getTime()
        );
      } catch {
        return false;
      }
    }).length;
  }, [confirmedAppointments]);

  // Verifica se uma data é hoje
  const isToday = (dateString: string): boolean => {
    if (!dateString) return false;

    try {
      const parts = dateString.split("/");

      if (parts.length === 3) {
        const [day, month, year] = parts;
        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );

        if (Number.isNaN(date.getTime())) {
          return false;
        }

        const today = new Date();

        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);

        return date.getTime() === today.getTime();
      }

      return false;
    } catch {
      return false;
    }
  };

  // Verifica se o atendimento está em andamento (horário atual entre hora_inicio e hora_fim)
  const isAppointmentInProgress = (appointment: any): boolean => {
    try {
      const now = new Date();

      // Prioriza hora_inicio e hora_fim se disponíveis (mais confiável)
      if (appointment.hora_inicio && appointment.hora_fim) {
        const startDate = new Date(appointment.hora_inicio);
        const endDate = new Date(appointment.hora_fim);

        return (
          startDate.getTime() <= now.getTime() &&
          now.getTime() <= endDate.getTime()
        );
      }

      // Se não tiver hora_inicio e hora_fim, tenta combinar data e horário
      if (appointment.data && appointment.horario) {
        const parts = appointment.data.split("/");

        if (parts.length === 3) {
          const [day, month, year] = parts;
          const timeParts = appointment.horario.split(" - ");

          if (timeParts.length === 2) {
            const [startHours, startMinutes] = timeParts[0]
              .split(":")
              .map(Number);
            const [endHours, endMinutes] = timeParts[1].split(":").map(Number);

            const startDate = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day),
              startHours || 0,
              startMinutes || 0
            );
            const endDate = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day),
              endHours || 0,
              endMinutes || 0
            );

            if (
              !Number.isNaN(startDate.getTime()) &&
              !Number.isNaN(endDate.getTime())
            ) {
              return (
                startDate.getTime() <= now.getTime() &&
                now.getTime() <= endDate.getTime()
              );
            }
          }
        }
      }

      return false;
    } catch {
      return false;
    }
  };

  // Verifica se o agendamento ainda não começou (é futuro)
  const isAppointmentFuture = (appointment: any): boolean => {
    try {
      const now = new Date();

      // Prioriza hora_inicio se disponível (mais confiável)
      if (appointment.hora_inicio) {
        const startDate = new Date(appointment.hora_inicio);

        return startDate.getTime() > now.getTime();
      }

      // Se não tiver hora_inicio, tenta combinar data e horário
      if (appointment.data && appointment.horario) {
        const parts = appointment.data.split("/");

        if (parts.length === 3) {
          const [day, month, year] = parts;
          // Pega a primeira hora do horário (ex: "14:00 - 14:30" -> "14:00")
          const timePart = appointment.horario.split(" - ")[0];
          const [hours, minutes] = timePart.split(":").map(Number);

          const startDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            hours || 0,
            minutes || 0
          );

          if (!Number.isNaN(startDate.getTime())) {
            return startDate.getTime() > now.getTime();
          }
        }
      }

      return false;
    } catch {
      return false;
    }
  };

  // Verifica se a data e horário do agendamento já passaram
  const isAppointmentPast = (appointment: any): boolean => {
    try {
      // Prioriza hora_inicio se disponível (mais confiável)
      if (appointment.hora_inicio) {
        const appointmentDate = new Date(appointment.hora_inicio);
        const now = new Date();

        return appointmentDate.getTime() <= now.getTime();
      }

      // Se não tiver hora_inicio, tenta combinar data e horário
      if (appointment.data && appointment.horario) {
        const parts = appointment.data.split("/");

        if (parts.length === 3) {
          const [day, month, year] = parts;
          // Pega a primeira hora do horário (ex: "14:00 - 14:30" -> "14:00")
          const timePart = appointment.horario.split(" - ")[0];
          const [hours, minutes] = timePart.split(":").map(Number);

          const appointmentDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            hours || 0,
            minutes || 0
          );

          if (!Number.isNaN(appointmentDate.getTime())) {
            const now = new Date();

            return appointmentDate.getTime() <= now.getTime();
          }
        }
      }

      // Se não conseguir determinar, retorna false (não habilita o botão)
      return false;
    } catch {
      return false;
    }
  };

  const formatDate = (dateString: string, shortFormat = false) => {
    if (!dateString) return "Data inválida";

    try {
      const parts = dateString.split("/");

      if (parts.length === 3) {
        const [day, month, year] = parts;
        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );

        if (Number.isNaN(date.getTime())) {
          return dateString;
        }

        // Se shortFormat for true, retorna DD/MM/YYYY
        if (shortFormat) {
          return dateString; // Já está no formato DD/MM/YYYY
        }

        // Verifica se é hoje
        if (isToday(dateString)) {
          const formattedDate = date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          });

          return `Hoje, ${formattedDate}`;
        }

        // Caso contrário, retorna formato por extenso
        return date.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }

      return dateString;
    } catch {
      return dateString;
    }
  };

  const handleConfirmAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    onOpen();
  };

  const handleConfirmModal = async () => {
    if (!selectedAppointment.id) {
      addToast({
        title: "Erro",
        description: "ID do agendamento não encontrado",
        color: "danger",
        timeout: 3000,
      });

      return;
    }

    setIsConfirming(true);

    try {
      await withLoading(
        (async () => {
          await ConfirmAppointment(selectedAppointment.id);

          addToast({
            title: "Sucesso",
            description: "Atendimento realizado com sucesso!",
            color: "success",
            timeout: 3000,
          });

          // Recarrega os agendamentos após confirmar
          if (profissionalId) {
            await fetchAppointmentsByProfessional(profissionalId);
          }

          onClose();
          setSelectedAppointment(null);
        })()
      );
    } catch (error: any) {
      addToast({
        title: "Erro",
        description:
          error?.response?.data?.error ||
          error?.message ||
          "Erro ao confirmar atendimento. Tente novamente.",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setIsConfirming(false);
    }
  };

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
            <p className="text-white">
              Bem-vindo,{" "}
              <span className="text-yellow-400 font-bold">
                {user?.user?.nome}
                {"!"}
              </span>
            </p>
          </div>

          {/* Cards de Estatísticas Modernizados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl p-6 border border-yellow-500/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-300 text-sm font-medium">
                  Agendamentos Hoje
                </h3>
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-yellow-400 text-xl">📅</span>
                </div>
              </div>
              <p className="text-4xl font-bold text-yellow-400">
                {isLoading ? "..." : todayAppointments}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-6 border border-blue-500/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-300 text-sm font-medium">
                  Agendamentos da Semana
                </h3>
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 text-xl">📆</span>
                </div>
              </div>
              <p className="text-4xl font-bold text-blue-400">
                {isLoading ? "..." : weekAppointments}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-6 border border-green-500/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-300 text-sm font-medium">
                  Total Confirmados
                </h3>
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400 text-xl">✓</span>
                </div>
              </div>
              <p className="text-4xl font-bold text-green-400">
                {isLoading ? "..." : confirmedAppointments.length}
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-500/20 to-slate-600/10 rounded-xl p-6 border border-slate-500/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-300 text-sm font-medium">
                  Total Realizados
                </h3>
                <div className="w-10 h-10 rounded-lg bg-slate-500/20 flex items-center justify-center">
                  <span className="text-slate-400 text-xl">✨</span>
                </div>
              </div>
              <p className="text-4xl font-bold text-slate-400">
                {isLoading ? "..." : completedAppointments.length}
              </p>
            </div>
          </div>

          {/* Seção de Agendamentos Confirmados */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-2xl mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Atendimentos Confirmados
                </h2>
                <p className="text-gray-400 text-sm">
                  Gerencie seus próximos atendimentos
                </p>
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="text-center py-8 text-gray-400">
                <p>Carregando agendamentos...</p>
              </div>
            )}

            {/* Error */}
            {hasError && !isLoading && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
                <div className="text-red-400 text-4xl mb-4">⚠️</div>
                <p className="text-red-200 mb-4">
                  Falha ao carregar os agendamentos!
                </p>
                <Button
                  color="danger"
                  variant="flat"
                  onClick={async () => {
                    if (profissionalId) {
                      setIsLoading(true);
                      setHasError(false);
                      try {
                        await withLoading(fetchAppointmentsByProfessional(profissionalId) as Promise<unknown>);
                      } catch {
                        setHasError(true);
                      } finally {
                        setIsLoading(false);
                      }
                    }
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            {/* Lista vazia */}
            {!isLoading && !hasError && confirmedAppointments.length === 0 && (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📅</div>
                <h3 className="text-white text-xl font-semibold mb-2">
                  Nenhum atendimento confirmado
                </h3>
                <p className="text-gray-400">
                  Você não possui atendimentos confirmados no momento.
                </p>
              </div>
            )}

            {/* Lista de agendamentos */}
            {!isLoading && !hasError && confirmedAppointments.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {confirmedAppointments.map((appointment, index) => {
                  const inProgress = isAppointmentInProgress(appointment);
                  const isFuture = isAppointmentFuture(appointment);

                  // Encontra o primeiro agendamento futuro que não está em andamento
                  const firstFutureIndex = confirmedAppointments.findIndex(
                    (apt) =>
                      isAppointmentFuture(apt) && !isAppointmentInProgress(apt)
                  );
                  const isNextAppointment =
                    firstFutureIndex === index && isFuture && !inProgress;

                  return (
                    <div
                      key={appointment.id || `appointment-${index}`}
                      className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 sm:p-5 border transition-all duration-300 relative hover:shadow-xl ${
                        inProgress
                          ? "border-green-500 hover:border-green-400 shadow-lg shadow-green-500/30 hover:scale-[1.02]"
                          : isNextAppointment
                            ? "border-yellow-400 hover:border-yellow-300 shadow-lg shadow-yellow-400/30 hover:scale-[1.02]"
                            : "border-gray-700 hover:border-yellow-400 hover:shadow-lg"
                      }`}
                    >
                      {/* Etiqueta "Atendimento em andamento" ou "Próximo atendimento" */}
                      {inProgress ? (
                        <div className="absolute -top-2.5 left-3 sm:left-4 bg-green-500 text-white text-xs sm:text-sm font-bold px-3 sm:px-3 py-0.5 sm:py-0.5 rounded-full shadow-md">
                          Atendimento em andamento
                        </div>
                      ) : (
                        isNextAppointment && (
                          <div className="absolute -top-2.5 left-3 sm:left-4 bg-yellow-400 text-gray-900 text-xs sm:text-sm font-bold px-3 sm:px-3 py-0.5 sm:py-0.5 rounded-full shadow-md">
                            Próximo atendimento
                          </div>
                        )
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-1 sm:pt-0">
                        {/* Mobile: Layout horizontal com data/horário à esquerda e serviço à direita */}
                        <div className="flex flex-col sm:hidden gap-2.5 flex-1 min-w-0">
                          <div className="flex items-start gap-1">
                            {/* Data e Horário - Esquerda */}
                            <div className="flex-shrink-0">
                              <p className="text-yellow-400 font-bold text-base">
                                {appointment.data
                                  ? formatDate(appointment.data, true)
                                  : "Data não informada"}
                              </p>
                              <p className="text-white font-semibold text-sm mt-1">
                                {appointment.horario || "Horário não informado"}
                              </p>
                            </div>

                            {/* Serviço - Direita */}
                            <div className="flex-1 min-w-0 border-l border-gray-700 pl-3">
                              <p className="text-gray-400 text-xs mb-1">
                                Serviço
                              </p>
                              <p className="text-white font-semibold text-sm">
                                {appointment.servicos &&
                                appointment.servicos.length > 0
                                  ? appointment.servicos.join(", ")
                                  : "Serviço não informado"}
                              </p>
                            </div>
                          </div>

                          {/* Cliente - Abaixo da data/horário e serviço */}
                          {appointment.cliente?.nome && (
                            <div className="pt-1 border-t border-gray-700">
                              <p className="text-white text-xs">
                                <span className="text-gray-400">Cliente: </span>
                                {appointment.cliente.nome}
                              </p>
                            </div>
                          )}

                          {/* Botão Mobile */}
                          <div className="mt-1">
                            <Button
                              className="w-full text-xs"
                              color="primary"
                              isDisabled={!isAppointmentPast(appointment)}
                              size="sm"
                              type="button"
                              onClick={() =>
                                handleConfirmAppointment(appointment)
                              }
                            >
                              Confirmar atendimento
                            </Button>
                          </div>
                        </div>

                        {/* Desktop: Layout horizontal original */}
                        <div className="hidden sm:flex flex-col gap-3 flex-1 min-w-0">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 text-left">
                              <p className="text-yellow-400 font-bold text-xl">
                                {appointment.data
                                  ? formatDate(appointment.data, false)
                                  : "Data não informada"}
                              </p>
                              <p className="text-white font-semibold text-lg mt-1">
                                {appointment.horario || "Horário não informado"}
                              </p>
                            </div>

                            {/* Tipo de Serviço - Destaque Secundário */}
                            <div className="flex-1 min-w-0 border-l border-gray-700 pl-4">
                              <p className="text-gray-400 text-sm mb-1">
                                Serviço
                              </p>
                              <p className="text-white font-semibold text-base truncate">
                                {appointment.servicos &&
                                appointment.servicos.length > 0
                                  ? appointment.servicos.join(", ")
                                  : "Serviço não informado"}
                              </p>
                            </div>
                          </div>

                          {/* Cliente - Abaixo da data/horário e serviço */}
                          {appointment.cliente?.nome && (
                            <div className="pt-2 border-t border-gray-700">
                              <p className="text-white text-xs truncate">
                                <span className="text-gray-400">Cliente: </span>
                                {appointment.cliente.nome}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Botão Desktop */}
                        <div className="hidden sm:flex flex-col items-start gap-2 flex-shrink-0">
                          <Button
                            className="text-xs"
                            color="primary"
                            isDisabled={!isAppointmentPast(appointment)}
                            size="sm"
                            type="button"
                            onClick={() =>
                              handleConfirmAppointment(appointment)
                            }
                          >
                            Confirmar atendimento
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Seção de Histórico de Atendimentos Realizados */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-2xl mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Histórico de Atendimentos
                </h2>
                <p className="text-gray-400 text-sm">
                  Visualize todos os atendimentos realizados
                </p>
              </div>
              <Button
                className="bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/50 text-slate-300"
                size="sm"
                variant="flat"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                {showFilters ? "Ocultar" : "Filtros"}
              </Button>
            </div>

            {/* Filtros de Pesquisa */}
            {showFilters && (
              <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-300 mb-2"
                      htmlFor="filter-service"
                    >
                      Tipo de Serviço
                    </label>
                    <select
                      className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                      id="filter-service"
                      value={filterService}
                      onChange={(e) => setFilterService(e.target.value)}
                    >
                      <option value="">Todos os serviços</option>
                      {availableServices.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-300 mb-2"
                      htmlFor="filter-date"
                    >
                      Data
                    </label>
                    <Input
                      className="w-full"
                      classNames={{
                        input: "text-white",
                        inputWrapper: "bg-gray-900 border-gray-700",
                      }}
                      placeholder="Selecione uma data"
                      size="md"
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </div>
                </div>
                {(filterService || filterDate) && (
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300"
                      size="sm"
                      variant="flat"
                      onClick={() => {
                        setFilterService("");
                        setFilterDate("");
                      }}
                    >
                      Limpar Filtros
                    </Button>
                    <span className="text-gray-400 text-sm">
                      {completedAppointments.length} resultado(s) encontrado(s)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="text-center py-8 text-gray-400">
                <p>Carregando histórico...</p>
              </div>
            )}

            {/* Error */}
            {hasError && !isLoading && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
                <div className="text-red-400 text-4xl mb-4">⚠️</div>
                <p className="text-red-200 mb-4">
                  Falha ao carregar o histórico!
                </p>
                <Button
                  color="danger"
                  variant="flat"
                  onClick={async () => {
                    if (profissionalId) {
                      setIsLoading(true);
                      setHasError(false);
                      try {
                        await withLoading(fetchAppointmentsByProfessional(profissionalId) as Promise<unknown>);
                      } catch {
                        setHasError(true);
                      } finally {
                        setIsLoading(false);
                      }
                    }
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            )}

            {/* Lista vazia */}
            {!isLoading && !hasError && completedAppointments.length === 0 && (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-white text-xl font-semibold mb-2">
                  Nenhum atendimento realizado
                </h3>
                <p className="text-gray-400">
                  Você ainda não possui atendimentos realizados no histórico.
                </p>
              </div>
            )}

            {/* Lista de atendimentos realizados */}
            {!isLoading && !hasError && completedAppointments.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {completedAppointments.map((appointment, index) => {
                  return (
                    <div
                      key={appointment.id || `completed-${index}`}
                      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 sm:p-5 border border-gray-700 hover:border-slate-400 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] relative"
                    >
                      {/* Badge "Realizado" */}
                      <div className="absolute -top-2.5 left-4 bg-gradient-to-r from-slate-500 to-slate-600 text-white text-xs sm:text-sm font-bold px-4 py-1 rounded-full shadow-lg">
                        ✓ Realizado
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-1 sm:pt-0">
                        {/* Mobile: Layout horizontal com data/horário à esquerda e serviço à direita */}
                        <div className="flex flex-col sm:hidden gap-2.5 flex-1 min-w-0">
                          <div className="flex items-start gap-1">
                            {/* Data e Horário - Esquerda */}
                            <div className="flex-shrink-0">
                              <p className="text-slate-400 font-bold text-base">
                                {appointment.data
                                  ? formatDate(appointment.data, true)
                                  : "Data não informada"}
                              </p>
                              <p className="text-white font-semibold text-sm mt-1">
                                {appointment.horario || "Horário não informado"}
                              </p>
                            </div>

                            {/* Serviço - Direita */}
                            <div className="flex-1 min-w-0 border-l border-gray-700 pl-3">
                              <p className="text-gray-400 text-xs mb-1">
                                Serviço
                              </p>
                              <p className="text-white font-semibold text-sm">
                                {appointment.servicos &&
                                appointment.servicos.length > 0
                                  ? appointment.servicos.join(", ")
                                  : "Serviço não informado"}
                              </p>
                            </div>
                          </div>

                          {/* Cliente - Abaixo da data/horário e serviço */}
                          {appointment.cliente?.nome && (
                            <div className="pt-1 border-t border-gray-700">
                              <p className="text-white text-xs">
                                <span className="text-gray-400">Cliente: </span>
                                {appointment.cliente.nome}
                              </p>
                            </div>
                          )}

                          {/* Valor - Se disponível */}
                          {appointment.valor > 0 && (
                            <div className="pt-1 border-t border-gray-700">
                              <p className="text-white text-xs">
                                <span className="text-gray-400">Valor: </span>
                                <span className="text-green-400 font-semibold">
                                  R${" "}
                                  {appointment.valor
                                    .toFixed(2)
                                    .replace(".", ",")}
                                </span>
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Desktop: Layout horizontal original */}
                        <div className="hidden sm:flex flex-col gap-3 flex-1 min-w-0">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 text-left">
                              <p className="text-slate-400 font-bold text-xl">
                                {appointment.data
                                  ? formatDate(appointment.data, false)
                                  : "Data não informada"}
                              </p>
                              <p className="text-white font-semibold text-lg mt-1">
                                {appointment.horario || "Horário não informado"}
                              </p>
                            </div>

                            {/* Tipo de Serviço - Destaque Secundário */}
                            <div className="flex-1 min-w-0 border-l border-gray-700 pl-4">
                              <p className="text-gray-400 text-sm mb-1">
                                Serviço
                              </p>
                              <p className="text-white font-semibold text-base truncate">
                                {appointment.servicos &&
                                appointment.servicos.length > 0
                                  ? appointment.servicos.join(", ")
                                  : "Serviço não informado"}
                              </p>
                            </div>
                          </div>

                          {/* Cliente e Valor - Abaixo da data/horário e serviço */}
                          <div className="pt-2 border-t border-gray-700 flex items-center justify-between gap-4">
                            {appointment.cliente?.nome && (
                              <p className="text-white text-xs truncate">
                                <span className="text-gray-400">Cliente: </span>
                                {appointment.cliente.nome}
                              </p>
                            )}
                            {appointment.valor > 0 && (
                              <p className="text-white text-xs flex-shrink-0">
                                <span className="text-gray-400">Valor: </span>
                                <span className="text-green-400 font-semibold">
                                  R${" "}
                                  {appointment.valor
                                    .toFixed(2)
                                    .replace(".", ",")}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* Modal de Confirmação de Atendimento */}
      <Modal
        classNames={{
          base: "bg-gray-900 border border-gray-700",
          header: "bg-gray-900 border-b border-gray-700",
          body: "bg-gray-900",
          footer: "bg-gray-900 border-t border-gray-700",
        }}
        isOpen={isOpen}
        size="md"
        onClose={onClose}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 bg-gray-900">
                <h2 className="text-xl font-bold text-yellow-400">
                  Confirmar Atendimento
                </h2>
              </ModalHeader>
              <ModalBody className="bg-gray-900">
                {selectedAppointment ? (
                  <div className="space-y-4">
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">
                        Cliente
                      </p>
                      <p className="text-white font-semibold text-base">
                        {selectedAppointment.cliente?.nome || "Não informado"}
                      </p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">
                        Data
                      </p>
                      <p className="text-white font-semibold text-base mb-2">
                        {selectedAppointment.data
                          ? formatDate(selectedAppointment.data, false)
                          : "Data não informada"}
                      </p>
                      {selectedAppointment.horario && (
                        <>
                          <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">
                            Horário
                          </p>
                          <p className="text-yellow-400 font-semibold text-base">
                            {selectedAppointment.horario}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">
                        Serviço(s)
                      </p>
                      <p className="text-white font-semibold text-base">
                        {selectedAppointment.servicos &&
                        selectedAppointment.servicos.length > 0
                          ? selectedAppointment.servicos.join(", ")
                          : "Serviço não informado"}
                      </p>
                    </div>
                    <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mt-4">
                      <p className="text-yellow-400 text-sm font-semibold flex items-center gap-2">
                        <span>⚠️</span>
                        <span>
                          Tem certeza que deseja confirmar este atendimento?
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Carregando informações...</p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="bg-gray-900">
                <Button
                  className="bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-500 disabled:bg-gray-600 disabled:text-gray-400"
                  color="primary"
                  isDisabled={
                    !selectedAppointment ||
                    !isAppointmentPast(selectedAppointment) ||
                    isConfirming
                  }
                  isLoading={isConfirming}
                  onPress={handleConfirmModal}
                >
                  {isConfirming ? "Confirmando..." : "Confirmar Atendimento"}
                </Button>
                <Button
                  color="danger"
                  isDisabled={isConfirming}
                  variant="light"
                  onPress={onClose}
                >
                  Cancelar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}
