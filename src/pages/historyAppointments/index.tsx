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
  const [filter, setFilter] = useState<
    "TODOS" | "CONFIRMADO" | "PENDENTE" | "CANCELADO"
  >("TODOS");
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
    const date = new Date(dateString);

    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);

    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      confirmed: { label: "Confirmado", color: "bg-green-600" },
      pending: { label: "Pendente", color: "bg-yellow-600" },
      cancelled: { label: "Cancelado", color: "bg-red-600" },
    };

    const statusInfo = statusMap[status.toLowerCase()] || {
      label: status,
      color: "bg-gray-600",
    };

    return (
      <span
        className={`${statusInfo.color} text-white text-xs px-2 py-1 rounded-full`}
      >
        {statusInfo.label}
      </span>
    );
  };

  const filteredAppointments = appointments.filter((appointment) => {
    if (filter === "TODOS") return true;

    return appointment.status.toLowerCase() === filter;
  });

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = new Date(a.data_agendamento).getTime();
    const dateB = new Date(b.data_agendamento).getTime();

    return dateB - dateA; // Mais recentes primeiro
  });

  return (
    <section className="min-h-screen bg-gray-800 flex flex-col">
      <Header />

      <div className="px-4 py-8 md:px-8 flex-1">
        <Helmet title="Histórico de Agendamentos" />

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
                  Veja todos os seus agendamentos realizados
                </p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "TODOS"
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                type="button"
                onClick={() => setFilter("TODOS")}
              >
                Todos
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "CONFIRMADO"
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                type="button"
                onClick={() => setFilter("CONFIRMADO")}
              >
                Confirmados
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "PENDENTE"
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                type="button"
                onClick={() => setFilter("PENDENTE")}
              >
                Pendentes
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "CANCELADO"
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                type="button"
                onClick={() => setFilter("CANCELADO")}
              >
                Cancelados
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
                Nenhum agendamento encontrado
              </h3>
              <p className="text-gray-400 mb-6">
                {filter === "TODOS"
                  ? "Você ainda não possui agendamentos."
                  : `Nenhum agendamento ${filter === "CONFIRMADO" ? "confirmado" : filter === "PENDENTE" ? "pendente" : "cancelado"} encontrado.`}
              </p>
              <button
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-semibold"
                type="button"
                onClick={() => navigate("/choice-barber")}
              >
                Fazer um agendamento
              </button>
            </div>
          )}

          {/* Lista de agendamentos */}
          {!isLoading && !hasError && sortedAppointments.length > 0 && (
            <div className="space-y-4">
              {sortedAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-gray-900 rounded-lg p-6 border border-gray-700 hover:border-yellow-400 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Informações principais */}
                    <div className="flex-1 space-y-3">
                      {/* Status e Data */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {getStatusBadge(appointment.status)}
                        <span className="text-gray-400 text-sm">
                          {formatDate(appointment.data_agendamento)}
                        </span>
                      </div>

                      {/* Horário */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Horário:</span>
                        <span className="text-white font-medium">
                          {formatTime(appointment.hora_inicio)} -{" "}
                          {formatTime(appointment.hora_fim)}
                        </span>
                      </div>

                      {/* Serviço */}
                      {appointment.servico && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Serviço:</span>
                          <span className="text-white font-medium">
                            {appointment.servico.nome}
                          </span>
                          <span className="text-gray-500 text-sm">
                            ({appointment.servico.duracao} min)
                          </span>
                        </div>
                      )}

                      {/* Profissional */}
                      {appointment.profissional && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Barbeiro:</span>
                          <span className="text-white font-medium">
                            {appointment.profissional.nome}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Valor */}
                    <div className="flex flex-col items-end justify-center">
                      <span className="text-gray-400 text-sm mb-1">Valor</span>
                      <span className="text-green-400 font-bold text-xl">
                        {formatPrice(appointment.valor_pago || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Estatísticas */}
          {!isLoading && !hasError && appointments.length > 0 && (
            <div className="mt-6 bg-gray-900 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-4">Resumo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {appointments.length}
                  </div>
                  <div className="text-gray-400 text-sm">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {
                      appointments.filter(
                        (a) => a.status.toLowerCase() === "CONFIRMADO"
                      ).length
                    }
                  </div>
                  <div className="text-gray-400 text-sm">Confirmados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {
                      appointments.filter(
                        (a) => a.status.toLowerCase() === "PENDENTE"
                      ).length
                    }
                  </div>
                  <div className="text-gray-400 text-sm">Pendentes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {
                      appointments.filter(
                        (a) => a.status.toLowerCase() === "CANCELADO"
                      ).length
                    }
                  </div>
                  <div className="text-gray-400 text-sm">Cancelados</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </section>
  );
}
