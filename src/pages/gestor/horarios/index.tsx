import { Helmet } from "react-helmet-async";
import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  addToast,
  Switch,
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { PencilIcon, ArrowLeftIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usePermissions } from "@/hooks/usePermissions";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";
import { useAuth } from "@/contexts/AuthProvider/useAuth";
import {
  GetHorariosFuncionamento,
  UpdateHorarioFuncionamento,
  CreateHorarioExcecao,
  DeleteHorarioExcecao,
} from "@/contexts/ScheduleProvider/util";
import {
  IHorarioFuncionamento,
  IProfessionals,
} from "@/contexts/ScheduleProvider/types";

interface HorarioFormData {
  horario_abertura: string;
  horario_fechamento: string;
  tem_almoco: boolean;
  horario_almoco_inicio?: string;
  horario_almoco_fim?: string;
  is_feriado: boolean;
  profissionais_ids: string[];
}

const DIAS_SEMANA = [
  { value: "SEGUNDA", label: "Segunda-feira", short: "Seg" },
  { value: "TERCA", label: "Terça-feira", short: "Ter" },
  { value: "QUARTA", label: "Quarta-feira", short: "Qua" },
  { value: "QUINTA", label: "Quinta-feira", short: "Qui" },
  { value: "SEXTA", label: "Sexta-feira", short: "Sex" },
  { value: "SABADO", label: "Sábado", short: "Sáb" },
  { value: "DOMINGO", label: "Domingo", short: "Dom" },
] as const;

// Função para gerar opções de horário em intervalos de 30 minutos
function gerarOpcoesHorario(): string[] {
  const horarios: string[] = [];

  for (let hora = 0; hora < 24; hora++) {
    for (let minuto = 0; minuto < 60; minuto += 30) {
      const horaStr = String(hora).padStart(2, "0");
      const minutoStr = String(minuto).padStart(2, "0");

      horarios.push(`${horaStr}:${minutoStr}`);
    }
  }

  return horarios;
}

// Função para calcular a segunda-feira da semana atual ou próxima
function calcularSegundaFeiraSemana(
  semana: "atual" | "proxima" = "atual"
): Date {
  const hoje = new Date();
  const diaAtual = hoje.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

  let diasParaSegunda = 0;

  if (semana === "proxima") {
    // Para próxima semana, sempre calcula a segunda-feira da próxima semana
    if (diaAtual === 0) {
      // Se for domingo, próxima segunda é em 8 dias
      diasParaSegunda = 8;
    } else {
      // Para outros dias, calcula quantos dias faltam para a próxima segunda
      diasParaSegunda = 8 - diaAtual;
    }
  } else {
    // Para semana atual
    if (diaAtual === 0) {
      // Se for domingo, mostra a próxima segunda (1 dia)
      diasParaSegunda = 1;
    } else {
      // Se for segunda a sábado, calcula quantos dias atrás está a segunda-feira da semana atual
      diasParaSegunda = 1 - diaAtual;
    }
  }

  const segundaFeira = new Date(hoje);

  segundaFeira.setDate(hoje.getDate() + diasParaSegunda);
  segundaFeira.setHours(0, 0, 0, 0); // Zera horas para evitar problemas de timezone

  return segundaFeira;
}

// Função para calcular a data de um dia da semana específico
function calcularDataDoDia(
  diaSemana: string,
  semana: "atual" | "proxima" = "atual"
): {
  dia: number;
  mes: number;
  ano: number;
} {
  const segundaFeira = calcularSegundaFeiraSemana(semana);

  // Mapeia o dia da semana para número (0 = segunda, 1 = terça, ..., 6 = domingo)
  const diasMap: Record<string, number> = {
    SEGUNDA: 0,
    TERCA: 1,
    QUARTA: 2,
    QUINTA: 3,
    SEXTA: 4,
    SABADO: 5,
    DOMINGO: 6,
  };

  const diaOffset = diasMap[diaSemana] ?? 0;

  // Cria a data do dia específico a partir da segunda-feira
  const dataDoDia = new Date(segundaFeira);

  dataDoDia.setDate(segundaFeira.getDate() + diaOffset);

  return {
    dia: dataDoDia.getDate(),
    mes: dataDoDia.getMonth() + 1,
    ano: dataDoDia.getFullYear(),
  };
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
function getAvatarUrl(avatar: string | undefined): string | null {
  if (!avatar) return null;

  // Se o avatar já é base64, retorna diretamente
  if (avatar.startsWith("data:image")) {
    return avatar;
  }

  const apiUrl = import.meta.env.VITE_API;

  if (!apiUrl) return null;

  return `${apiUrl}/barbeiros/avatar/${encodeURIComponent(avatar)}`;
}

// Função para calcular horários disponíveis
function calcularHorariosDisponiveis(
  abertura: string,
  fechamento: string,
  temAlmoco: boolean,
  inicioAlmoco?: string,
  fimAlmoco?: string,
  duracaoServico: number = 30,
  quantidadeBarbeiros: number = 1
): number {
  if (!abertura || !fechamento) return 0;

  // Converte horários para minutos do dia
  const [horaAbertura, minutoAbertura] = abertura.split(":").map(Number);
  const [horaFechamento, minutoFechamento] = fechamento.split(":").map(Number);

  const minutosAbertura = horaAbertura * 60 + minutoAbertura;
  const minutosFechamento = horaFechamento * 60 + minutoFechamento;

  if (minutosAbertura >= minutosFechamento) return 0;

  let tempoDisponivel = minutosFechamento - minutosAbertura;

  // Subtrai intervalo de almoço se houver
  if (temAlmoco && inicioAlmoco && fimAlmoco) {
    const [horaInicioAlmoco, minutoInicioAlmoco] = inicioAlmoco
      .split(":")
      .map(Number);
    const [horaFimAlmoco, minutoFimAlmoco] = fimAlmoco.split(":").map(Number);

    const minutosInicioAlmoco = horaInicioAlmoco * 60 + minutoInicioAlmoco;
    const minutosFimAlmoco = horaFimAlmoco * 60 + minutoFimAlmoco;

    if (
      minutosInicioAlmoco >= minutosAbertura &&
      minutosFimAlmoco <= minutosFechamento
    ) {
      tempoDisponivel -= minutosFimAlmoco - minutosInicioAlmoco;
    }
  }

  // Divide pela duração do serviço e multiplica pela quantidade de barbeiros
  const slotsPorBarbeiro = Math.floor(tempoDisponivel / duracaoServico);

  return slotsPorBarbeiro * quantidadeBarbeiros;
}

const schema = yup.object().shape({
  horario_abertura: yup.string().required("Horário de abertura é obrigatório"),
  horario_fechamento: yup
    .string()
    .required("Horário de fechamento é obrigatório")
    .test(
      "horario-valido",
      "Horário de fechamento deve ser maior que horário de abertura",
      function (value) {
        const { horario_abertura } = this.parent;

        if (!horario_abertura || !value) return true;

        const [horaAbertura, minutoAbertura] = horario_abertura
          .split(":")
          .map(Number);
        const [horaFechamento, minutoFechamento] = value.split(":").map(Number);

        const minutosAbertura = horaAbertura * 60 + minutoAbertura;
        const minutosFechamento = horaFechamento * 60 + minutoFechamento;

        return minutosFechamento > minutosAbertura;
      }
    ),
  tem_almoco: yup.boolean().required(),
  horario_almoco_inicio: yup.string().when("tem_almoco", {
    is: true,
    then: (schema) =>
      schema.required("Horário de início do almoço é obrigatório"),
    otherwise: (schema) => schema.notRequired(),
  }),
  horario_almoco_fim: yup.string().when("tem_almoco", {
    is: true,
    then: (schema) =>
      schema
        .required("Horário de fim do almoço é obrigatório")
        .test(
          "almoco-valido",
          "Horário de fim do almoço deve ser maior que horário de início",
          function (value) {
            const { horario_almoco_inicio } = this.parent;

            if (!horario_almoco_inicio || !value) return true;

            const [horaInicio, minutoInicio] = horario_almoco_inicio
              .split(":")
              .map(Number);
            const [horaFim, minutoFim] = value.split(":").map(Number);

            const minutosInicio = horaInicio * 60 + minutoInicio;
            const minutosFim = horaFim * 60 + minutoFim;

            return minutosFim > minutosInicio;
          }
        ),
    otherwise: (schema) => schema.notRequired(),
  }),
  is_feriado: yup.boolean().required(),
  profissionais_ids: yup
    .array()
    .of(yup.string().required())
    .required()
    .test(
      "profissionais-requeridos",
      "Selecione pelo menos um barbeiro (exceto se for feriado)",
      function (value) {
        const { is_feriado } = this.parent;

        if (is_feriado) return true;

        return value && value.length > 0;
      }
    ),
});

/**
 * Página de Gerenciamento de Horários de Funcionamento - Apenas para Gestores
 *
 * Funcionalidades:
 * - Listar horários de funcionamento por dia da semana
 * - Adicionar/Editar horário de funcionamento
 * - Configurar intervalo de almoço
 * - Selecionar barbeiros por dia
 * - Marcar dias como feriado
 * - Calcular e exibir horários disponíveis
 */
export function GestorHorariosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isGestor } = usePermissions();
  const { professionals, fetchProfessionals } = useSchedule();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [horarios, setHorarios] = useState<IHorarioFuncionamento[]>([]);
  const [selectedDia, setSelectedDia] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estado para controlar qual aba está ativa
  const [abaAtiva, setAbaAtiva] = useState<"padrao" | "excecoes" | "cliente">("padrao");
  
  // Estado para controlar qual semana está sendo visualizada (apenas para aba Padrão Semanal)
  // Se hoje for domingo e não houver atendimento, inicia com "proxima", caso contrário "atual"
  const hoje = new Date();
  const diaAtual = hoje.getDay();
  const [semanaSelecionada, setSemanaSelecionada] = useState<
    "atual" | "proxima"
  >(diaAtual === 0 ? "proxima" : "atual");
  
  // Estado para o calendário (aba Exceções)
  const [mesCalendario, setMesCalendario] = useState(new Date().getMonth());
  const [anoCalendario, setAnoCalendario] = useState(new Date().getFullYear());
  
  // Estado para controlar se está criando ou editando exceção
  const [isCriandoExcecao, setIsCriandoExcecao] = useState(false);
  const [dataSelecionadaExcecao, setDataSelecionadaExcecao] = useState<Date | null>(null);

  const opcoesHorario = gerarOpcoesHorario();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<HorarioFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      horario_abertura: "",
      horario_fechamento: "",
      tem_almoco: false,
      horario_almoco_inicio: "",
      horario_almoco_fim: "",
      is_feriado: false,
      profissionais_ids: [],
    },
  });

  const temAlmoco = watch("tem_almoco");
  const isFeriado = watch("is_feriado");
  const horarioAbertura = watch("horario_abertura");
  const horarioFechamento = watch("horario_fechamento");
  const horarioAlmocoInicio = watch("horario_almoco_inicio");
  const horarioAlmocoFim = watch("horario_almoco_fim");
  const profissionaisIds = watch("profissionais_ids");

  // Calcular horários disponíveis em tempo real
  const quantidadeBarbeiros = isFeriado ? 0 : profissionaisIds?.length || 0;
  const horariosDisponiveis =
    quantidadeBarbeiros === 0
      ? 0
      : calcularHorariosDisponiveis(
          horarioAbertura || "",
          horarioFechamento || "",
          temAlmoco || false,
          horarioAlmocoInicio,
          horarioAlmocoFim,
          30,
          quantidadeBarbeiros
        );

  // Função para enriquecer horários com dados completos dos profissionais
  // Prioriza os dados que já vêm da API
  const enriquecerHorariosComProfissionais = (
    horarios: IHorarioFuncionamento[]
  ): IHorarioFuncionamento[] => {
    return horarios.map((horario) => {
      // Se não há profissionais no horário, retorna como está
      if (!horario.profissionais || horario.profissionais.length === 0) {
        return horario;
      }

      // Enriquecer profissionais - prioriza dados da API
      const profissionaisEnriquecidos = horario.profissionais
        .map((prof: any) => {
          // Se a API já retornou nome e função, usa diretamente
          if (prof.nome && prof.funcao && prof.id) {
            // Tenta enriquecer apenas com avatar se não tiver
            if (!prof.avatar && professionals.length > 0) {
              const profissionalCompleto = professionals.find(
                (p) => p.id === prof.id
              );
              if (profissionalCompleto?.avatar) {
                return {
                  ...prof,
                  avatar: profissionalCompleto.avatar,
                };
              }
            }
            // Retorna os dados da API como estão
            return prof as IProfessionals;
          }

          // Se não tem dados completos, tenta buscar na lista de professionals
          const profissionalCompleto = professionals.find(
            (p) =>
              p.id === prof.id ||
              p.id === prof.id_profissional ||
              p.id === prof.profissional_id
          );

          if (profissionalCompleto) {
            return profissionalCompleto;
          }

          // Se não encontrou mas tem ID, retorna como está
          if (prof.id) {
            return prof as IProfessionals;
          }

          return null;
        })
        .filter((p) => p !== undefined && p !== null) as IProfessionals[];

      return {
        ...horario,
        profissionais: profissionaisEnriquecidos,
      };
    });
  };

  // Função para buscar horários de funcionamento
  const fetchHorarios = async () => {
    try {
      setIsLoading(true);
      const barbeariaId = user?.user?.barbeariaId;

      if (!barbeariaId) {
        throw new Error("ID da barbearia não encontrado");
      }

      const response = await GetHorariosFuncionamento(barbeariaId);

      // A API retorna os dados em hoursFunctionment
      const horariosDaAPI =
        response.hoursFunctionment || response.horarios || response || [];
      setHorarios(Array.isArray(horariosDaAPI) ? horariosDaAPI : []);
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
      addToast({
        title: "Erro",
        description: "Falha ao carregar horários de funcionamento.",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isGestor) {
      fetchProfessionals();
      fetchHorarios();
    }
  }, [isGestor]);

  // Enriquecer horários com dados completos dos profissionais usando useMemo
  const horariosEnriquecidos = useMemo(() => {
    if (horarios.length === 0) {
      return horarios;
    }
    // Sempre tenta enriquecer, mesmo se professionals ainda não foram carregados
    // (a API pode já ter retornado os dados completos)
    return enriquecerHorariosComProfissionais(horarios);
  }, [horarios, professionals]);

  // Função para obter horário de um dia específico baseado na semana selecionada
  // Lógica: Sempre usa PADRAO como base, só usa EXCECAO se houver data_excecao correspondente
  const getHorarioByDia = (
    dia: string,
    semana: "atual" | "proxima" = semanaSelecionada
  ): IHorarioFuncionamento | undefined => {
    // Calcula a data do dia na semana selecionada
    const dataDoDia = calcularDataDoDia(dia, semana);
    const dataCalculada = new Date(
      dataDoDia.ano,
      dataDoDia.mes - 1,
      dataDoDia.dia,
      0,
      0,
      0,
      0
    );
    dataCalculada.setHours(0, 0, 0, 0);

    // Busca todos os horários para esse dia da semana
    const horariosDoDia = horariosEnriquecidos.filter(
      (h) => h.dia_da_semana === dia
    );

    if (horariosDoDia.length === 0) {
      return undefined;
    }

    // Primeiro, procura por EXCECAO que corresponda exatamente à data calculada
    const excecaoEncontrada = horariosDoDia.find((h) => {
      if (h.tipo_regra === "EXCECAO" && h.data_excecao) {
        const dataExcecao = new Date(h.data_excecao);
        dataExcecao.setHours(0, 0, 0, 0);
        // Compara apenas dia, mês e ano
        return (
          dataExcecao.getDate() === dataCalculada.getDate() &&
          dataExcecao.getMonth() === dataCalculada.getMonth() &&
          dataExcecao.getFullYear() === dataCalculada.getFullYear()
        );
      }
      return false;
    });

    // Se encontrou exceção para essa data específica, retorna ela
    if (excecaoEncontrada) {
      return excecaoEncontrada;
    }

    // Caso contrário, sempre retorna o PADRAO (regra padrão)
    // A próxima semana segue a mesma regra padrão da atual
    const padrao = horariosDoDia.find((h) => h.tipo_regra === "PADRAO");
    if (padrao) {
      return padrao;
    }

    // Fallback: retorna o primeiro horário encontrado
    return horariosDoDia[0];
  };

  // Função para verificar se há mudanças no horário (comparando EXCECAO com PADRAO)
  const temMudancasNoHorario = (
    horarioExcecao: IHorarioFuncionamento | undefined,
    horarioPadrao: IHorarioFuncionamento | undefined
  ): boolean => {
    if (!horarioExcecao || !horarioPadrao) {
      return false;
    }

    // Compara IDs dos profissionais
    const idsExcecao = horarioExcecao.profissionais?.map((p) => p.id).sort() || [];
    const idsPadrao = horarioPadrao.profissionais?.map((p) => p.id).sort() || [];

    // Compara os campos principais do horário
    return (
      horarioExcecao.horario_abertura !== horarioPadrao.horario_abertura ||
      horarioExcecao.horario_fechamento !== horarioPadrao.horario_fechamento ||
      horarioExcecao.tem_almoco !== horarioPadrao.tem_almoco ||
      horarioExcecao.horario_almoco_inicio !==
        horarioPadrao.horario_almoco_inicio ||
      horarioExcecao.horario_almoco_fim !== horarioPadrao.horario_almoco_fim ||
      horarioExcecao.is_feriado !== horarioPadrao.is_feriado ||
      JSON.stringify(idsExcecao) !== JSON.stringify(idsPadrao)
    );
  };

  // Função para obter apenas exceções (tipo_regra === "EXCECAO")
  const excecoes = useMemo(() => {
    return horariosEnriquecidos.filter((h) => h.tipo_regra === "EXCECAO");
  }, [horariosEnriquecidos]);

  // Função para verificar se uma data é passada
  const isDataPassada = (data: { dia: number; mes: number; ano: number }): boolean => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataComparar = new Date(data.ano, data.mes - 1, data.dia);
    dataComparar.setHours(0, 0, 0, 0);
    return dataComparar < hoje;
  };

  // Função para verificar se domingo tem atendimento (não é feriado)
  const domingoTemAtendimento = (): boolean => {
    const horarioDomingo = getHorarioByDia("DOMINGO", "atual");
    return horarioDomingo ? !horarioDomingo.is_feriado : false;
  };

  // Função para gerar dias do calendário
  const gerarDiasCalendario = (mes: number, ano: number) => {
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaInicioSemana = primeiroDia.getDay();

    const dias: Array<{ dia: number; mes: number; ano: number; data: Date } | null> = [];

    // Preencher dias vazios do início
    for (let i = 0; i < diaInicioSemana; i++) {
      dias.push(null);
    }

    // Adicionar dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = new Date(ano, mes, dia);
      dias.push({
        dia,
        mes: mes + 1,
        ano,
        data,
      });
    }

    return dias;
  };

  // Função para obter exceção de uma data específica
  const getExcecaoPorData = (data: Date): IHorarioFuncionamento | undefined => {
    return excecoes.find((excecao) => {
      if (!excecao.data_excecao) return false;
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

  // Função para gerar próximos 6 dias (para Visão do Cliente)
  const gerarProximos6Dias = () => {
    const dias: Array<{ data: Date; diaSemana: string; horario?: IHorarioFuncionamento }> = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    let diasAdicionados = 0;
    let i = 0;

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
        // Se não houver exceção, pula o domingo mas continua contando
      } else {
        // Para outros dias, busca horário (exceção ou padrão)
        const excecao = getExcecaoPorData(data);
        const horarioPadrao = horariosEnriquecidos.find(
          (h) => h.dia_da_semana === diaSemana && h.tipo_regra === "PADRAO"
        );
        dias.push({ data, diaSemana, horario: excecao || horarioPadrao });
        diasAdicionados++;
      }
      
      i++;
    }

    return dias;
  };

  // Função para gerar slots de horário
  const gerarSlotsHorario = (
    horario: IHorarioFuncionamento | undefined
  ): Array<{ hora: string; disponivel: boolean; isAlmoco: boolean }> => {
    if (!horario || horario.is_feriado) {
      return [];
    }

    const slots: Array<{ hora: string; disponivel: boolean; isAlmoco: boolean }> = [];
    const [horaAbertura, minutoAbertura] = horario.horario_abertura.split(":").map(Number);
    const [horaFechamento, minutoFechamento] = horario.horario_fechamento.split(":").map(Number);

    let horaAtual = horaAbertura;
    let minutoAtual = minutoAbertura;

    while (horaAtual < horaFechamento || (horaAtual === horaFechamento && minutoAtual < minutoFechamento)) {
      const horaStr = `${String(horaAtual).padStart(2, "0")}:${String(minutoAtual).padStart(2, "0")}`;
      
      // Verifica se está no intervalo de almoço
      const isAlmoco = horario.tem_almoco &&
        horario.horario_almoco_inicio &&
        horario.horario_almoco_fim &&
        horaStr >= horario.horario_almoco_inicio &&
        horaStr < horario.horario_almoco_fim;

      slots.push({
        hora: horaStr,
        disponivel: !isAlmoco,
        isAlmoco: !!isAlmoco,
      });

      // Avança 30 minutos
      minutoAtual += 30;
      if (minutoAtual >= 60) {
        minutoAtual = 0;
        horaAtual++;
      }
    }

    return slots;
  };

  // Função para abrir modal de edição (Padrão Semanal)
  const handleOpenModal = (dia: string) => {
    setSelectedDia(dia);
    setIsCriandoExcecao(false);
    setDataSelecionadaExcecao(null);
    const horarioExistente = getHorarioByDia(dia);

    if (!horarioExistente) {
      addToast({
        title: "Aviso",
        description: "Horário não encontrado. É necessário criar o horário primeiro.",
        color: "warning",
        timeout: 3000,
      });
      return;
    }

    // Usa apenas os valores retornados da API, sem valores padrão
    reset({
      horario_abertura: horarioExistente.horario_abertura || "",
      horario_fechamento: horarioExistente.horario_fechamento || "",
      tem_almoco: horarioExistente.tem_almoco ?? false,
      horario_almoco_inicio: horarioExistente.horario_almoco_inicio || "",
      horario_almoco_fim: horarioExistente.horario_almoco_fim || "",
      is_feriado: horarioExistente.is_feriado || false,
      profissionais_ids:
        horarioExistente.profissionais?.map((p) => p.id) || [],
    });
    onOpen();
  };

  // Função para abrir modal de criação de exceção (Exceções por data)
  const handleOpenModalExcecao = (data: Date, excecaoExistente?: IHorarioFuncionamento) => {
    setDataSelecionadaExcecao(data);
    setIsCriandoExcecao(!excecaoExistente);
    
    if (excecaoExistente) {
      // Editar exceção existente
      reset({
        horario_abertura: excecaoExistente.horario_abertura || "",
        horario_fechamento: excecaoExistente.horario_fechamento || "",
        tem_almoco: excecaoExistente.tem_almoco ?? false,
        horario_almoco_inicio: excecaoExistente.horario_almoco_inicio || "",
        horario_almoco_fim: excecaoExistente.horario_almoco_fim || "",
        is_feriado: excecaoExistente.is_feriado || false,
        profissionais_ids: excecaoExistente.profissionais?.map((p) => p.id) || [],
      });
      setSelectedDia(excecaoExistente.dia_da_semana);
    } else {
      // Criar nova exceção - busca o padrão do dia da semana
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
      setSelectedDia(diaSemana);
      
      const horarioPadrao = horariosEnriquecidos.find(
        (h) => h.dia_da_semana === diaSemana && h.tipo_regra === "PADRAO"
      );

      if (horarioPadrao) {
        reset({
          horario_abertura: horarioPadrao.horario_abertura || "",
          horario_fechamento: horarioPadrao.horario_fechamento || "",
          tem_almoco: horarioPadrao.tem_almoco ?? false,
          horario_almoco_inicio: horarioPadrao.horario_almoco_inicio || "",
          horario_almoco_fim: horarioPadrao.horario_almoco_fim || "",
          is_feriado: horarioPadrao.is_feriado || false,
          profissionais_ids: horarioPadrao.profissionais?.map((p) => p.id) || [],
        });
      } else {
        reset({
          horario_abertura: "",
          horario_fechamento: "",
          tem_almoco: false,
          horario_almoco_inicio: "",
          horario_almoco_fim: "",
          is_feriado: false,
          profissionais_ids: [],
        });
      }
    }
    
    onOpen();
  };

  // Função para deletar exceção
  const handleDeleteExcecao = async (excecaoId: string) => {
    try {
      await DeleteHorarioExcecao(excecaoId);
      addToast({
        title: "Sucesso",
        description: "Exceção removida com sucesso!",
        color: "success",
        timeout: 3000,
      });
      await fetchHorarios();
    } catch (error) {
      console.error("Erro ao deletar exceção:", error);
      addToast({
        title: "Erro",
        description: "Falha ao remover exceção. Tente novamente.",
        color: "danger",
        timeout: 5000,
      });
    }
  };

  const handleCloseModal = () => {
    setSelectedDia(null);
    setIsCriandoExcecao(false);
    setDataSelecionadaExcecao(null);
    reset();
    onClose();
  };

  // Função para submeter formulário
  const onSubmit = async (data: HorarioFormData) => {
    try {
      setIsSubmitting(true);
      const barbeariaId = user?.user?.barbeariaId;

      if (!barbeariaId) {
        addToast({
          title: "Erro",
          description: "ID da barbearia não encontrado.",
          color: "danger",
          timeout: 3000,
        });
        return;
      }

      if (!selectedDia) {
        addToast({
          title: "Erro",
          description: "Dia da semana não selecionado.",
          color: "danger",
          timeout: 3000,
        });
        return;
      }

      // Se está criando exceção (aba Exceções por data)
      if (isCriandoExcecao && dataSelecionadaExcecao) {
        const dataExcecaoISO = dataSelecionadaExcecao.toISOString();
        
        const payload = {
          id_barbearia: barbeariaId,
          dia_da_semana: selectedDia,
          horario_abertura: data.horario_abertura,
          horario_fechamento: data.horario_fechamento,
          tem_almoco: data.tem_almoco,
          horario_almoco_inicio: data.tem_almoco
            ? data.horario_almoco_inicio
            : undefined,
          horario_almoco_fim: data.tem_almoco
            ? data.horario_almoco_fim
            : undefined,
          is_feriado: data.is_feriado,
          profissionais_ids: data.is_feriado ? [] : data.profissionais_ids,
          tipo_regra: "EXCECAO" as const,
          data_excecao: dataExcecaoISO,
        };

        await CreateHorarioExcecao(payload);
        
        addToast({
          title: "Sucesso",
          description: "Exceção criada com sucesso!",
          color: "success",
          timeout: 3000,
        });
      } else {
        // Atualizar horário (Padrão Semanal ou editar exceção)
        let horarioExistente: IHorarioFuncionamento | undefined;
        
        if (dataSelecionadaExcecao) {
          // Editando exceção existente
          horarioExistente = getExcecaoPorData(dataSelecionadaExcecao);
        } else {
          // Editando padrão semanal
          horarioExistente = getHorarioByDia(selectedDia);
        }

        if (!horarioExistente?.id) {
          addToast({
            title: "Erro",
            description: "Horário não encontrado.",
            color: "danger",
            timeout: 3000,
          });
          return;
        }

        // Calcula a data do dia selecionado
        let dataExcecaoISO: string;
        if (dataSelecionadaExcecao) {
          dataExcecaoISO = dataSelecionadaExcecao.toISOString();
        } else {
          // Usa semana atual ou próxima se for domingo sem atendimento
          const hojeDate = new Date();
          const hojeDiaSemana = hojeDate.getDay();
          const semanaParaUsar = (hojeDiaSemana === 0 && !domingoTemAtendimento()) ? "proxima" : "atual";
          const dataDoDia = calcularDataDoDia(selectedDia, semanaParaUsar);
          const dataExcecao = new Date(
            dataDoDia.ano,
            dataDoDia.mes - 1,
            dataDoDia.dia,
            0,
            0,
            0,
            0
          );
          dataExcecaoISO = dataExcecao.toISOString();
        }

        const payload = {
          id_barbearia: barbeariaId,
          dia_da_semana: selectedDia,
          horario_abertura: data.horario_abertura,
          horario_fechamento: data.horario_fechamento,
          tem_almoco: data.tem_almoco,
          horario_almoco_inicio: data.tem_almoco
            ? data.horario_almoco_inicio
            : undefined,
          horario_almoco_fim: data.tem_almoco
            ? data.horario_almoco_fim
            : undefined,
          is_feriado: data.is_feriado,
          profissionais_ids: data.is_feriado ? [] : data.profissionais_ids,
          tipo_regra: dataSelecionadaExcecao ? ("EXCECAO" as const) : ("EXCECAO" as const),
          data_excecao: dataExcecaoISO,
        };

        await UpdateHorarioFuncionamento({
          id: horarioExistente.id,
          ...payload,
        });

        addToast({
          title: "Sucesso",
          description: "Horário atualizado com sucesso!",
          color: "success",
          timeout: 3000,
        });
      }

      await fetchHorarios();
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao salvar horário:", error);
      addToast({
        title: "Erro",
        description: "Falha ao salvar horário. Tente novamente.",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isGestor) {
    return (
      <section className="min-h-screen bg-gray-800 flex flex-col text-white items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
        <p className="text-gray-400">
          Apenas gestores podem acessar esta página.
        </p>
      </section>
    );
  }

  // Filtrar apenas barbeiros ativos (função Barbeiro ou Barbeiros)
  const barbeirosAtivos = professionals.filter(
    (p) =>
      (p.status === "ATIVO" || p.status === "ativo") &&
      (p.funcao === "Barbeiro" || p.funcao === "Barbeiros")
  );

  return (
    <section className="min-h-screen bg-gray-800 flex flex-col text-white">
      <Header />

      <div className="px-4 py-8 md:px-8 flex-1">
        <Helmet title="Gerenciar Horários - Gestor" />

        <div className="mx-auto max-w-6xl">
          {/* Botão Voltar */}
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
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-lg mb-6 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0">
              <img
                alt="Horários"
                className="w-full h-full object-cover object-right-center opacity-15"
                src="/image-1.png"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-blue-700/90 to-blue-800/90" />
            </div>

            <div className="relative z-10 p-4 md:p-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-medium text-white mb-1">
                    Gerenciar Horários de Funcionamento
                  </h1>
                  <p className="text-white/80 text-xs md:text-sm font-light">
                    Configure os horários de funcionamento da sua barbearia
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Abas de Navegação */}
          <div className="bg-gray-900 rounded-lg p-2 mb-6 border border-gray-700">
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  abaAtiva === "padrao"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                type="button"
                onClick={() => setAbaAtiva("padrao")}
              >
                Padrão Semanal
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  abaAtiva === "excecoes"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                type="button"
                onClick={() => setAbaAtiva("excecoes")}
              >
                Exceções por data
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  abaAtiva === "cliente"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                type="button"
                onClick={() => setAbaAtiva("cliente")}
              >
                Visão do Cliente
              </button>
            </div>
          </div>

          {/* Conteúdo das Abas */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Carregando horários...</p>
            </div>
          ) : (
            <>
              {/* Aba: Padrão Semanal */}
              {abaAtiva === "padrao" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {DIAS_SEMANA.map((dia) => {
                const horario = getHorarioByDia(dia.value);
                
                // Busca o horário PADRAO para comparação
                const horariosDoDia = horariosEnriquecidos.filter(
                  (h) => h.dia_da_semana === dia.value
                );
                const horarioPadrao = horariosDoDia.find(
                  (h) => h.tipo_regra === "PADRAO"
                );
                
                // Verifica se há mudanças no horário (só mostra badge se houver diferenças)
                const temMudancas =
                  horario?.tipo_regra === "EXCECAO" &&
                  horarioPadrao &&
                  temMudancasNoHorario(horario, horarioPadrao);

                // Calcula a data baseado na semana (atual ou próxima se for domingo sem atendimento)
                const hojeDate = new Date();
                const hojeDiaSemana = hojeDate.getDay();
                const semanaParaUsar = (hojeDiaSemana === 0 && !domingoTemAtendimento()) ? "proxima" : "atual";
                const dataDoDia = calcularDataDoDia(
                  dia.value,
                  semanaParaUsar
                );
                const dataFormatada = `${String(dataDoDia.dia).padStart(2, "0")}/${String(dataDoDia.mes).padStart(2, "0")}/${dataDoDia.ano}`;

                const hojeFormatado = `${String(hojeDate.getDate()).padStart(2, "0")}/${String(hojeDate.getMonth() + 1).padStart(2, "0")}/${hojeDate.getFullYear()}`;
                const isHoje = dataFormatada === hojeFormatado;
                const isPassado = isDataPassada(dataDoDia);

                return (
                  <Card
                    key={dia.value}
                    className={`${isPassado ? "bg-gray-800/50 opacity-60" : "bg-gray-900"} border ${
                      horario?.is_feriado
                        ? "border-red-500/50"
                        : isHoje
                          ? "border-blue-500"
                          : "border-gray-700"
                    } transition-all duration-200 hover:border-blue-500`}
                  >
                    <CardBody className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white">
                              {dia.label}
                            </h3>
                            {isHoje && (
                              <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded">
                                Hoje
                              </span>
                            )}
                            {horario?.is_feriado && (
                              <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded">
                                Fechado
                              </span>
                            )}
                            {temMudancas && (
                              <span className="px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded">
                                Exceção
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {dataFormatada}
                          </p>
                        </div>
                        <Button
                          color="primary"
                          size="sm"
                          startContent={<PencilIcon className="w-3 h-3 text-white" />}
                          variant="flat"
                          onPress={() => handleOpenModal(dia.value)}
                          className="text-white"
                        >
                          {horario ? "Editar" : "Config"}
                        </Button>
                      </div>

                      {horario ? (
                        <div className="space-y-3 text-xs">
                          {/* Horário de Funcionamento - Não exibir se for feriado */}
                          {!horario.is_feriado && (
                            <div className="bg-gray-800/50 rounded-lg p-2.5 border border-gray-700/50">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-gray-400 text-[10px] uppercase tracking-wide">
                                  Horário de Funcionamento
                            </span>
                          </div>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400 font-bold text-base">
                                {horario.horario_abertura || "N/A"}
                                </span>
                              <span className="text-gray-500">-</span>
                              <span className="text-blue-400 font-bold text-base">
                                {horario.horario_fechamento || "N/A"}
                            </span>
                            </div>
                          </div>
                          )}

                          {/* Lista de Barbeiros - Não exibir se for feriado */}
                          {!horario.is_feriado && (
                            <div className="pt-2 border-t border-gray-700">
                              <span className="text-gray-400 block mb-2 text-[10px] uppercase tracking-wide">
                                Barbeiros{" "}
                          {horario.profissionais &&
                              horario.profissionais.length > 0
                                ? `(${horario.profissionais.length})`
                                : "(0)"}
                                </span>
                            {horario.profissionais &&
                            horario.profissionais.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {horario.profissionais.map((profissional) => {
                                  const avatarUrl = getAvatarUrl(
                                    profissional.avatar
                                  );

                                  return (
                                    <div
                                      key={profissional.id}
                                      className="flex items-center gap-1.5 bg-gray-800 rounded-lg px-2 py-1.5 border border-gray-700/50 hover:border-blue-500/50 transition-colors"
                                    >
                                      {/* Avatar do Barbeiro */}
                                      {avatarUrl ? (
                                        <img
                                          alt={profissional.nome}
                                          className="w-7 h-7 rounded-full object-cover border-2 border-gray-600 flex-shrink-0"
                                          src={avatarUrl}
                                          onError={(e) => {
                                            e.currentTarget.style.display =
                                              "none";
                                            const fallback =
                                              e.currentTarget.nextElementSibling;
                                            if (fallback) {
                                              fallback.classList.remove("hidden");
                                            }
                                          }}
                                        />
                                      ) : null}
                                      <div
                                        className={`w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold border-2 border-gray-600 flex-shrink-0 ${
                                          avatarUrl ? "hidden" : ""
                                        }`}
                                      >
                                        {getInitials(profissional.nome)}
                                      </div>
                                      <span className="text-white text-xs font-medium truncate max-w-[100px]">
                                        {profissional.nome}
                                </span>
                              </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-[10px] italic">
                                Nenhum barbeiro atribuído
                              </p>
                            )}
                          </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <p className="text-gray-400 text-xs">
                            Não configurado
                          </p>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
                </div>
              )}

              {/* Aba: Exceções por data */}
              {abaAtiva === "excecoes" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Calendário */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Calendário</h3>
                      <div className="flex items-center gap-2">
                        <button
                          className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
                          onClick={() => {
                            if (mesCalendario === 0) {
                              setMesCalendario(11);
                              setAnoCalendario(anoCalendario - 1);
                            } else {
                              setMesCalendario(mesCalendario - 1);
                            }
                          }}
                        >
                          &lt;&lt;
                        </button>
                        <span className="text-white font-medium min-w-[120px] text-center">
                          {new Date(anoCalendario, mesCalendario).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                        </span>
                        <button
                          className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700"
                          onClick={() => {
                            if (mesCalendario === 11) {
                              setMesCalendario(0);
                              setAnoCalendario(anoCalendario + 1);
                            } else {
                              setMesCalendario(mesCalendario + 1);
                            }
                          }}
                        >
                          &gt;&gt;
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
                        <div key={dia} className="text-center text-xs text-gray-400 font-medium py-1">
                          {dia}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {gerarDiasCalendario(mesCalendario, anoCalendario).map((dia, index) => {
                        if (!dia) {
                          return <div key={index} className="aspect-square" />;
                        }
                        const excecao = getExcecaoPorData(dia.data);
                        const hoje = new Date();
                        hoje.setHours(0, 0, 0, 0);
                        const isHoje = dia.data.getTime() === hoje.getTime();
                        const isPassado = dia.data < hoje;

                        return (
                          <button
                            key={index}
                            className={`aspect-square rounded text-sm font-medium transition-all ${
                              isHoje
                                ? "bg-blue-500 text-white"
                                : excecao
                                  ? "bg-purple-500/30 text-purple-300 border border-purple-500"
                                  : isPassado
                                    ? "bg-gray-800 text-gray-500"
                                    : "bg-gray-800 text-white hover:bg-gray-700"
                            }`}
                            onClick={() => handleOpenModalExcecao(dia.data, excecao)}
                            disabled={isPassado}
                          >
                            {dia.dia}
                            {excecao && <span className="block text-[8px]">*</span>}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-400 mt-4">* datas com exceção</p>
                  </div>

                  {/* Lista de Exceções */}
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Lista de Exceções (ordenada por data)
                    </h3>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {excecoes.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">
                          Nenhuma exceção cadastrada
                        </p>
                      ) : (
                        excecoes
                          .sort((a, b) => {
                            if (!a.data_excecao || !b.data_excecao) return 0;
                            return new Date(a.data_excecao).getTime() - new Date(b.data_excecao).getTime();
                          })
                          .map((excecao) => {
                            if (!excecao.data_excecao) return null;
                            const dataExcecao = new Date(excecao.data_excecao);
                            const diaSemanaMap: Record<string, string> = {
                              DOMINGO: "Dom",
                              SEGUNDA: "Seg",
                              TERCA: "Ter",
                              QUARTA: "Qua",
                              QUINTA: "Qui",
                              SEXTA: "Sex",
                              SABADO: "Sáb",
                            };
                            const diaSemana = diaSemanaMap[excecao.dia_da_semana] || excecao.dia_da_semana;
                            const dataFormatada = `${String(dataExcecao.getDate()).padStart(2, "0")}/${String(dataExcecao.getMonth() + 1).padStart(2, "0")}`;

                            return (
                              <div
                                key={excecao.id}
                                className="bg-gray-800 rounded-lg p-3 border border-gray-700"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="text-purple-400 font-semibold">
                                      {dataFormatada} ({diaSemana})
                                    </div>
                                    <div className="text-white text-sm mt-1">
                                      {excecao.is_feriado
                                        ? "FECHADO"
                                        : `${excecao.horario_abertura} - ${excecao.horario_fechamento}`}
                                    </div>
                                    {excecao.tem_almoco && !excecao.is_feriado && (
                                      <div className="text-gray-400 text-xs mt-1">
                                        • {excecao.horario_almoco_inicio} - {excecao.horario_almoco_fim} (almoço)
                                      </div>
                                    )}
                                    {!excecao.tem_almoco && !excecao.is_feriado && (
                                      <div className="text-gray-400 text-xs mt-1">
                                        • sem almoço
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      color="primary"
                                      size="sm"
                                      variant="flat"
                                      onPress={() => handleOpenModalExcecao(dataExcecao, excecao)}
                                    >
                                      Editar
                                    </Button>
                                    <Button
                                      color="danger"
                                      size="sm"
                                      variant="flat"
                                      onPress={() => handleDeleteExcecao(excecao.id)}
                                      startContent={<TrashIcon className="w-4 h-4" />}
                                    >
                                      Excluir
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Aba: Visão do Cliente */}
              {abaAtiva === "cliente" && (
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Grade de Disponibilidade (6 dias)
                  </h3>
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-6 gap-4 min-w-[800px]">
                      {gerarProximos6Dias().map((diaInfo, index) => {
                        const dataFormatada = `${String(diaInfo.data.getDate()).padStart(2, "0")}/${String(diaInfo.data.getMonth() + 1).padStart(2, "0")}`;
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
                        const slots = gerarSlotsHorario(diaInfo.horario);

                        return (
                          <div key={index} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                            <div className="text-white font-semibold mb-2 text-center">
                              {diaSemana} {dataFormatada}
                            </div>
                            {diaInfo.horario && !diaInfo.horario.is_feriado ? (
                              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                                {slots.map((slot, slotIndex) => (
                                  <div
                                    key={slotIndex}
                                    className={`text-xs p-1 rounded text-center ${
                                      slot.isAlmoco
                                        ? "bg-gray-700 text-gray-400 line-through"
                                        : slot.disponivel
                                          ? "bg-green-500/20 text-green-400"
                                          : "bg-red-500/20 text-red-400"
                                    }`}
                                  >
                                    {slot.hora} {slot.isAlmoco ? "— almoço" : slot.disponivel ? "•" : "■"}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <div className="text-red-400 font-semibold">FECHADO</div>
                                {diaInfo.horario?.is_feriado && (
                                  <div className="text-gray-400 text-xs mt-1">(padrão)</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h4 className="text-sm font-semibold text-white mb-3">Legenda:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 font-bold">•</span>
                        <span className="text-gray-300 text-xs">disponível</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 font-bold">■</span>
                        <span className="text-gray-300 text-xs">ocupado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-bold">—</span>
                        <span className="text-gray-300 text-xs">intervalo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 font-bold">FECHADO</span>
                        <span className="text-gray-300 text-xs">sem slots</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de Edição */}
      <Modal
        classNames={{
          base: "bg-gray-900 border border-gray-700",
          header:
            "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 border-b border-blue-500/30",
          body: "bg-gray-900 py-6",
          footer: "bg-gray-900 border-t border-gray-700",
          closeButton:
            "text-white hover:bg-white/20 hover:text-white focus:bg-white/20",
        }}
        isOpen={isOpen}
        scrollBehavior="inside"
        size="2xl"
        onClose={handleCloseModal}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white">
              {isCriandoExcecao && dataSelecionadaExcecao
                ? (() => {
                    const dataFormatada = `${String(dataSelecionadaExcecao.getDate()).padStart(2, "0")}/${String(dataSelecionadaExcecao.getMonth() + 1).padStart(2, "0")}/${dataSelecionadaExcecao.getFullYear()}`;
                    return `Criar exceção - ${dataFormatada}`;
                  })()
                : dataSelecionadaExcecao
                  ? (() => {
                      const dataFormatada = `${String(dataSelecionadaExcecao.getDate()).padStart(2, "0")}/${String(dataSelecionadaExcecao.getMonth() + 1).padStart(2, "0")}/${dataSelecionadaExcecao.getFullYear()}`;
                      return `Editar exceção - ${dataFormatada}`;
                    })()
                  : selectedDia
                    ? (() => {
                        const diaInfo = DIAS_SEMANA.find(
                          (d) => d.value === selectedDia
                        );
                        // Usa semana atual ou próxima se for domingo sem atendimento
                        const hojeDate = new Date();
                        const hojeDiaSemana = hojeDate.getDay();
                        const semanaParaUsar = (hojeDiaSemana === 0 && !domingoTemAtendimento()) ? "proxima" : "atual";
                        const dataDoDia = calcularDataDoDia(
                          selectedDia,
                          semanaParaUsar
                        );
                        const dataFormatada = `${String(dataDoDia.dia).padStart(2, "0")}/${String(dataDoDia.mes).padStart(2, "0")}/${dataDoDia.ano}`;

                        return `Ajustar horário - ${diaInfo?.label || selectedDia} (${dataFormatada})`;
                      })()
                    : "Ajustar horário"}
            </h2>
          </ModalHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalBody>
              {/* Card de Informação de Horários Disponíveis */}
              {!isFeriado && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-semibold">
                      Horários disponíveis:
                    </span>
                    <span className="text-white text-xl font-bold">
                      {horariosDisponiveis}
                    </span>
                    <span className="text-gray-400 text-sm">
                      (considerando 30 min por serviço
                      {quantidadeBarbeiros > 0 &&
                        ` e ${quantidadeBarbeiros} ${quantidadeBarbeiros === 1 ? "barbeiro" : "barbeiros"}`}
                      )
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Horário de Abertura */}
                <Controller
                  control={control}
                  name="horario_abertura"
                  render={({ field }) => (
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-300 mb-2"
                        htmlFor="horario_abertura"
                      >
                        Horário de Abertura
                      </label>
                      <select
                        {...field}
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        id="horario_abertura"
                      >
                        {opcoesHorario.map((horario) => (
                          <option key={horario} value={horario}>
                            {horario}
                          </option>
                        ))}
                      </select>
                      {errors.horario_abertura && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.horario_abertura.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                {/* Horário de Fechamento */}
                <Controller
                  control={control}
                  name="horario_fechamento"
                  render={({ field }) => (
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-300 mb-2"
                        htmlFor="horario_fechamento"
                      >
                        Horário de Fechamento
                      </label>
                      <select
                        {...field}
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        id="horario_fechamento"
                      >
                        {opcoesHorario.map((horario) => (
                          <option key={horario} value={horario}>
                            {horario}
                          </option>
                        ))}
                      </select>
                      {errors.horario_fechamento && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.horario_fechamento.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* Switch Tem Almoço */}
              <Controller
                control={control}
                name="tem_almoco"
                render={({ field }) => (
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-300 mb-1"
                        htmlFor="tem_almoco"
                      >
                        Tem Intervalo de Almoço
                      </label>
                      <p className="text-xs text-gray-400">
                        Configure um intervalo para o horário de almoço
                      </p>
                    </div>
                    <Switch
                      color="primary"
                      id="tem_almoco"
                      isSelected={field.value}
                      onValueChange={field.onChange}
                    />
                  </div>
                )}
              />

              {/* Horários de Almoço (aparece quando tem_almoco está ativo) */}
              {temAlmoco && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    control={control}
                    name="horario_almoco_inicio"
                    render={({ field }) => (
                      <div>
                        <label
                          className="block text-sm font-medium text-gray-300 mb-2"
                          htmlFor="horario_almoco_inicio"
                        >
                          Início do Almoço
                        </label>
                        <select
                          {...field}
                          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          id="horario_almoco_inicio"
                        >
                          {opcoesHorario.map((horario) => (
                            <option key={horario} value={horario}>
                              {horario}
                            </option>
                          ))}
                        </select>
                        {errors.horario_almoco_inicio && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.horario_almoco_inicio.message}
                          </p>
                        )}
                      </div>
                    )}
                  />

                  <Controller
                    control={control}
                    name="horario_almoco_fim"
                    render={({ field }) => (
                      <div>
                        <label
                          className="block text-sm font-medium text-gray-300 mb-2"
                          htmlFor="horario_almoco_fim"
                        >
                          Fim do Almoço
                        </label>
                        <select
                          {...field}
                          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          id="horario_almoco_fim"
                        >
                          {opcoesHorario.map((horario) => (
                            <option key={horario} value={horario}>
                              {horario}
                            </option>
                          ))}
                        </select>
                        {errors.horario_almoco_fim && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.horario_almoco_fim.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Seleção de Barbeiros */}
              {!isFeriado && (
                <div>
                  <h3 className="block text-sm font-medium text-gray-300 mb-3">
                    Barbeiros que trabalham neste dia
                  </h3>
                  {barbeirosAtivos.length === 0 ? (
                    <p className="text-gray-400 text-sm">
                      Nenhum barbeiro ativo cadastrado
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-800 rounded-lg p-3">
                      <Controller
                        control={control}
                        name="profissionais_ids"
                        render={({ field }) => (
                          <>
                            {barbeirosAtivos.map((barbeiro) => {
                              const avatarUrl = getAvatarUrl(barbeiro.avatar);

                              return (
                                <label
                                  key={barbeiro.id}
                                  className="flex items-center gap-3 p-3 hover:bg-gray-700 rounded cursor-pointer transition-colors"
                                >
                                  <input
                                    checked={field.value?.includes(barbeiro.id)}
                                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 flex-shrink-0"
                                    type="checkbox"
                                    onChange={(e) => {
                                      const currentIds = field.value || [];

                                      if (e.target.checked) {
                                        field.onChange([
                                          ...currentIds,
                                          barbeiro.id,
                                        ]);
                                      } else {
                                        field.onChange(
                                          currentIds.filter(
                                            (id) => id !== barbeiro.id
                                          )
                                        );
                                      }
                                    }}
                                  />
                                  {/* Avatar do Barbeiro */}
                                  {avatarUrl ? (
                                    <img
                                      alt={barbeiro.nome}
                                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-600 flex-shrink-0"
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
                                    className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold border-2 border-gray-600 flex-shrink-0 ${
                                      avatarUrl ? "hidden" : ""
                                    }`}
                                  >
                                    {getInitials(barbeiro.nome)}
                                  </div>
                                  <div className="flex-1">
                                    <span className="text-white text-sm font-medium block">
                                      {barbeiro.nome}
                                    </span>
                                    {barbeiro.funcao && (
                                      <span className="text-gray-400 text-xs block mt-0.5">
                                        {barbeiro.funcao}
                                      </span>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </>
                        )}
                      />
                    </div>
                  )}
                  {errors.profissionais_ids && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.profissionais_ids.message}
                    </p>
                  )}
                </div>
              )}

              {/* Switch Feriado */}
              <Controller
                control={control}
                name="is_feriado"
                render={({ field }) => (
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-300 mb-1"
                        htmlFor="is_feriado_switch"
                      >
                        Não terá atendimento
                      </label>
                      <p className="text-xs text-gray-400">
                        Marque se este dia não terá atendimento
                      </p>
                    </div>
                    <Switch
                      color="danger"
                      id="is_feriado_switch"
                      isSelected={field.value}
                      onValueChange={field.onChange}
                    />
                  </div>
                )}
              />
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                isDisabled={isSubmitting}
                variant="light"
                onPress={handleCloseModal}
              >
                Cancelar
              </Button>
              <Button color="primary" isLoading={isSubmitting} type="submit">
                Atualizar
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Footer />
    </section>
  );
}
