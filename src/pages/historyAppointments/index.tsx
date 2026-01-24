import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { Button, Input } from "@heroui/react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatPrice } from "@/utils/format-price";
import { useAuth } from "@/contexts/AuthProvider/useAuth";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";
import { useLoading } from "@/contexts/LoadingProvider";

export function HistoryAppointmentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchAppointments, appointments } = useSchedule();
  const { withLoading } = useLoading();
  const [filter, setFilter] = useState<"confirmados" | "realizados">(
    "confirmados"
  );
  const [hasError, setHasError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterService, setFilterService] = useState("");

  useEffect(() => {
    const loadAppointments = async () => {
      if (user?.user?.id) {
        setHasError(false);
        try {
          await withLoading(fetchAppointments(user.user.id) as Promise<unknown>);
        } catch {
          setHasError(true);
        }
      }
    };

    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user?.id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Data inválida";

    try {
      // Formato esperado: DD/MM/YYYY
      const parts = dateString.split("/");

      if (parts.length === 3) {
        const [day, month, year] = parts;
        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );

        if (Number.isNaN(date.getTime())) {
          return dateString; // Retorna o formato original se der erro
        }

        return date.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }

      return dateString; // Retorna o formato original
    } catch {
      return dateString;
    }
  };

  // Função auxiliar para converter DD/MM/YYYY em Date
  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date(0);

    const parts = dateStr.split("/");

    if (parts.length === 3) {
      return new Date(
        parseInt(parts[2]),
        parseInt(parts[1]) - 1,
        parseInt(parts[0])
      );
    }

    return new Date(0);
  };

  // Função auxiliar para obter a data de um agendamento para ordenação
  const getAppointmentDate = (appointment: any): Date => {
    // Prioriza hora_inicio se disponível (mais preciso)
    if (appointment.hora_inicio) {
      const date = new Date(appointment.hora_inicio);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    // Fallback para o campo data formatado
    if (appointment.data) {
      return parseDate(appointment.data);
    }

    return new Date(0);
  };

  // Função auxiliar para comparar apenas a data (sem hora) de um agendamento
  const getAppointmentDateOnly = (appointment: any): Date => {
    const appointmentDate = getAppointmentDate(appointment);
    const dateOnly = new Date(
      appointmentDate.getFullYear(),
      appointmentDate.getMonth(),
      appointmentDate.getDate()
    );

    return dateOnly;
  };

  // Lista de serviços disponíveis para filtro (ordenada: Corte de cabelo, Barba, depois os demais)
  const availableServices = useMemo(() => {
    const servicesSet = new Set<string>();

    appointments.forEach((appointment) => {
      if (appointment.servicos && Array.isArray(appointment.servicos)) {
        appointment.servicos.forEach((service) => {
          if (service) {
            servicesSet.add(service);
          }
        });
      }
    });

    const servicesArray = Array.from(servicesSet);
    const orderedServices: string[] = [];

    // Adiciona "Corte de cabelo" primeiro se existir
    if (servicesArray.includes("Corte de cabelo")) {
      orderedServices.push("Corte de cabelo");
    }

    // Adiciona "Barba" em segundo se existir
    if (servicesArray.includes("Barba")) {
      orderedServices.push("Barba");
    }

    // Adiciona os demais serviços (exceto os já adicionados)
    servicesArray.forEach((service) => {
      if (service !== "Corte de cabelo" && service !== "Barba") {
        orderedServices.push(service);
      }
    });

    return orderedServices;
  }, [appointments]);

  // Filtra os agendamentos baseado no status da API
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const status = appointment.status?.toUpperCase();

      // Filtro por status
      if (filter === "confirmados" && status !== "CONFIRMADO") {
        return false;
      }
      if (filter === "realizados" && status !== "REALIZADO") {
        return false;
      }

      // Aplica filtros adicionais apenas na aba de realizados
      if (filter === "realizados") {
        // Filtro por serviço
        if (filterService) {
          const hasService =
            appointment.servicos &&
            appointment.servicos.some((service) =>
              service.toLowerCase().includes(filterService.toLowerCase())
            );

          if (!hasService) {
            return false;
          }
        }

        // Filtro por data inicial e final
        if (filterStartDate || filterEndDate) {
          const appointmentDateOnly = getAppointmentDateOnly(appointment);
          const appointmentYear = appointmentDateOnly.getFullYear();
          const appointmentMonth = appointmentDateOnly.getMonth();
          const appointmentDay = appointmentDateOnly.getDate();

          if (filterStartDate) {
            // filterStartDate vem no formato YYYY-MM-DD do input
            const startDateParts = filterStartDate.split("-");
            const startYear = parseInt(startDateParts[0]);
            const startMonth = parseInt(startDateParts[1]) - 1;
            const startDay = parseInt(startDateParts[2]);

            // Compara ano, mês e dia separadamente
            if (
              appointmentYear < startYear ||
              (appointmentYear === startYear &&
                appointmentMonth < startMonth) ||
              (appointmentYear === startYear &&
                appointmentMonth === startMonth &&
                appointmentDay < startDay)
            ) {
              return false;
            }
          }

          if (filterEndDate) {
            // filterEndDate vem no formato YYYY-MM-DD do input
            const endDateParts = filterEndDate.split("-");
            const endYear = parseInt(endDateParts[0]);
            const endMonth = parseInt(endDateParts[1]) - 1;
            const endDay = parseInt(endDateParts[2]);

            // Compara ano, mês e dia separadamente
            if (
              appointmentYear > endYear ||
              (appointmentYear === endYear && appointmentMonth > endMonth) ||
              (appointmentYear === endYear &&
                appointmentMonth === endMonth &&
                appointmentDay > endDay)
            ) {
              return false;
            }
          }
        }
      }

      return true;
    });
  }, [appointments, filter, filterService, filterStartDate, filterEndDate]);

  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort((a, b) => {
      try {
        const dateA = getAppointmentDate(a).getTime();
        const dateB = getAppointmentDate(b).getTime();

        // Para agendamentos confirmados, mostra os mais próximos primeiro
        // Para realizados, mostra os mais recentes primeiro
        if (filter === "confirmados") {
          return dateA - dateB;
        }

        return dateB - dateA;
      } catch {
        return 0;
      }
    });
  }, [filteredAppointments, filter]);

  return (
    <section className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Header />

      <div className="px-4 py-8 md:px-8 flex-1">
        <Helmet
          title={
            filter === "confirmados"
              ? "Agendamentos Confirmados"
              : "Agendamentos Realizados"
          }
        />

        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <button
              className="text-sm mb-4 w-8 h-8 flex items-center justify-center border rounded-full transition-colors duration-300 hover:bg-[var(--bg-hover)]"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}
              type="button"
              onClick={() => navigate("/home")}
            >
              <ArrowLeftIcon className="w-6 h-6 text-yellow-400" />
            </button>

            <div className="relative rounded-xl overflow-hidden shadow-lg h-40 mb-6 transition-colors duration-300" style={{ backgroundColor: "var(--bg-secondary)" }}>
              <img
                alt="Banner"
                className="absolute inset-0 w-full h-full object-cover opacity-70"
                src="/image-1.png"
              />
              <div className="absolute bottom-0 left-0 p-4">
                <h1 className="text-2xl font-bold drop-shadow-lg transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                  Meus Agendamentos
                </h1>
                <p className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                  {filter === "confirmados"
                    ? "Seus agendamentos confirmados"
                    : "Histórico de agendamentos realizados"}
                </p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="rounded-lg p-4 mb-6 transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "confirmados"
                    ? "bg-yellow-400 text-gray-900"
                    : "hover:bg-[var(--bg-hover)]"
                }`}
                style={filter === "confirmados" ? undefined : { backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }}
                type="button"
                onClick={() => {
                  setFilter("confirmados");
                  setShowFilters(false);
                  setFilterService("");
                  setFilterStartDate("");
                  setFilterEndDate("");
                }}
              >
                Confirmados
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "realizados"
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                type="button"
                onClick={() => setFilter("realizados")}
              >
                Realizados
              </button>
              {filter === "realizados" && (
                <div className="ml-auto">
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
              )}
            </div>

            {/* Filtros de Pesquisa - Apenas na aba de Realizados */}
            {showFilters && filter === "realizados" && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 mt-4 border-2 border-yellow-400/30 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-300 mb-2"
                      htmlFor="filter-start-date"
                    >
                      Data Inicial
                    </label>
                    <Input
                      className="w-full"
                      classNames={{
                        input: "text-white",
                        inputWrapper: "bg-gray-900 border-gray-700",
                      }}
                      id="filter-start-date"
                      placeholder="Selecione uma data"
                      size="md"
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-300 mb-2"
                      htmlFor="filter-end-date"
                    >
                      Data Final
                    </label>
                    <Input
                      className="w-full"
                      classNames={{
                        input: "text-white",
                        inputWrapper: "bg-gray-900 border-gray-700",
                      }}
                      id="filter-end-date"
                      placeholder="Selecione uma data"
                      size="md"
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                  </div>
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
                </div>
                {(filterService || filterStartDate || filterEndDate) && (
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300"
                      size="sm"
                      variant="flat"
                      onClick={() => {
                        setFilterService("");
                        setFilterStartDate("");
                        setFilterEndDate("");
                      }}
                    >
                      Limpar Filtros
                    </Button>
                    <span className="text-gray-400 text-sm">
                      {sortedAppointments.length} resultado(s) encontrado(s)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {hasError && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
              <div className="text-red-400 text-4xl mb-4">⚠️</div>
              <p className="text-red-200 mb-4">
                Falha na listagem dos Agendamentos!
              </p>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg mt-4"
                type="button"
                onClick={async () => {
                  if (user?.user?.id) {
                    setHasError(false);
                    try {
                      await withLoading(fetchAppointments(user.user.id) as Promise<unknown>);
                    } catch {
                      setHasError(true);
                    }
                  }
                }}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Lista vazia */}
          {!hasError && sortedAppointments.length === 0 && (
            <div className="bg-gray-900 rounded-lg p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">📅</div>
              <h3 className="text-white text-xl font-semibold mb-2">
                {filter === "confirmados"
                  ? "Nenhum agendamento confirmado"
                  : "Nenhum agendamento realizado"}
              </h3>
              <p className="text-gray-400 mb-6">
                {filter === "confirmados"
                  ? "Você não possui agendamentos confirmados. Que tal agendar um horário?"
                  : "Você ainda não possui histórico de agendamentos realizados."}
              </p>
              {filter === "confirmados" && (
                <button
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold"
                  type="button"
                  onClick={() => navigate("/choice-barber")}
                >
                  Fazer um agendamento
                </button>
              )}
            </div>
          )}

          {/* Lista de agendamentos */}
          {!hasError && sortedAppointments.length > 0 && (
            <div className="space-y-4">
              {sortedAppointments.map((appointment, index) => {
                const status = appointment.status?.toUpperCase();
                const isConfirmado = status === "CONFIRMADO";

                return (
                  <div
                    key={appointment.id || `appointment-${index}`}
                    className="bg-gray-900 rounded-lg p-6 border border-gray-700 hover:border-yellow-400 transition-colors"
                  >
                    <div className="flex flex-col gap-4">
                      {/* Header com Status e Data */}
                      <div className="flex items-center justify-between pb-3 border-b border-gray-700">
                        <div className="text-left">
                          <p className="text-white font-medium">
                            {formatDate(appointment.data)}
                          </p>
                        </div>
                        <span
                          className={`${
                            isConfirmado ? "bg-green-600" : "bg-blue-600"
                          } text-white text-sm font-semibold px-4 py-1.5 rounded-full`}
                        >
                          {isConfirmado ? "Confirmado" : "Realizado"}
                        </span>
                      </div>

                      {/* Informações do agendamento */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Serviço(s) */}
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-sm mb-1">
                            {appointment.servicos &&
                            appointment.servicos.length > 1
                              ? "Serviços"
                              : "Serviço"}
                          </span>
                          <div className="text-white font-medium text-lg">
                            {appointment.servicos &&
                            appointment.servicos.length > 0 ? (
                              appointment.servicos.length === 1 ? (
                                appointment.servicos[0]
                              ) : (
                                <ul className="list-disc list-inside space-y-1">
                                  {appointment.servicos.map((servico, idx) => (
                                    <li key={idx}>{servico}</li>
                                  ))}
                                </ul>
                              )
                            ) : (
                              <span className="text-gray-500">
                                Não informado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Barbeiro */}
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-sm mb-1">
                            Barbeiro
                          </span>
                          <span className="text-white font-medium text-lg">
                            {appointment.barbeiro ||
                              appointment.profissional?.nome ||
                              "Não informado"}
                          </span>
                        </div>

                        {/* Horário */}
                        <div className="flex flex-col">
                          <span className="text-gray-400 text-sm mb-1">
                            Horário
                          </span>
                          <span className="text-white font-medium text-lg">
                            {appointment.horario}
                          </span>
                        </div>
                      </div>

                      {/* Valor */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                        <span className="text-gray-400 text-sm">
                          Valor do serviço
                        </span>
                        <span className="text-green-400 font-bold text-2xl">
                          {formatPrice(appointment.valor)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Contador de agendamentos - Apenas para Realizados */}
          {!hasError &&
            sortedAppointments.length > 0 &&
            filter === "realizados" && (
              <div className="mt-6 bg-gray-900 rounded-lg p-6 text-center">
                <h3 className="text-white font-semibold mb-2">
                  Total de Agendamentos Realizados
                </h3>
                <div className="text-3xl font-bold text-blue-400">
                  {sortedAppointments.length}
                </div>
              </div>
            )}
        </div>
      </div>

      <Footer />
    </section>
  );
}
