import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { ArrowLeftIcon, CalendarIcon } from "@heroicons/react/24/solid";
import { addToast } from "@heroui/react";

import { Header } from "@/components/Header";
import {
  IHorarioFuncionamento,
  IServices,
} from "@/contexts/ScheduleProvider/types";
import { formatPrice } from "@/utils/format-price";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";
import { GetHorariosFuncionamento } from "@/contexts/ScheduleProvider/util";

export function ChoiceSchedulePage() {
  const navigate = useNavigate();
  const { fetchSchedules, schedules } = useSchedule();
  const location = useLocation() as {
    state?: {
      barber?: { id: string; nome: string; id_barbearia: string };
      selectedServices?: IServices[];
    };
  };

  const { barber, selectedServices } = location.state || {};
  const barbeariaId = barber?.id_barbearia;

  const dateInputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  // Estado para armazenar os horários disponíveis (incluindo ocupado/livre/passado)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<
    {
      time: string;
      isOccupied: boolean;
      isPast: boolean;
      turno: "manha" | "tarde" | "noite";
    }[]
  >([]);
  const [horariosFuncionamento, setHorariosFuncionamento] = useState<
    IHorarioFuncionamento[]
  >([]);

  // SOMA TOTAL DA DURAÇÃO DOS SERVIÇOS
  const totalDuration = useMemo(
    () =>
      selectedServices?.reduce(
        (sum, service) => sum + (service.duracao || 0),
        0
      ) || 0,
    [selectedServices]
  );

  // Função para buscar horários de funcionamento (reutilizável)
  const fetchHorariosFuncionamento = useCallback(async () => {
    if (!barbeariaId) {
      setHorariosFuncionamento([]);
      return;
    }

    try {
      const response = await GetHorariosFuncionamento(barbeariaId);
      const horariosDaAPI =
        response?.hoursFunctionment || response?.horarios || response || [];
      setHorariosFuncionamento(
        Array.isArray(horariosDaAPI) ? horariosDaAPI : []
      );
    } catch (error) {
      console.error("Erro ao buscar horários de funcionamento:", error);
      setHorariosFuncionamento([]);
      // Só mostra toast se for o primeiro carregamento
      if (horariosFuncionamento.length === 0) {
        addToast({
          title: "Erro",
          description: "Falha ao carregar horários de funcionamento.",
          color: "danger",
          timeout: 4000,
        });
      }
    }
  }, [barbeariaId, horariosFuncionamento.length]);

  // Carrega horários de funcionamento da barbearia do barbeiro selecionado
  useEffect(() => {
    fetchHorariosFuncionamento();
  }, [fetchHorariosFuncionamento]);

  // Recarrega horários quando a página ganha foco (usuário volta para a aba)
  useEffect(() => {
    const handleFocus = () => {
      fetchHorariosFuncionamento();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchHorariosFuncionamento]);

  // Polling periódico para atualizar horários automaticamente (a cada 30 segundos)
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchHorariosFuncionamento();
    }, 30000); // 30 segundos

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchHorariosFuncionamento]);

  // FUNÇÃO PARA GERAR PRÓXIMOS 6 DIAS DISPONÍVEIS (EXCETO DOMINGO)
  const generateDates = () => {
    const dates: Array<{
      value: string;
      labelDesktop: string;
      labelMobile: string;
      isToday: boolean;
      barbeiroTrabalha: boolean;
    }> = [];
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    let dayOffset = 0;
    // Evita loop infinito enquanto horários ainda não carregaram
    if (horariosFuncionamento.length === 0) {
      return dates;
    }
    const maxIterations = 370;
    let iterations = 0;

    // Continua até ter 6 dias válidos
    while (dates.length < 6 && iterations < maxIterations) {
      iterations++;
      const date = new Date(today);

      date.setDate(today.getDate() + dayOffset);

      // Primeiro verifica se há horário de funcionamento (sem considerar o barbeiro)
      const horarioFuncionamento = getHorarioFuncionamento(date);
      
      // Se não há horário ou é feriado, não exibe o card
      if (!horarioFuncionamento || horarioFuncionamento.is_feriado) {
        dayOffset++;
        continue;
      }
      
      // Verifica se o barbeiro trabalha neste dia
      const horarioEfetivo = getHorarioEfetivo(date);
      const barbeiroTrabalha = horarioEfetivo !== undefined && !horarioEfetivo.is_feriado;

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      const isToday = dateString === todayString;

      // Se for hoje e todos os horários já passaram E o barbeiro trabalha, pula este dia
      // Se o barbeiro não trabalha, ainda exibe o card desabilitado
      if (isToday && isAllTimeSlotsPassed(dateString) && barbeiroTrabalha) {
        dayOffset++;
        continue;
      }

      // Se o barbeiro trabalha, verifica se há slots disponíveis
      // Se não trabalha, ainda exibe o card (desabilitado), então não pula
      if (barbeiroTrabalha && !hasSlotsForDate(date)) {
        dayOffset++;
        continue;
      }

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
        barbeiroTrabalha: barbeiroTrabalha,
      });

      dayOffset++;
    }

    return dates;
  };

  // Função para determinar o turno de um horário
  const getTurno = (time: string): "manha" | "tarde" | "noite" => {
    const [hour] = time.split(":").map(Number);

    if (hour < 13) return "manha"; // Manhã: antes das 13:00
    if (hour < 18) return "tarde"; // Tarde: das 13:00 até 17:59
    if (hour >= 18) return "noite"; // Noite: a partir das 18:00

    return "manha"; // fallback
  };

  const parseTimeToMinutes = (time: string) => {
    const [hour, minute] = time.split(":").map(Number);
    return hour * 60 + minute;
  };

  const minutesToTime = (minutes: number) => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  };

  const isOverlappingInterval = (
    start: number,
    end: number,
    intervalStart: number,
    intervalEnd: number
  ) => start < intervalEnd && end > intervalStart;

  const getDiaSemana = (date: Date) => {
    const diaSemanaMap: Record<number, string> = {
      0: "DOMINGO",
      1: "SEGUNDA",
      2: "TERCA",
      3: "QUARTA",
      4: "QUINTA",
      5: "SEXTA",
      6: "SABADO",
    };
    return diaSemanaMap[date.getDay()];
  };

  // Função para obter horário de funcionamento sem verificar o barbeiro
  const getHorarioFuncionamento = (date: Date) => {
    const diaSemana = getDiaSemana(date);
    const dataComparar = new Date(date);
    dataComparar.setHours(0, 0, 0, 0);

    const horariosDoDia = horariosFuncionamento.filter(
      (h) => h.dia_da_semana === diaSemana
    );

    if (horariosDoDia.length === 0) return undefined;

    const excecao = horariosDoDia.find((h) => {
      if (h.tipo_regra !== "EXCECAO" || !h.data_excecao) return false;
      const dataExcecao = new Date(h.data_excecao);
      dataExcecao.setHours(0, 0, 0, 0);
      return (
        dataExcecao.getDate() === dataComparar.getDate() &&
        dataExcecao.getMonth() === dataComparar.getMonth() &&
        dataExcecao.getFullYear() === dataComparar.getFullYear()
      );
    });

    if (excecao) {
      return excecao;
    }

    const padrao = horariosDoDia.find((h) => h.tipo_regra === "PADRAO");
    return padrao || horariosDoDia[0];
  };

  const getHorarioEfetivo = (date: Date) => {
    const horario = getHorarioFuncionamento(date);
    if (!horario) return undefined;

    // Verifica se o barbeiro trabalha neste dia
    if (barber?.id) {
      const profissionaisIds = horario.profissionais_ids || [];
      // Se há profissionais_ids definidos, o barbeiro DEVE estar na lista
      if (profissionaisIds.length > 0 && !profissionaisIds.includes(barber.id)) {
        return undefined; // Barbeiro não trabalha neste dia
      }
    }

    return horario;
  };

  const hasSlotsForDate = (date: Date) => {
    const horario = getHorarioEfetivo(date);
    if (!horario || horario.is_feriado) return false;

    const abertura = parseTimeToMinutes(horario.horario_abertura);
    const fechamento = parseTimeToMinutes(horario.horario_fechamento);
    const duracao = totalDuration > 0 ? totalDuration : 30;
    const step = 30;

    const almocoInicio = horario.tem_almoco && horario.horario_almoco_inicio
      ? parseTimeToMinutes(horario.horario_almoco_inicio)
      : null;
    const almocoFim = horario.tem_almoco && horario.horario_almoco_fim
      ? parseTimeToMinutes(horario.horario_almoco_fim)
      : null;

    for (let start = abertura; start + duracao <= fechamento; start += step) {
      const end = start + duracao;
      if (
        almocoInicio !== null &&
        almocoFim !== null &&
        isOverlappingInterval(start, end, almocoInicio, almocoFim)
      ) {
        continue;
      }
      return true;
    }

    return false;
  };

  // FUNÇÃO PARA VERIFICAR SE TODOS OS HORÁRIOS DO DIA ATUAL JÁ PASSARAM
  const isAllTimeSlotsPassed = useCallback(
    (dateString: string) => {
      const now = new Date();
      const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      // Só verifica se for o dia atual
      if (dateString !== todayString) return false;

      const horario = getHorarioEfetivo(new Date(`${dateString}T00:00:00`));
      if (!horario || horario.is_feriado) return true;

      const abertura = parseTimeToMinutes(horario.horario_abertura);
      const fechamento = parseTimeToMinutes(horario.horario_fechamento);
      const duracao = totalDuration > 0 ? totalDuration : 30;
      const step = 30;

      const almocoInicio =
        horario.tem_almoco && horario.horario_almoco_inicio
          ? parseTimeToMinutes(horario.horario_almoco_inicio)
          : null;
      const almocoFim =
        horario.tem_almoco && horario.horario_almoco_fim
          ? parseTimeToMinutes(horario.horario_almoco_fim)
          : null;

      for (let start = abertura; start + duracao <= fechamento; start += step) {
        const end = start + duracao;
        if (
          almocoInicio !== null &&
          almocoFim !== null &&
          isOverlappingInterval(start, end, almocoInicio, almocoFim)
        ) {
          continue;
        }
        const time = minutesToTime(start);
        const timeSlotStart = new Date(`${dateString}T${time}:00`).getTime();
        if (timeSlotStart >= now.getTime()) {
          return false;
        }
      }

      return true;
    },
    [totalDuration, horariosFuncionamento, barber]
  );

  // FUNÇÃO PARA GERAR HORÁRIOS DISPONÍVEIS
  const generateTimeSlots = useCallback(() => {
    const slots: {
      time: string;
      isOccupied: boolean;
      isPast: boolean;
      turno: "manha" | "tarde" | "noite";
    }[] = [];
    // Obtém a data e hora atual
    const now = new Date();
    const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const isToday = selectedDate === todayString;

    if (!selectedDate) return slots;

    const horario = getHorarioEfetivo(new Date(`${selectedDate}T00:00:00`));
    if (!horario || horario.is_feriado) return slots;

    const abertura = parseTimeToMinutes(horario.horario_abertura);
    const fechamento = parseTimeToMinutes(horario.horario_fechamento);
    const duracao = totalDuration > 0 ? totalDuration : 30;
    const step = 30;

    const almocoInicio = horario.tem_almoco && horario.horario_almoco_inicio
      ? parseTimeToMinutes(horario.horario_almoco_inicio)
      : null;
    const almocoFim = horario.tem_almoco && horario.horario_almoco_fim
      ? parseTimeToMinutes(horario.horario_almoco_fim)
      : null;

    // Filtra os horários ocupados com base nos agendamentos existentes
    // Agora tratamos tudo como horário LOCAL do navegador (Fortaleza)
    const occupiedTimes: { start: number; end: number }[] = schedules
      .filter((schedule) => {
        const startDate = new Date(schedule.hora_inicio);

        const scheduleLocalDate = `${startDate.getFullYear()}-${String(
          startDate.getMonth() + 1
        ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;

        return scheduleLocalDate === selectedDate;
      })
      .map((schedule) => {
        const start = new Date(schedule.hora_inicio).getTime();
        const end = new Date(schedule.hora_fim).getTime();

        return { start, end };
      });

    for (let start = abertura; start + duracao <= fechamento; start += step) {
      const end = start + duracao;
      if (
        almocoInicio !== null &&
        almocoFim !== null &&
        isOverlappingInterval(start, end, almocoInicio, almocoFim)
      ) {
        continue;
      }

      const time = minutesToTime(start);
      const timeSlotStart = new Date(`${selectedDate}T${time}:00`).getTime();
      const timeSlotEnd = timeSlotStart + duracao * 60000;

      const isOccupied = occupiedTimes.some(({ start: occStart, end: occEnd }) => {
        return (
          (timeSlotStart >= occStart && timeSlotStart < occEnd) ||
          (timeSlotEnd > occStart && timeSlotEnd <= occEnd) ||
          (timeSlotStart <= occStart && timeSlotEnd >= occEnd)
        );
      });

      const isPast = isToday && timeSlotStart < now.getTime();
      const turno = getTurno(time);

      slots.push({ time, isOccupied, isPast, turno });
    }

    return slots;
  }, [selectedDate, schedules, totalDuration, horariosFuncionamento, barber]);

  // Atualiza os horários disponíveis ao selecionar uma data
  const handleDateSelect = (date: string) => {
    setSelectedDate(date); // Atualiza o estado da data selecionada
    setSelectedTime(""); // Limpa o horário selecionado ao mudar a data
  };

  // Função para abrir o calendário nativo
  const handleOpenCalendar = () => {
    if (dateInputRef.current) {
      // No mobile, o input precisa estar visível e clicável
      // Remove temporariamente pointer-events-none se necessário
      const wasPointerEventsNone = dateInputRef.current.style.pointerEvents === "none";
      
      if (wasPointerEventsNone) {
        dateInputRef.current.style.pointerEvents = "auto";
      }
      
      // Tenta usar showPicker() se disponível (navegadores modernos)
      if (typeof dateInputRef.current.showPicker === "function") {
        try {
          dateInputRef.current.showPicker();
        } catch (error) {
          // Se showPicker falhar, usa click como fallback
          dateInputRef.current.click();
        }
      } else {
        // Fallback: clica no input para abrir o calendário
        dateInputRef.current.click();
      }
      
      // Restaura pointer-events-none após um delay (apenas no desktop)
      if (wasPointerEventsNone && window.innerWidth > 768) {
        setTimeout(() => {
          if (dateInputRef.current) {
            dateInputRef.current.style.pointerEvents = "none";
          }
        }, 100);
      }
    }
  };

  // Função para validar e processar data selecionada do calendário
  const handleCalendarDateSelect = (dateString: string) => {
    // Se a data foi limpa, reseta o estado para exibir os 6 cards padrão
    if (!dateString) {
      setSelectedDate("");
      setSelectedTime("");

      return;
    }

    // Converte a data do formato YYYY-MM-DD para Date
    const selectedDateObj = new Date(dateString + "T00:00:00");
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    // Compara apenas as datas (sem horas)
    const selectedDateOnly = new Date(
      selectedDateObj.getFullYear(),
      selectedDateObj.getMonth(),
      selectedDateObj.getDate(),
    );
    const todayDateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    // Verifica se a data é no passado (não inclui o dia atual)
    if (selectedDateOnly < todayDateOnly) {
      addToast({
        title: "Data inválida",
        description: "Não é possível selecionar uma data no passado.",
        color: "warning",
        timeout: 3000,
      });
      return;
    }

    const horario = getHorarioEfetivo(selectedDateObj);
    if (!horario || horario.is_feriado) {
      addToast({
        title: "Informação",
        description: "Esse barbeiro não atende neste dia!",
        color: "primary",
        timeout: 3000,
      });

      return;
    }

    // Verifica se é hoje e todos os horários já passaram
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    if (dateString === todayString && isAllTimeSlotsPassed(dateString)) {
      addToast({
        title: "Data inválida",
        description:
          "Todos os horários de hoje já passaram. Selecione outra data.",
        color: "warning",
        timeout: 3000,
      });

      return;
    }

    if (!hasSlotsForDate(selectedDateObj)) {
      addToast({
        title: "Data inválida",
        description: "Não há horários disponíveis para esta data.",
        color: "warning",
        timeout: 3000,
      });
      return;
    }

    // Se passou todas as validações, seleciona a data
    handleDateSelect(dateString);
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
    // Carrega os agendamentos do barbeiro selecionado
    if (barber?.id) {
      fetchSchedules(barber.id);
    }
  }, [barber?.id]);

  return (
    <section className="min-h-screen transition-colors duration-300" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* COMPONENTE CABEÇALH0 */}
      <Header />

      <div className="p-4 pb-10 md:px-8">
        <Helmet title="Selecionar data e horário" />

        <div className="mx-auto max-w-2xl">
          <button
            className="text-sm mb-4 w-8 h-8 flex items-center justify-center border rounded-full transition-colors duration-300 hover:bg-[var(--bg-hover)]"
            style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}
            type="button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="w-6 h-6 text-yellow-400" />
          </button>

          {/* Banner */}
          <div className="relative rounded-xl overflow-hidden shadow-lg h-40 mb-6 transition-colors duration-300" style={{ backgroundColor: "var(--bg-secondary)" }}>
            <img
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-100"
              src="/image-1.png"
            />
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-2xl font-bold drop-shadow-lg transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                Selecione a data e horário
              </h1>
            </div>
          </div>

          {/* RESUMO DO AGENDAMENTO */}
          {selectedServices && selectedServices.length > 0 && (
            <div className="rounded-lg p-4 mb-6 transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
              <h3 className="font-medium mb-2 transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                Resumo do agendamento
              </h3>
              <div className="text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                {barber && <div>Barbeiro: {barber.nome}</div>}

                {selectedServices.map((service) => (
                  <div
                    key={service.id}
                    className="border-b pb-2 last:border-0 last:pb-0 transition-colors duration-300"
                    style={{ borderColor: "var(--border-primary)" }}
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
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                Escolha a data
              </h2>
              <div className="relative">
                <input
                  ref={dateInputRef}
                  className="absolute opacity-0 w-full h-full cursor-pointer z-10 md:pointer-events-none pointer-events-auto"
                  min={(() => {
                    const today = new Date();
                    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                    return todayString;
                  })()}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleCalendarDateSelect(e.target.value)}
                />
                <button
                  className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 border border-blue-500 transition-colors shadow-md hover:shadow-lg relative z-0"
                  title="Abrir calendário"
                  type="button"
                  onClick={handleOpenCalendar}
                >
                  <CalendarIcon className="w-5 h-5 transition-colors duration-300" style={{ color: "var(--text-primary)" }} />
                </button>
              </div>
            </div>
            {/* Container com grid no mobile e desktop */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {/* Mobile e Desktop: Grid de datas */}
              <div className="contents">
                  {(() => {
                    const availableDates = generateDates();
                    const isSelectedDateInAvailable = availableDates.some(
                      (date) => date.value === selectedDate,
                    );

                    // Se a data selecionada não está nas datas disponíveis, mostra apenas ela
                    if (selectedDate && !isSelectedDateInAvailable) {
                      const selectedDateObj = new Date(selectedDate + "T00:00:00");
                      const horario = getHorarioEfetivo(selectedDateObj);
                      const barbeiroTrabalha = horario !== undefined && !horario.is_feriado;
                      
                      const day = String(selectedDateObj.getDate()).padStart(
                        2,
                        "0",
                      );
                      const month = String(selectedDateObj.getMonth() + 1).padStart(
                        2,
                        "0",
                      );
                      const shortDate = `${day}/${month}`;

                      const weekdayShort = selectedDateObj.toLocaleDateString(
                        "pt-BR",
                        {
                          weekday: "short",
                        },
                      );

                      const weekdayShortCapitalized =
                        weekdayShort.charAt(0).toUpperCase() +
                        weekdayShort.slice(1);

                      const weekdayLong = selectedDateObj.toLocaleDateString(
                        "pt-BR",
                        {
                          weekday: "long",
                        },
                      );

                      const weekdayLongCapitalized =
                        weekdayLong.charAt(0).toUpperCase() + weekdayLong.slice(1);

                      const today = new Date();
                      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                      const isToday = selectedDate === todayString;

                      return (
                        <button
                          key={selectedDate}
                          className={`p-3 rounded-lg text-center transition-colors ${
                            !barbeiroTrabalha
                              ? "opacity-50 cursor-not-allowed"
                              : "bg-blue-600 text-white"
                          }`}
                          style={!barbeiroTrabalha
                            ? { backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)", borderColor: "var(--border-primary)" }
                            : undefined
                          }
                          type="button"
                          disabled={!barbeiroTrabalha}
                          title={!barbeiroTrabalha ? "Não atende nesse dia" : undefined}
                          onClick={() => {
                            if (barbeiroTrabalha) {
                              handleDateSelect(selectedDate);
                            } else {
                              addToast({
                                title: "Informação",
                                description: "Esse barbeiro não atende neste dia",
                                color: "warning",
                                timeout: 3000,
                              });
                            }
                          }}
                        >
                          <div className="text-sm font-medium sm:hidden">
                            {isToday
                              ? `Hoje (${shortDate})`
                              : `${weekdayShortCapitalized} (${shortDate})`}
                          </div>
                          <div className="text-sm font-medium hidden sm:block">
                            {isToday
                              ? `Hoje (${shortDate})`
                              : `${weekdayLongCapitalized} (${shortDate})`}
                          </div>
                        </button>
                      );
                    }

                    // Caso contrário, mostra as 6 datas disponíveis
                    return availableDates.map((date) => {
                      const isDisabled = !date.barbeiroTrabalha;
                      
                      return (
                        <button
                          key={date.value}
                          className={`p-3 rounded-lg text-center transition-colors ${
                            isDisabled
                              ? "opacity-50 cursor-not-allowed"
                              : selectedDate === date.value
                                ? "bg-blue-600 text-white"
                                : "hover:bg-[var(--bg-hover)]"
                          }`}
                          style={isDisabled
                            ? { backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)", borderColor: "var(--border-primary)" }
                            : selectedDate === date.value 
                              ? undefined 
                              : { backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-primary)" }
                          }
                          type="button"
                          disabled={isDisabled}
                          title={isDisabled ? "Não atende nesse dia" : undefined}
                          onClick={() => {
                            if (!isDisabled) {
                              handleDateSelect(date.value);
                            } else {
                              addToast({
                                title: "Informação",
                                description: "Esse barbeiro não atende neste dia!",
                                color: "primary",
                                timeout: 3000,
                              });
                            }
                          }}
                        >
                          <div className="text-sm font-medium sm:hidden">
                            {date.labelMobile}
                          </div>
                          <div className="text-sm font-medium hidden sm:block">
                            {date.labelDesktop}
                          </div>
                        </button>
                      );
                    });
                  })()}
              </div>
            </div>
          </div>

          {/* SELEÇÃO DE HORÁRIO DISPONÍVEIS */}
          {selectedDate && availableTimeSlots.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                Escolha o horário
              </h2>

              {/* Agrupar horários por turno */}
              {(() => {
                const horariosFiltrados = availableTimeSlots.filter(
                  ({ isPast }) => !isPast
                );

                const turnos = {
                  manha: horariosFiltrados.filter(
                    ({ turno }) => turno === "manha"
                  ),
                  tarde: horariosFiltrados.filter(
                    ({ turno }) => turno === "tarde"
                  ),
                  noite: horariosFiltrados.filter(
                    ({ turno }) => turno === "noite"
                  ),
                };

                const contarDisponiveis = (
                  horarios: typeof horariosFiltrados
                ) => horarios.filter(({ isOccupied }) => !isOccupied).length;

                const formatarDisponiveis = (quantidade: number) => {
                  if (quantidade === 0) {
                    return "Nenhum horário disponível";
                  }
                  if (quantidade === 1) {
                    return "1 horário disponível";
                  }

                  return `${quantidade} horários disponíveis`;
                };

                return (
                  <div className="space-y-4">
                    {/* Turno Manhã */}
                    {turnos.manha.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                            Manhã
                          </h3>
                          <span className="text-xs transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                            {formatarDisponiveis(
                              contarDisponiveis(turnos.manha)
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {turnos.manha.map(({ time, isOccupied }) => (
                            <button
                              key={time}
                              className={`p-2 rounded-lg text-center text-sm transition-colors ${
                                isOccupied
                                  ? "cursor-not-allowed opacity-50"
                                  : selectedTime === time
                                    ? "bg-green-600 text-white"
                                    : "hover:bg-[var(--bg-hover)]"
                              }`}
                              style={isOccupied 
                                ? { backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" }
                                : selectedTime === time
                                  ? undefined
                                  : { backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-primary)" }
                              }
                              disabled={isOccupied}
                              title={
                                isOccupied ? "Horário ocupado" : "Disponível"
                              }
                              type="button"
                              onClick={() =>
                                !isOccupied && setSelectedTime(time)
                              }
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Turno Tarde */}
                    {turnos.tarde.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                            Tarde
                          </h3>
                          <span className="text-xs transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                            {formatarDisponiveis(
                              contarDisponiveis(turnos.tarde)
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {turnos.tarde.map(({ time, isOccupied }) => (
                            <button
                              key={time}
                              className={`p-2 rounded-lg text-center text-sm transition-colors ${
                                isOccupied
                                  ? "cursor-not-allowed opacity-50"
                                  : selectedTime === time
                                    ? "bg-green-600 text-white"
                                    : "hover:bg-[var(--bg-hover)]"
                              }`}
                              style={isOccupied 
                                ? { backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" }
                                : selectedTime === time
                                  ? undefined
                                  : { backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-primary)" }
                              }
                              disabled={isOccupied}
                              title={
                                isOccupied ? "Horário ocupado" : "Disponível"
                              }
                              type="button"
                              onClick={() =>
                                !isOccupied && setSelectedTime(time)
                              }
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Turno Noite */}
                    {turnos.noite.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                            Noite
                          </h3>
                          <span className="text-xs transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                            {formatarDisponiveis(
                              contarDisponiveis(turnos.noite)
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {turnos.noite.map(({ time, isOccupied }) => (
                            <button
                              key={time}
                              className={`p-2 rounded-lg text-center text-sm transition-colors ${
                                isOccupied
                                  ? "cursor-not-allowed opacity-50"
                                  : selectedTime === time
                                    ? "bg-green-600 text-white"
                                    : "hover:bg-[var(--bg-hover)]"
                              }`}
                              style={isOccupied 
                                ? { backgroundColor: "var(--bg-tertiary)", color: "var(--text-tertiary)" }
                                : selectedTime === time
                                  ? undefined
                                  : { backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-primary)" }
                              }
                              disabled={isOccupied}
                              title={
                                isOccupied ? "Horário ocupado" : "Disponível"
                              }
                              type="button"
                              onClick={() =>
                                !isOccupied && setSelectedTime(time)
                              }
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

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

          {/* BOTÃO DE CONFIRMAÇÃO DO AGENDAMENTO */}
          {selectedDate && selectedTime && (
            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              type="button"
              onClick={handleSchedule}
            >
              Confirmar Agendamento
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
