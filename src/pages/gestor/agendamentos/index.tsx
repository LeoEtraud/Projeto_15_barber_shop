import { Helmet } from "react-helmet-async";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { addToast } from "@heroui/react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usePermissions } from "@/hooks/usePermissions";
import { GetHorariosFuncionamento } from "@/contexts/ScheduleProvider/util";
import {
  IHorarioFuncionamento,
  IProfessionals,
  IAppointments,
} from "@/contexts/ScheduleProvider/types";
import { useAuth } from "@/contexts/AuthProvider/useAuth";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";
import { useLoading } from "@/contexts/LoadingProvider";
import { getDefaultBarberImage } from "@/utils/defaultImages";
import { getNomeSobrenome } from "@/utils/format-nome";

// Função para formatar data para comparação
function formatarDataParaComparacao(data: Date): string {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

// Função para obter data no formato DD/MM/YYYY
function formatarData(data: Date): string {
  return formatarDataParaComparacao(data);
}

// Função para extrair hora de um horário no formato "HH:MM - HH:MM"
function extrairHoraInicio(horario: string): string {
  if (!horario) return "";
  const partes = horario.split(" - ");

  return partes[0] || "";
}

// Função para obter as iniciais do barbeiro
function getInitials(nomeCompleto: string): string {
  const parts = nomeCompleto?.trim().split(" ") || [];

  if (parts.length === 0) return "";

  const first = parts[0]?.charAt(0)?.toUpperCase() || "";
  const last =
    parts.length > 1
      ? parts[parts.length - 1]?.charAt(0)?.toUpperCase() || ""
      : "";

  return `${first}${last}`;
}

// Função para obter URL do avatar
// O servidor salva avatares como base64 no banco de dados (Render/Vercel)
function getAvatarUrl(avatar: string | undefined): string | null {
  if (!avatar) return null;

  // Se o avatar já é base64 (formato do banco de dados), retorna diretamente
  if (avatar.startsWith("data:image")) {
    return avatar;
  }

  // Se já é uma URL completa (fallback para casos especiais), retorna diretamente
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }

  // Se o avatar não começa com "data:image" mas parece ser base64 (sem prefixo),
  // adiciona o prefixo necessário
  if (avatar.length > 100 && /^[A-Za-z0-9+/=]+$/.test(avatar)) {
    // Parece ser base64 puro, adiciona prefixo genérico
    return `data:image/jpeg;base64,${avatar}`;
  }

  // Se chegou aqui, tenta construir URL da API apenas como último recurso
  const apiUrl = import.meta.env.VITE_API;
  if (apiUrl) {
    return `${apiUrl}/barbeiros/avatar/${encodeURIComponent(avatar)}`;
  }

  return null;
}

export function GestorAgendamentosPage() {
  const navigate = useNavigate();
  const { isGestor } = usePermissions();
  const { user } = useAuth();
  const {
    professionals,
    fetchAppointmentsByProfessional,
    professionalAppointments,
    fetchProfessionals,
  } = useSchedule();
  const { withLoading } = useLoading();
  const [horarios, setHorarios] = useState<IHorarioFuncionamento[]>([]);
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState<string>("");
  const [selectAberto, setSelectAberto] = useState(false);
  const [modalRemarcarAberto, setModalRemarcarAberto] = useState(false);
  const [selectBarbeiroModalAberto, setSelectBarbeiroModalAberto] =
    useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] =
    useState<IAppointments | null>(null);
  const [novaData, setNovaData] = useState<string>("");
  const [novoBarbeiro, setNovoBarbeiro] = useState<string>("");
  const [novoHorario, setNovoHorario] = useState<string>("");
  const [isRemarcando, setIsRemarcando] = useState(false);

  // Buscar profissionais ao carregar a página
  useEffect(() => {
    if (isGestor && professionals.length === 0) {
      fetchProfessionals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGestor]);

  // Buscar horários de funcionamento
  useEffect(() => {
    async function fetchHorarios() {
      const barbeariaId = user?.user?.barbeariaId;
      if (!barbeariaId) {
        return;
      }

      try {
        const response = await withLoading(
          GetHorariosFuncionamento(barbeariaId)
        );

        // A API retorna os dados em hoursFunctionment
        const horariosDaAPI =
          response?.hoursFunctionment || response?.horarios || response || [];

        setHorarios(Array.isArray(horariosDaAPI) ? horariosDaAPI : []);
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
        setHorarios([]);
      }
    }

    if (isGestor) {
      fetchHorarios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user?.barbeariaId, isGestor]);

  // Buscar agendamentos do barbeiro selecionado
  useEffect(() => {
    async function buscarAgendamentos() {
      if (!barbeiroSelecionado) {
        return;
      }

      try {
        await fetchAppointmentsByProfessional(barbeiroSelecionado);
      } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
        addToast({
          title: "Erro",
          description: "Falha ao buscar agendamentos do barbeiro.",
          color: "danger",
          timeout: 3000,
        });
      }
    }

    if (barbeiroSelecionado && isGestor) {
      buscarAgendamentos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbeiroSelecionado, isGestor]);

  // Filtrar barbeiros ativos
  const barbeirosAtivos = useMemo(() => {
    if (!Array.isArray(professionals)) {
      return [];
    }
    return professionals.filter(
      (p) =>
        (p.status === "ATIVO" || p.status === "ativo") &&
        (p.funcao === "Barbeiro" || p.funcao === "Barbeiros")
    );
  }, [professionals]);


  // Selecionar primeiro barbeiro automaticamente se houver
  useEffect(() => {
    if (barbeirosAtivos.length > 0 && !barbeiroSelecionado) {
      setBarbeiroSelecionado(barbeirosAtivos[0].id);
    }
  }, [barbeirosAtivos, barbeiroSelecionado]);

  // Função para obter exceção de uma data específica
  const getExcecaoPorData = (data: Date): IHorarioFuncionamento | undefined => {
    const professionalsArray = Array.isArray(professionals) ? professionals : [];

    return horarios
      .map((horario) => {
        const profissionaisEnriquecidos = horario.profissionais_ids
          ?.map((id: string) => professionalsArray.find((p: IProfessionals) => p.id === id))
          .filter((p): p is NonNullable<typeof p> => p !== undefined) || [];

        return {
          ...horario,
          profissionais: profissionaisEnriquecidos,
        };
      })
      .find((excecao) => {
        if (!excecao.data_excecao || excecao.tipo_regra !== "EXCECAO") return false;
        const excecaoData = new Date(excecao.data_excecao);
        excecaoData.setHours(0, 0, 0, 0);
        const compararData = new Date(data);
        compararData.setHours(0, 0, 0, 0);

        return (
          excecaoData.getDate() === compararData.getDate() &&
          excecaoData.getMonth() === compararData.getMonth() &&
          excecaoData.getFullYear() === compararData.getFullYear()
        );
      });
  };

  // Função para gerar próximos 6 dias
  const gerarProximos6Dias = () => {
    const dias: Array<{ data: Date; diaSemana: string; horario?: IHorarioFuncionamento }> = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    let diasAdicionados = 0;
    let i = 0;
    const professionalsArray = Array.isArray(professionals) ? professionals : [];

    // Garante exatamente 6 dias
    while (diasAdicionados < 6) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() + i);

      const diaSemanaNum = data.getDay();
      const diaSemanaMap: Record<number, string> = {
        0: "DOMINGO",
        1: "SEGUNDA",
        2: "TERCA",
        3: "QUARTA",
        4: "QUINTA",
        5: "SEXTA",
        6: "SABADO",
      };
      const diaSemana = diaSemanaMap[diaSemanaNum];

      // Para domingo, só mostra se houver exceção
      if (diaSemana === "DOMINGO") {
        const excecao = getExcecaoPorData(data);
        if (excecao && !excecao.is_feriado) {
          dias.push({ data, diaSemana, horario: excecao });
          diasAdicionados++;
        }
      } else {
        // Para outros dias, busca horário (exceção ou padrão)
        const excecao = getExcecaoPorData(data);
        const horarioPadrao = horarios
          .map((h) => {
            const profissionaisEnriquecidos = h.profissionais_ids
              ?.map((id: string) =>
                professionalsArray.find((p: IProfessionals) => p.id === id)
              )
              .filter((p): p is NonNullable<typeof p> => p !== undefined) || [];

            return {
              ...h,
              profissionais: profissionaisEnriquecidos,
            };
          })
          .find((h) => h.dia_da_semana === diaSemana && h.tipo_regra === "PADRAO");
        dias.push({ data, diaSemana, horario: excecao || horarioPadrao });
        diasAdicionados++;
      }

      i++;
    }

    return dias;
  };

  // Organizar agendamentos por data
  const agendamentosPorData = useMemo(() => {
    // Usa apenas agendamentos reais
    const todosAgendamentos = [
      ...(Array.isArray(professionalAppointments) ? professionalAppointments : []),
    ];

    if (todosAgendamentos.length === 0) {
      return new Map<string, IAppointments[]>();
    }

    const mapa = new Map<string, IAppointments[]>();

    todosAgendamentos.forEach((agendamento) => {
      if (!agendamento.data) return;

      const data = agendamento.data;
      const agendamentosDaData = mapa.get(data) || [];

      agendamentosDaData.push(agendamento);
      mapa.set(data, agendamentosDaData);
    });

    // Ordenar agendamentos por horário dentro de cada data
    mapa.forEach((agendamentos) => {
      agendamentos.sort((a, b) => {
        const horaA = extrairHoraInicio(a.horario || "");
        const horaB = extrairHoraInicio(b.horario || "");

        return horaA.localeCompare(horaB);
      });
    });

    return mapa;
  }, [professionalAppointments]);

  // Função para gerar slots de horário com agendamentos
  const gerarSlotsComAgendamentos = (
    horario: IHorarioFuncionamento | undefined,
    _data: Date
  ): Array<{
    hora: string;
    disponivel: boolean;
    isAlmoco: boolean;
    isSlotAlmoco?: boolean;
    agendamento?: IAppointments;
  }> => {
    if (!horario || horario.is_feriado) {
      return [];
    }

    const slots: Array<{
      hora: string;
      disponivel: boolean;
      isAlmoco: boolean;
      isSlotAlmoco?: boolean;
      agendamento?: IAppointments;
    }> = [];
    const [horaAbertura, minutoAbertura] = horario.horario_abertura.split(":").map(Number);
    const [horaFechamento, minutoFechamento] = horario.horario_fechamento.split(":").map(Number);

    let horaAtual = horaAbertura;
    let minutoAtual = minutoAbertura;
    let slotAlmocoAdicionado = false;

    const dataFormatada = formatarData(_data);
    const agendamentosDoDia = agendamentosPorData.get(dataFormatada) || [];

    while (
      horaAtual < horaFechamento ||
      (horaAtual === horaFechamento && minutoAtual < minutoFechamento)
    ) {
      const horaStr = `${String(horaAtual).padStart(2, "0")}:${String(minutoAtual).padStart(2, "0")}`;

      // Verifica se está no intervalo de almoço
      const isAlmoco =
        horario.tem_almoco &&
        horario.horario_almoco_inicio &&
        horario.horario_almoco_fim &&
        horaStr >= horario.horario_almoco_inicio &&
        horaStr < horario.horario_almoco_fim;

      // Se está no início do intervalo de almoço e ainda não adicionou o slot de almoço
      if (
        isAlmoco &&
        !slotAlmocoAdicionado &&
        horaStr === horario.horario_almoco_inicio &&
        horario.horario_almoco_fim
      ) {
        slots.push({
          hora: `${horario.horario_almoco_inicio} - ${horario.horario_almoco_fim}`,
          disponivel: false,
          isAlmoco: true,
          isSlotAlmoco: true,
        });
        slotAlmocoAdicionado = true;

        // Pula para o fim do almoço
        const [horaAlmocoFim, minutoAlmocoFim] = horario.horario_almoco_fim.split(":").map(Number);
        horaAtual = horaAlmocoFim;
        minutoAtual = minutoAlmocoFim;
        continue;
      }

      // Se não está no intervalo de almoço, adiciona slot normal
      if (!isAlmoco) {
        // Verifica se há agendamento neste horário
        const agendamentoNoHorario = agendamentosDoDia.find((ag) => {
          const horaInicio = extrairHoraInicio(ag.horario || "");

          return horaInicio === horaStr;
        });

        slots.push({
          hora: horaStr,
          disponivel: !agendamentoNoHorario,
          isAlmoco: false,
          agendamento: agendamentoNoHorario,
        });
      }

      // Avança 30 minutos
      minutoAtual += 30;
      if (minutoAtual >= 60) {
        minutoAtual = 0;
        horaAtual++;
      }
    }

    return slots;
  };

  // Função para contar horários agendados e disponíveis por data
  const contarHorariosPorData = (
    _data: Date,
    horario: IHorarioFuncionamento | undefined
  ) => {
    if (!horario || horario.is_feriado) {
      return { agendados: 0, disponiveis: 0 };
    }

    const slots = gerarSlotsComAgendamentos(horario, _data);
    const agendados = slots.filter((s) => s.agendamento).length;
    const disponiveis = slots.filter(
      (s) => !s.isAlmoco && !s.isSlotAlmoco && !s.agendamento
    ).length;

    return { agendados, disponiveis };
  };

  // Função para lidar com clique no agendamento
  const handleClickAgendamento = (agendamento: IAppointments) => {
    setAgendamentoSelecionado(agendamento);
    setNovaData("");
    setNovoBarbeiro("");
    setNovoHorario("");
    setModalRemarcarAberto(true);
  };

  // Função para fechar o modal
  const fecharModal = () => {
    setModalRemarcarAberto(false);
    setAgendamentoSelecionado(null);
    setNovaData("");
    setNovoBarbeiro("");
    setNovoHorario("");
    setSelectBarbeiroModalAberto(false);
  };

  // Função para gerar horários disponíveis baseado na data e barbeiro selecionados
  const gerarHorariosDisponiveis = useMemo(() => {
    if (!novaData || !novoBarbeiro) {
      return [];
    }

    // Converte a string da data (formato YYYY-MM-DD) para Date
    const dataSelecionada = new Date(novaData + "T00:00:00");
    const diaSemanaNum = dataSelecionada.getDay();
    const diaSemanaMap: Record<number, string> = {
      0: "DOMINGO",
      1: "SEGUNDA",
      2: "TERCA",
      3: "QUARTA",
      4: "QUINTA",
      5: "SEXTA",
      6: "SABADO",
    };
    const diaSemana = diaSemanaMap[diaSemanaNum];

    // Busca horário de funcionamento para o dia
    const professionalsArray = Array.isArray(professionals) ? professionals : [];
    const excecao = horarios
      .map((h) => {
        const profissionaisEnriquecidos = h.profissionais_ids
          ?.map((id: string) =>
            professionalsArray.find((p: IProfessionals) => p.id === id)
          )
          .filter((p): p is NonNullable<typeof p> => p !== undefined) || [];

        return {
          ...h,
          profissionais: profissionaisEnriquecidos,
        };
      })
      .find((h) => {
        if (!h.data_excecao || h.tipo_regra !== "EXCECAO") return false;
        const excecaoData = new Date(h.data_excecao);
        excecaoData.setHours(0, 0, 0, 0);
        const compararData = new Date(dataSelecionada);
        compararData.setHours(0, 0, 0, 0);

        return (
          excecaoData.getDate() === compararData.getDate() &&
          excecaoData.getMonth() === compararData.getMonth() &&
          excecaoData.getFullYear() === compararData.getFullYear()
        );
      });

    const horarioPadrao = horarios
      .map((h) => {
        const profissionaisEnriquecidos = h.profissionais_ids
          ?.map((id: string) =>
            professionalsArray.find((p: IProfessionals) => p.id === id)
          )
          .filter((p): p is NonNullable<typeof p> => p !== undefined) || [];

        return {
          ...h,
          profissionais: profissionaisEnriquecidos,
        };
      })
      .find((h) => h.dia_da_semana === diaSemana && h.tipo_regra === "PADRAO");

    const horario = excecao || horarioPadrao;

    if (!horario || horario.is_feriado) {
      return [];
    }

    // Gera slots de 30 em 30 minutos
    const slots: string[] = [];
    const [horaAbertura, minutoAbertura] = horario.horario_abertura
      .split(":")
      .map(Number);
    const [horaFechamento, minutoFechamento] = horario.horario_fechamento
      .split(":")
      .map(Number);

    // Verifica se a data selecionada é hoje
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    const isHoje = novaData === hojeStr;

    // Hora atual para filtrar horários passados se for hoje
    const agora = new Date();
    const horaAtualAgora = agora.getHours();
    const minutoAtualAgora = agora.getMinutes();

    let horaAtual = horaAbertura;
    let minutoAtual = minutoAbertura;

    while (
      horaAtual < horaFechamento ||
      (horaAtual === horaFechamento && minutoAtual < minutoFechamento)
    ) {
      const horaStr = `${String(horaAtual).padStart(2, "0")}:${String(minutoAtual).padStart(2, "0")}`;

      // Verifica se está no intervalo de almoço
      const isAlmoco =
        horario.tem_almoco &&
        horario.horario_almoco_inicio &&
        horario.horario_almoco_fim &&
        horaStr >= horario.horario_almoco_inicio &&
        horaStr < horario.horario_almoco_fim;

      // Verifica se o horário já passou (apenas se for hoje)
      let isPassado = false;
      if (isHoje) {
        // Converte o horário do slot para minutos totais para comparação mais precisa
        const minutosSlot = horaAtual * 60 + minutoAtual;
        const minutosAgora = horaAtualAgora * 60 + minutoAtualAgora;

        // Considera passado se o horário do slot for menor ou igual ao horário atual
        // Isso garante que só mostra horários futuros (próximo slot de 30 em 30 minutos)
        if (minutosSlot <= minutosAgora) {
          isPassado = true;
        }
      }

      if (!isAlmoco && !isPassado) {
        slots.push(horaStr);
      }

      // Avança 30 minutos
      minutoAtual += 30;
      if (minutoAtual >= 60) {
        minutoAtual = 0;
        horaAtual++;
      }
    }

    return slots;
  }, [novaData, novoBarbeiro, horarios, professionals]);

  // Função para remarcar agendamento
  const handleRemarcar = async () => {
    if (!agendamentoSelecionado || !novaData || !novoBarbeiro || !novoHorario) {
      addToast({
        title: "Erro",
        description: "Preencha todos os campos para remarcar.",
        color: "danger",
        timeout: 3000,
      });
      return;
    }

    setIsRemarcando(true);

    try {
      // TODO: Implementar chamada à API para remarcar agendamento
      // await RemarcarAgendamento({
      //   appointmentId: agendamentoSelecionado.id,
      //   novaData,
      //   novoBarbeiro,
      //   novoHorario,
      // });

      // Simulação de sucesso
      await new Promise((resolve) => setTimeout(resolve, 1000));

      addToast({
        title: "Sucesso",
        description: "Agendamento remarcado com sucesso!",
        color: "success",
        timeout: 3000,
      });

      // Recarrega os agendamentos
      if (barbeiroSelecionado) {
        await fetchAppointmentsByProfessional(barbeiroSelecionado);
      }

      fecharModal();
    } catch (error) {
      console.error("Erro ao remarcar agendamento:", error);
      addToast({
        title: "Erro",
        description: "Falha ao remarcar agendamento. Tente novamente.",
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setIsRemarcando(false);
    }
  };

  const dias = gerarProximos6Dias();

  return (
    <section className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Header />

      <div className="px-4 py-8 md:px-8 flex-1">
        <Helmet title="Gerenciar Agendamentos - Gestor" />

        <div className="mx-auto max-w-6xl">
          {/* Botão Voltar */}
          <button
            className="text-sm mb-4 w-8 h-8 flex items-center justify-center border rounded-full transition-colors duration-300 hover:bg-[var(--bg-hover)]"
            style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}
            type="button"
            onClick={() => navigate("/gestor/dashboard")}
          >
            <ArrowLeftIcon className="w-6 h-6 text-yellow-400" />
          </button>

          {/* Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-lg mb-6 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0">
              <img
                alt="Agendamentos"
                className="w-full h-full object-cover object-right-center opacity-15"
                src="/image-1.png"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-blue-700/90 to-blue-800/90" />
            </div>

            <div className="relative z-10 p-4 md:p-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-medium mb-1 transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                    Gerenciar Agendamentos
                  </h1>
                  <p className="text-xs md:text-sm font-light transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                    Visualize e gerencie os agendamentos dos barbeiros
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="rounded-lg p-4 border transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
            <h3 className="text-lg font-semibold mb-4 transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
              Agendamentos por Barbeiro
            </h3>

            {/* Select de Barbeiros Customizado */}
            <div className="rounded-lg p-3 mb-4 border max-w-xs transition-colors duration-300" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
              <label
                className="block text-xs font-medium mb-1.5 transition-colors duration-300"
                style={{ color: "var(--text-secondary)" }}
                htmlFor="barbeiro-select"
              >
                Selecione o Barbeiro:
              </label>
              <div className="relative">
                <button
                  className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center gap-2 transition-colors duration-300"
                  style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)", borderColor: "var(--border-secondary)" }}
                  onClick={() => setSelectAberto(!selectAberto)}
                  type="button"
                >
                  {barbeiroSelecionado ? (
                    <>
                      {(() => {
                        const barbeiro = barbeirosAtivos.find(
                          (b) => b.id === barbeiroSelecionado
                        );
                        const avatarUrl = barbeiro
                          ? getAvatarUrl(barbeiro.avatar)
                          : null;

                        return (
                          <>
                            {avatarUrl ? (
                              <img
                                alt={barbeiro?.nome || ""}
                                className="w-6 h-6 rounded-full object-cover border border-gray-500 flex-shrink-0"
                                src={avatarUrl}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  e.currentTarget.nextElementSibling?.classList.remove(
                                    "hidden"
                                  );
                                }}
                              />
                            ) : null}
                            <div
                              className={`w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[10px] font-bold border border-gray-500 flex-shrink-0 ${
                                avatarUrl ? "hidden" : ""
                              }`}
                            >
                              {barbeiro
                                ? getInitials(barbeiro.nome)
                                : ""}
                            </div>
                            <span className="flex-1 text-left">
                              {barbeiro?.nome ? getNomeSobrenome(barbeiro.nome) : "Selecione um barbeiro"}
                            </span>
                          </>
                        );
                      })()}
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          selectAberto ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M19 9l-7 7-7-7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-left transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                        Selecione um barbeiro
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          selectAberto ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M19 9l-7 7-7-7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    </>
                  )}
                </button>

                {selectAberto && (
                  <>
                    <button
                      className="fixed inset-0 z-10 bg-transparent border-0 cursor-default"
                      onClick={() => setSelectAberto(false)}
                      type="button"
                    />
                    <div className="absolute z-20 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {barbeirosAtivos.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">
                          Nenhum barbeiro ativo encontrado
                        </div>
                      ) : (
                        barbeirosAtivos.map((barbeiro) => {
                          const avatarUrl = getAvatarUrl(barbeiro.avatar);

                          return (
                            <button
                              key={barbeiro.id}
                              className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-600 transition-colors ${
                                barbeiroSelecionado === barbeiro.id
                                  ? "bg-gray-600"
                                  : ""
                              }`}
                              onClick={() => {
                                setBarbeiroSelecionado(barbeiro.id);
                                setSelectAberto(false);
                              }}
                              type="button"
                            >
                              {avatarUrl ? (
                                <img
                                  alt={barbeiro.nome}
                                  className="w-6 h-6 rounded-full object-cover border border-gray-500 flex-shrink-0"
                                  src={avatarUrl}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.nextElementSibling?.classList.remove(
                                      "hidden"
                                    );
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[10px] font-bold border border-gray-500 flex-shrink-0 ${
                                  avatarUrl ? "hidden" : ""
                                }`}
                              >
                                {getInitials(barbeiro.nome)}
                              </div>
                              <span className="flex-1">{getNomeSobrenome(barbeiro.nome)}</span>
                              {barbeiroSelecionado === barbeiro.id && (
                                <svg
                                  className="w-4 h-4 text-blue-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    d="M5 13l4 4L19 7"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                  />
                                </svg>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Grid de Agendamentos por Data */}
            {barbeiroSelecionado && (
              <div>
                {/* Mobile: Carrossel horizontal com scroll suave */}
                <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 snap-x snap-mandatory scroll-smooth touch-pan-x">
                  <div className="flex gap-3 min-w-max pb-1">
                    {dias.map((diaInfo, index) => {
                      const dataFormatada = formatarData(diaInfo.data);
                      const diaSemanaMap: Record<string, string> = {
                        DOMINGO: "Dom",
                        SEGUNDA: "Seg",
                        TERCA: "Ter",
                        QUARTA: "Qua",
                        QUINTA: "Qui",
                        SEXTA: "Sex",
                        SABADO: "Sáb",
                      };
                      const diaSemana = diaSemanaMap[diaInfo.diaSemana] || diaInfo.diaSemana;
                      const slots = gerarSlotsComAgendamentos(diaInfo.horario, diaInfo.data);
                      const { agendados, disponiveis } = contarHorariosPorData(
                        diaInfo.data,
                        diaInfo.horario
                      );

                      return (
                        <div
                          key={index}
                          className="bg-gray-800 rounded-lg p-2.5 border border-gray-700 flex-shrink-0 w-[calc(85vw-1.5rem)] snap-center"
                        >
                          <div className="text-white font-semibold mb-1.5 text-center text-sm">
                            {diaSemana} {dataFormatada}
                          </div>

                          {/* Estatísticas */}
                          <div className="flex justify-between items-center mb-2 text-[10px]">
                            <div className="flex items-center gap-0.5">
                              <span className="text-green-400 font-bold text-xs">●</span>
                              <span className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{disponiveis}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              <span className="text-red-400 font-bold text-xs">●</span>
                              <span className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{agendados}</span>
                            </div>
                          </div>

                          {diaInfo.horario && !diaInfo.horario.is_feriado ? (
                            <div className="space-y-1 max-h-[400px] overflow-y-auto">
                              {slots.map((slot, slotIndex) => {
                                if (slot.isSlotAlmoco) {
                                  return (
                                    <div
                                      key={slotIndex}
                                      className="py-1 px-1.5 rounded text-center text-[10px] font-medium transition-colors duration-300"
                                      style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                                    >
                                      Almoço: {slot.hora}
                                    </div>
                                  );
                                }

                                if (slot.agendamento) {
                                  return (
                                    <button
                                      key={slotIndex}
                                      className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-left p-1.5 rounded transition-all cursor-pointer"
                                      type="button"
                                      onClick={() => handleClickAgendamento(slot.agendamento!)}
                                    >
                                      <div className="text-red-400 font-semibold text-[10px] mb-0.5">
                                        {slot.hora}
                                      </div>
                                      <div className="text-[10px] font-medium mb-0.5 line-clamp-1 transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                                        {slot.agendamento.cliente?.nome || "Cliente não informado"}
                                      </div>
                                      {slot.agendamento.servicos && slot.agendamento.servicos.length > 0 && (
                                        <div className="text-[9px] line-clamp-1 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                                          {slot.agendamento.servicos.join(", ")}
                                        </div>
                                      )}
                                    </button>
                                  );
                                }

                                return (
                                  <div
                                    key={slotIndex}
                                    className="bg-green-500/20 text-green-400 py-1 px-1.5 rounded text-center text-[10px]"
                                  >
                                    {slot.hora} • Disp.
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-3">
                              <div className="text-red-400 font-semibold text-xs">FECHADO</div>
                              {diaInfo.horario?.is_feriado && (
                                <div className="text-[10px] mt-0.5 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>(Feriado)</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop: Grid tradicional */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {dias.map((diaInfo, index) => {
                    const dataFormatada = formatarData(diaInfo.data);
                    const diaSemanaMap: Record<string, string> = {
                      DOMINGO: "Dom",
                      SEGUNDA: "Seg",
                      TERCA: "Ter",
                      QUARTA: "Qua",
                      QUINTA: "Qui",
                      SEXTA: "Sex",
                      SABADO: "Sáb",
                    };
                    const diaSemana = diaSemanaMap[diaInfo.diaSemana] || diaInfo.diaSemana;
                    const slots = gerarSlotsComAgendamentos(diaInfo.horario, diaInfo.data);
                    const { agendados, disponiveis } = contarHorariosPorData(
                      diaInfo.data,
                      diaInfo.horario
                    );

                    return (
                      <div
                        key={index}
                        className="bg-gray-800 rounded-lg p-2.5 border border-gray-700"
                      >
                        <div className="text-white font-semibold mb-1.5 text-center text-sm">
                          {diaSemana} {dataFormatada}
                        </div>

                        {/* Estatísticas */}
                        <div className="flex justify-between items-center mb-2 text-[10px]">
                          <div className="flex items-center gap-0.5">
                            <span className="text-green-400 font-bold text-xs">●</span>
                            <span className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{disponiveis}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <span className="text-red-400 font-bold text-xs">●</span>
                            <span className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{agendados}</span>
                          </div>
                        </div>

                        {diaInfo.horario && !diaInfo.horario.is_feriado ? (
                          <div className="space-y-1 max-h-[400px] overflow-y-auto">
                            {slots.map((slot, slotIndex) => {
                              if (slot.isSlotAlmoco) {
                                return (
                                  <div
                                    key={slotIndex}
                                    className="py-1 px-1.5 rounded text-center text-[10px] font-medium transition-colors duration-300"
                                    style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                                  >
                                    Almoço: {slot.hora}
                                  </div>
                                );
                              }

                              if (slot.agendamento) {
                                return (
                                  <button
                                    key={slotIndex}
                                    className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-left p-1.5 rounded transition-all cursor-pointer"
                                    type="button"
                                    onClick={() => handleClickAgendamento(slot.agendamento!)}
                                  >
                                    <div className="text-red-400 font-semibold text-[10px] mb-0.5">
                                      {slot.hora}
                                    </div>
                                    <div className="text-[10px] font-medium mb-0.5 line-clamp-1 transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                                      {slot.agendamento.cliente?.nome || "Cliente não informado"}
                                    </div>
                                    {slot.agendamento.servicos && slot.agendamento.servicos.length > 0 && (
                                      <div className="text-[9px] line-clamp-1 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                                        {slot.agendamento.servicos.join(", ")}
                                      </div>
                                    )}
                                  </button>
                                );
                              }

                              return (
                                <div
                                  key={slotIndex}
                                  className="bg-green-500/20 text-green-400 py-1 px-1.5 rounded text-center text-[10px]"
                                >
                                  {slot.hora} • Disp.
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-3">
                            <div className="text-red-400 font-semibold text-xs">FECHADO</div>
                            {diaInfo.horario?.is_feriado && (
                              <div className="text-[10px] mt-0.5 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>(Feriado)</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legenda */}
            <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-semibold text-white mb-3">Legenda:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500/20 border border-green-500/50 rounded"></div>
                  <span className="text-gray-300 text-xs">Horário disponível</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500/20 border border-red-500/50 rounded"></div>
                  <span className="text-gray-300 text-xs">Horário agendado (clique para remarcar)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-700 rounded"></div>
                  <span className="text-gray-300 text-xs">Intervalo de almoço</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500/50 rounded"></div>
                  <span className="text-gray-300 text-xs">Dia fechado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Modal de Remarcação */}
      {modalRemarcarAberto && agendamentoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Remarcar Agendamento
              </h2>
              <button
                className="text-gray-400 hover:text-white transition-colors"
                onClick={fecharModal}
                type="button"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Informações do Agendamento Atual */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Agendamento Atual
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Cliente: </span>
                    <span className="text-white font-medium">
                      {agendamentoSelecionado.cliente?.nome || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Data: </span>
                    <span className="text-white font-medium">
                      {agendamentoSelecionado.data}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Horário: </span>
                    <span className="text-white font-medium">
                      {agendamentoSelecionado.horario}
                    </span>
                  </div>
                  {agendamentoSelecionado.servicos &&
                    agendamentoSelecionado.servicos.length > 0 && (
                      <div>
                        <span className="text-gray-400">Serviços: </span>
                        <span className="text-white font-medium">
                          {agendamentoSelecionado.servicos.join(", ")}
                        </span>
                      </div>
                    )}
                  <div>
                    <span className="text-gray-400">Valor: </span>
                    <span className="text-white font-medium">
                      R$ {agendamentoSelecionado.valor.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nova Data */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-300 mb-2"
                  htmlFor="nova-data"
                >
                  Nova Data:
                </label>
                <input
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  id="nova-data"
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setNovaData(e.target.value)}
                  type="date"
                  value={novaData}
                />
              </div>

              {/* Novo Barbeiro */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-300 mb-2"
                  htmlFor="novo-barbeiro"
                >
                  Novo Barbeiro:
                </label>
                <div className="relative">
                  <button
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center gap-2 text-left"
                    onClick={() =>
                      setSelectBarbeiroModalAberto(!selectBarbeiroModalAberto)
                    }
                    type="button"
                  >
                    {novoBarbeiro ? (
                      <>
                        {(() => {
                          const barbeiro = barbeirosAtivos.find(
                            (b) => b.id === novoBarbeiro
                          );
                          const avatarUrl = barbeiro
                            ? getAvatarUrl(barbeiro.avatar)
                            : null;

                          return (
                            <>
                              {avatarUrl ? (
                                <img
                                  alt={barbeiro?.nome || ""}
                                  className="w-6 h-6 rounded-full object-cover border border-gray-500 flex-shrink-0"
                                  src={avatarUrl}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.nextElementSibling?.classList.remove(
                                      "hidden"
                                    );
                                  }}
                                />
                              ) : null}
                              {(() => {
                                if (avatarUrl) return null;
                                
                                return (
                                  <img
                                    alt={barbeiro?.nome || ""}
                                    className="w-6 h-6 rounded-full object-cover border border-gray-500 flex-shrink-0"
                                    src={getDefaultBarberImage(barbeiro?.nome)}
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                );
                              })()}
                              <span className="flex-1">
                                {barbeiro?.nome ? getNomeSobrenome(barbeiro.nome) : "Selecione um barbeiro"}
                              </span>
                            </>
                          );
                        })()}
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            selectBarbeiroModalAberto ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M19 9l-7 7-7-7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                          />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-gray-400">
                          Selecione um barbeiro
                        </span>
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            selectBarbeiroModalAberto ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M19 9l-7 7-7-7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                          />
                        </svg>
                      </>
                    )}
                  </button>

                  {selectBarbeiroModalAberto && (
                    <>
                      <button
                        className="fixed inset-0 z-[60] bg-transparent border-0 cursor-default"
                        onClick={() => setSelectBarbeiroModalAberto(false)}
                        type="button"
                      />
                      <div className="absolute z-[70] w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {barbeirosAtivos.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-400">
                            Nenhum barbeiro ativo encontrado
                          </div>
                        ) : (
                          barbeirosAtivos.map((barbeiro) => {
                            const avatarUrl = getAvatarUrl(barbeiro.avatar);

                            return (
                              <button
                                key={barbeiro.id}
                                className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-600 transition-colors ${
                                  novoBarbeiro === barbeiro.id
                                    ? "bg-gray-600"
                                    : ""
                                }`}
                                onClick={() => {
                                  setNovoBarbeiro(barbeiro.id);
                                  setSelectBarbeiroModalAberto(false);
                                }}
                                type="button"
                              >
                                {avatarUrl ? (
                                  <img
                                    alt={barbeiro.nome}
                                    className="w-6 h-6 rounded-full object-cover border border-gray-500 flex-shrink-0"
                                    src={avatarUrl}
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      e.currentTarget.nextElementSibling?.classList.remove(
                                        "hidden"
                                      );
                                    }}
                                  />
                                ) : null}
                                <div
                                  className={`w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[10px] font-bold border border-gray-500 flex-shrink-0 ${
                                    avatarUrl ? "hidden" : ""
                                  }`}
                                >
                                  {getInitials(barbeiro.nome)}
                                </div>
                                <span className="flex-1">{getNomeSobrenome(barbeiro.nome)}</span>
                                {novoBarbeiro === barbeiro.id && (
                                  <svg
                                    className="w-4 h-4 text-blue-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      d="M5 13l4 4L19 7"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                    />
                                  </svg>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Novo Horário */}
              {novaData && novoBarbeiro && gerarHorariosDisponiveis.length > 0 && (
                <div>
                  <label
                    className="block text-sm font-medium text-gray-300 mb-2"
                    htmlFor="novo-horario"
                  >
                    Novo Horário:
                  </label>
                  <select
                    className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    id="novo-horario"
                    onChange={(e) => setNovoHorario(e.target.value)}
                    value={novoHorario}
                  >
                    <option value="">Selecione um horário</option>
                    {gerarHorariosDisponiveis.map((horario) => (
                      <option key={horario} value={horario}>
                        {horario}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {novaData && novoBarbeiro && gerarHorariosDisponiveis.length === 0 && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-sm text-yellow-300">
                  Não há horários disponíveis para esta data e barbeiro.
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  onClick={fecharModal}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    !novaData || !novoBarbeiro || !novoHorario || isRemarcando
                  }
                  onClick={handleRemarcar}
                  type="button"
                >
                  {isRemarcando ? "Remarcando..." : "Remarcar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
