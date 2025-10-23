import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

import { Header } from "@/components/Header";
import { IServices } from "@/contexts/ScheduleProvider/types";
import { formatPrice } from "@/utils/format-price";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";

export function ChoiceSchedulePage() {
  const navigate = useNavigate();
  const { fetchSchedules, schedules } = useSchedule();
  const location = useLocation() as {
    state?: {
      barber?: { id: string; nome: string };
      selectedServices?: IServices[];
    };
  };

  const { barber, selectedServices } = location.state || {};

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Estado para armazenar os horários disponíveis (incluindo ocupado/livre/passado)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<
    { time: string; isOccupied: boolean; isPast: boolean }[]
  >([]);

  // Soma total da duração dos serviços
  const totalDuration = useMemo(
    () =>
      selectedServices?.reduce(
        (sum, service) => sum + (service.duracao || 0),
        0
      ) || 0,
    [selectedServices]
  );

  // FUNÇÃO PARA GERAR PRÓXIMOS 7 DIAS (EXCETO DOMINGO)
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);

      date.setDate(today.getDate() + i);

      // Verifica se é domingo e pula
      if (date.getDay() === 0) continue; // 0 representa o domingo

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      const isToday = dateString === todayString;

      // Formato: dia/mês
      const shortDate = `${day}/${month}`;

      // Nome do dia da semana
      const weekdayLong = date.toLocaleDateString("pt-BR", {
        weekday: "long",
      });
      const weekdayShort = date.toLocaleDateString("pt-BR", {
        weekday: "short",
      });

      // Capitalizar primeira letra
      const weekdayLongCapitalized =
        weekdayLong.charAt(0).toUpperCase() + weekdayLong.slice(1);
      const weekdayShortCapitalized =
        weekdayShort.charAt(0).toUpperCase() + weekdayShort.slice(1);

      dates.push({
        value: dateString,
        // Para desktop: "Hoje (24/10)" ou "Sexta-feira (24/10)"
        labelDesktop: isToday
          ? `Hoje (${shortDate})`
          : `${weekdayLongCapitalized} (${shortDate})`,
        // Para mobile: "Hoje (24/10)" ou "Sex (24/10)"
        labelMobile: isToday
          ? `Hoje (${shortDate})`
          : `${weekdayShortCapitalized} (${shortDate})`,
        isToday,
      });
    }

    return dates;
  };

  // FUNÇÃO PARA GERAR HORÁRIOS DISPONÍVEIS
  const generateTimeSlots = useCallback(() => {
    const slots: { time: string; isOccupied: boolean; isPast: boolean }[] = [];
    const step = totalDuration >= 60 ? 60 : 30;

    // Obtém a data e hora atual
    const now = new Date();
    const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const isToday = selectedDate === todayString;

    // Filtra os horários ocupados com base nos agendamentos existentes
    const occupiedSlots = schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.data_agendamento); // Data da API (em UTC)
      const selectedDateObj = new Date(selectedDate); // Data selecionada pelo usuário (local)

      // Compara as datas para garantir que estamos verificando o mesmo dia
      return (
        scheduleDate.getUTCFullYear() === selectedDateObj.getUTCFullYear() &&
        scheduleDate.getUTCMonth() === selectedDateObj.getUTCMonth() &&
        scheduleDate.getUTCDate() === selectedDateObj.getUTCDate()
      );
    });

    // Mapeia os horários ocupados com hora de início e fim
    const occupiedTimes: { start: number; end: number }[] = occupiedSlots.map(
      (schedule) => {
        const scheduleStart = new Date(
          `${schedule.data_agendamento}T${schedule.hora_inicio}:00`
        ).getTime(); // Usando getTime() para obter o timestamp
        const scheduleEnd = new Date(
          `${schedule.data_agendamento}T${schedule.hora_fim}:00`
        ).getTime(); // Usando getTime() para obter o timestamp

        return {
          start: scheduleStart,
          end: scheduleEnd,
        };
      }
    );

    // FUNÇÃO PARA GERAR HORÁRIOS DISPONÍVEIS PARA O DIA
    for (let hour = 9; hour < 19; hour++) {
      for (let minute = 0; minute < 60; minute += step) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

        const timeSlotStart = new Date(`${selectedDate}T${time}:00`).getTime(); // Começo do horário selecionado
        const timeSlotEnd = timeSlotStart + step * 60000; // Adiciona a duração do serviço (30 ou 60 minutos)

        // Verifica se o horário está ocupado
        const isOccupied = occupiedTimes.some(({ start, end }) => {
          // Verifica se o horário selecionado se sobrepõe a algum horário ocupado
          return (
            (timeSlotStart >= start && timeSlotStart < end) || // O início do horário se sobrepõe
            (timeSlotEnd > start && timeSlotEnd <= end) || // O fim do horário se sobrepõe
            (timeSlotStart <= start && timeSlotEnd >= end) // O horário selecionado cobre o horário ocupado
          );
        });

        // Verifica se o horário já passou (apenas para hoje)
        const isPast = isToday && timeSlotStart < now.getTime();

        // Armazena o horário e se está ocupado, passado ou não
        slots.push({ time, isOccupied, isPast });
      }
    }

    return slots;
  }, [selectedDate, schedules, totalDuration]);

  // Atualiza os horários disponíveis ao selecionar uma data
  const handleDateSelect = (date: string) => {
    setSelectedDate(date); // Atualiza o estado da data selecionada
    setSelectedTime(""); // Limpa o horário selecionado ao mudar a data
  };

  // Atualiza os horários disponíveis quando a data selecionada muda
  useEffect(() => {
    if (selectedDate) {
      const availableSlots = generateTimeSlots(); // Gera os horários disponíveis para a nova data

      setAvailableTimeSlots(availableSlots); // Armazena os horários no estado
    }
  }, [selectedDate, generateTimeSlots]);

  // FUNÕES PARA CONFIRMAR O AGENDAMENTO
  const handleSchedule = () => {
    if (selectedDate && selectedTime) {
      navigate("/confirm-appointment", {
        state: {
          barber,
          selectedServices,
          selectedDate,
          selectedTime,
          totalDuration,
        },
      });
    }
  };

  useEffect(() => {
    fetchSchedules(); // Carrega os agendamentos ao carregar a página
  }, []);

  return (
    <section className="min-h-screen bg-gray-800">
      {/* COMPONENTE CABEÇALH0 */}
      <Header />

      <div className="p-4 pb-10 md:px-8">
        <Helmet title="Selecionar data e horário" />

        <div className="mx-auto max-w-2xl">
          <button
            className="text-sm bg-gray-800 hover:bg-gray-900 mb-4 
             w-8 h-8 flex items-center justify-center 
             border border-gray-400 rounded-full"
            type="button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="w-6 h-6 text-yellow-400" />
          </button>

          {/* Banner */}
          <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 h-40 mb-6">
            <img
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-100"
              src="/image-1.png"
            />
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                Selecione a data e horário
              </h1>
            </div>
          </div>

          {/* Resumo do agendamento */}
          {selectedServices && selectedServices.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <h3 className="text-white font-medium mb-2">
                Resumo do agendamento
              </h3>
              <div className="text-sm text-gray-300">
                {barber && <div>Barbeiro: {barber.nome}</div>}

                {selectedServices.map((service) => (
                  <div
                    key={service.id}
                    className="border-b border-gray-700 pb-2 last:border-0 last:pb-0"
                  >
                    <div>Serviço: {service.nome}</div>
                    <div>Preço: {formatPrice(Number(service.preco))}</div>
                    <div>Duração: {service.duracao} min</div>
                  </div>
                ))}

                <div className="mt-2 font-medium text-green-400">
                  Tempo total: {totalDuration} min
                </div>
              </div>
            </div>
          )}

          {/* SELEÇÃO DE DATA */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">
              Escolha a data
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {generateDates().map((date) => (
                <button
                  key={date.value}
                  className={`p-3 rounded-lg text-center transition-colors ${
                    selectedDate === date.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-900 text-gray-300 hover:bg-gray-700"
                  }`}
                  type="button"
                  onClick={() => handleDateSelect(date.value)}
                >
                  {/* Mobile: versão abreviada */}
                  <div className="text-sm font-medium sm:hidden">
                    {date.labelMobile}
                  </div>
                  {/* Desktop: versão completa */}
                  <div className="hidden text-sm font-medium sm:block">
                    {date.labelDesktop}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* SELEÇÃO DE HORÁRIO */}
          {selectedDate && availableTimeSlots.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-3">
                Escolha o horário
              </h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {availableTimeSlots
                  .filter(({ isPast }) => !isPast)
                  .map(({ time, isOccupied }) => (
                    <button
                      key={time}
                      className={`p-2 rounded-lg text-center text-sm transition-colors ${
                        isOccupied
                          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                          : selectedTime === time
                            ? "bg-green-600 text-white"
                            : "bg-gray-900 text-gray-300 hover:bg-gray-700"
                      }`}
                      disabled={isOccupied}
                      title={isOccupied ? "Horário ocupado" : "Disponível"}
                      type="button"
                      onClick={() => !isOccupied && setSelectedTime(time)}
                    >
                      {time}
                    </button>
                  ))}
              </div>
              <div className="mt-3 flex gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-600 rounded" />
                  <span>Selecionado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-900 rounded" />
                  <span>Disponível</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-700 rounded" />
                  <span>Ocupado</span>
                </div>
              </div>
            </div>
          )}

          {/* Botão de confirmação */}
          {selectedDate && selectedTime && (
            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              type="button"
              onClick={handleSchedule}
            >
              Confirmar com Pagamento
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
