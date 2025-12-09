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
} from "@heroui/react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthProvider/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/PermissionGate";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";

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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

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
          await fetchAppointmentsByProfessional(profissionalId);
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
    // Aqui você pode adicionar a lógica para confirmar o atendimento
    // Por exemplo, chamar uma API para atualizar o status do agendamento
    // TODO: Implementar chamada à API para confirmar atendimento
    // Exemplo: await confirmAppointment(selectedAppointment.id);
    onClose();
    setSelectedAppointment(null);
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
            <p className="text-gray-400">
              Bem-vindo, {user?.user?.nome || "Profissional"}
            </p>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm mb-2">Agendamentos Hoje</h3>
              <p className="text-3xl font-bold text-yellow-400">
                {isLoading ? "..." : todayAppointments}
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm mb-2">
                Agendamentos da Semana
              </h3>
              <p className="text-3xl font-bold text-blue-400">
                {isLoading ? "..." : weekAppointments}
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-gray-400 text-sm mb-2">Total Confirmados</h3>
              <p className="text-3xl font-bold text-green-400">
                {isLoading ? "..." : confirmedAppointments.length}
              </p>
            </div>
          </div>

          {/* Seção de Agendamentos */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Meus Agendamentos Confirmados
              </h2>
              <PermissionGate requiredPermissions={["manage_schedules"]}>
                <Button color="primary" size="sm">
                  Gerenciar Horários
                </Button>
              </PermissionGate>
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
                        await fetchAppointmentsByProfessional(profissionalId);
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
                  Nenhum agendamento confirmado
                </h3>
                <p className="text-gray-400">
                  Você não possui agendamentos confirmados no momento.
                </p>
              </div>
            )}

            {/* Lista de agendamentos */}
            {!isLoading && !hasError && confirmedAppointments.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {confirmedAppointments.map((appointment, index) => (
                  <div
                    key={appointment.id || `appointment-${index}`}
                    className={`bg-gray-800 rounded-lg p-4 border transition-colors relative ${
                      index === 0
                        ? "border-yellow-400 hover:border-yellow-300 shadow-lg shadow-yellow-400/20"
                        : "border-gray-700 hover:border-yellow-400"
                    }`}
                  >
                    {/* Etiqueta "Próximo atendimento" no primeiro card */}
                    {index === 0 && (
                      <div className="absolute -top-3 left-4 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow-md">
                        Próximo atendimento
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      {/* Data e Horário - Destaque Principal */}
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0 text-center sm:text-left">
                          <p className="text-yellow-400 font-bold text-lg sm:text-xl">
                            {appointment.data ? (
                              <>
                                {/* Mobile: formato DD/MM/YYYY */}
                                <span className="sm:hidden">
                                  {formatDate(appointment.data, true)}
                                </span>
                                {/* Desktop: formato por extenso */}
                                <span className="hidden sm:inline">
                                  {formatDate(appointment.data, false)}
                                </span>
                              </>
                            ) : (
                              "Data não informada"
                            )}
                          </p>
                          <p className="text-white font-semibold text-base sm:text-lg mt-1">
                            {appointment.horario || "Horário não informado"}
                          </p>
                        </div>

                        {/* Tipo de Serviço - Destaque Secundário */}
                        <div className="flex-1 min-w-0 border-l border-gray-700 pl-3 sm:pl-4">
                          <p className="text-gray-400 text-xs sm:text-sm mb-1">
                            Serviço
                          </p>
                          <p className="text-white font-semibold text-sm sm:text-base truncate">
                            {appointment.servicos &&
                            appointment.servicos.length > 0
                              ? appointment.servicos.join(", ")
                              : "Serviço não informado"}
                          </p>
                          {/* Cliente - Menor destaque */}
                          {appointment.cliente?.nome && (
                            <p className="text-gray-500 text-xs mt-1 truncate">
                              Cliente: {appointment.cliente.nome}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status e Botão */}
                      <div className="flex flex-col items-end sm:items-start gap-2 flex-shrink-0">
                        <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap">
                          Confirmado
                        </span>
                        <Button
                          className="text-xs"
                          color="primary"
                          size="sm"
                          onClick={() => handleConfirmAppointment(appointment)}
                        >
                          Confirmar atendimento
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* Modal de Confirmação de Atendimento */}
      <Modal isOpen={isOpen} size="md" onClose={onClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-white">
                  Confirmar Atendimento
                </h2>
              </ModalHeader>
              <ModalBody>
                {selectedAppointment && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Cliente</p>
                      <p className="text-white font-semibold">
                        {selectedAppointment.cliente?.nome || "Não informado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">
                        Data e Horário
                      </p>
                      <p className="text-white font-semibold">
                        {selectedAppointment.data
                          ? formatDate(selectedAppointment.data, false)
                          : "Data não informada"}
                        {" - "}
                        {selectedAppointment.horario || "Horário não informado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Serviço(s)</p>
                      <p className="text-white font-semibold">
                        {selectedAppointment.servicos &&
                        selectedAppointment.servicos.length > 0
                          ? selectedAppointment.servicos.join(", ")
                          : "Serviço não informado"}
                      </p>
                    </div>
                    <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3 mt-4">
                      <p className="text-yellow-400 text-sm font-semibold">
                        ⚠️ Tem certeza que deseja confirmar este atendimento?
                      </p>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button color="primary" onPress={handleConfirmModal}>
                  Confirmar Atendimento
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}
