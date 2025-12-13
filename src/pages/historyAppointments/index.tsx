import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { formatPrice } from "@/utils/format-price";
import { useAuth } from "@/contexts/AuthProvider/useAuth";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";

export function HistoryAppointmentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchAppointments, appointments } = useSchedule();
  const [filter, setFilter] = useState<"confirmados" | "realizados">(
    "confirmados"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadAppointments = async () => {
      if (user?.user?.id) {
        setIsLoading(true);
        setHasError(false);
        try {
          await fetchAppointments(user.user.id);
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

  // Filtra os agendamentos baseado no status da API
  const filteredAppointments = appointments.filter((appointment) => {
    const status = appointment.status?.toUpperCase();

    if (filter === "confirmados") {
      // Mostra agendamentos com status CONFIRMADO
      return status === "CONFIRMADO";
    }

    // Mostra agendamentos com status REALIZADO
    return status === "REALIZADO";
  });

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
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

  return (
    <section className="min-h-screen bg-gray-800 flex flex-col">
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
              className="text-sm bg-gray-800 hover:bg-gray-900 mb-4 w-8 h-8 flex items-center justify-center border border-gray-400 rounded-full"
              type="button"
              onClick={() => navigate("/home")}
            >
              <ArrowLeftIcon className="w-6 h-6 text-yellow-400" />
            </button>

            <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 h-40 mb-6">
              <img
                alt="Banner"
                className="absolute inset-0 w-full h-full object-cover opacity-70"
                src="/image-1.png"
              />
              <div className="absolute bottom-0 left-0 p-4">
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  Meus Agendamentos
                </h1>
                <p className="text-gray-200">
                  {filter === "confirmados"
                    ? "Seus agendamentos confirmados"
                    : "Histórico de agendamentos realizados"}
                </p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "confirmados"
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                type="button"
                onClick={() => setFilter("confirmados")}
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
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="bg-gray-900 rounded-lg p-8 text-center">
              <div className="text-yellow-400 text-4xl mb-4">⏳</div>
              <p className="text-white">Carregando agendamentos...</p>
            </div>
          )}

          {/* Error */}
          {hasError && !isLoading && (
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
                    setIsLoading(true);
                    setHasError(false);
                    try {
                      await fetchAppointments(user.user.id);
                    } catch {
                      setHasError(true);
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Lista vazia */}
          {!isLoading && !hasError && sortedAppointments.length === 0 && (
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
          {!isLoading && !hasError && sortedAppointments.length > 0 && (
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
          {!isLoading &&
            !hasError &&
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
