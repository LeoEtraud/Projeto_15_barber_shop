import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
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
import { PencilIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usePermissions } from "@/hooks/usePermissions";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";
import { useAuth } from "@/contexts/AuthProvider/useAuth";
import {
  GetHorariosFuncionamento,
  CreateHorarioFuncionamento,
  UpdateHorarioFuncionamento,
} from "@/contexts/ScheduleProvider/util";
import { IHorarioFuncionamento } from "@/contexts/ScheduleProvider/types";

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
  const [selectedHorario, setSelectedHorario] =
    useState<IHorarioFuncionamento | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estado para controlar qual semana está sendo visualizada
  // Se hoje for domingo, inicia com "proxima", caso contrário "atual"
  const hoje = new Date();
  const diaAtual = hoje.getDay();
  const [semanaSelecionada, setSemanaSelecionada] = useState<
    "atual" | "proxima"
  >(diaAtual === 0 ? "proxima" : "atual");

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
      horario_abertura: "09:00",
      horario_fechamento: "19:30",
      tem_almoco: true,
      horario_almoco_inicio: "12:30",
      horario_almoco_fim: "14:00",
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

  // Função para buscar horários de funcionamento
  const fetchHorarios = async () => {
    try {
      setIsLoading(true);
      const barbeariaId = user?.user?.barbeariaId;

      if (!barbeariaId) {
        throw new Error("ID da barbearia não encontrado");
      }

      const response = await GetHorariosFuncionamento(barbeariaId);

      setHorarios(response.horarios || []);
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

  // Função para obter horário de um dia específico
  const getHorarioByDia = (dia: string): IHorarioFuncionamento | undefined => {
    return horarios.find((h) => h.dia_da_semana === dia);
  };

  // Função para obter valores padrão baseado no dia da semana
  const getValoresPadrao = (dia: string) => {
    // Filtrar apenas barbeiros ativos
    const barbeirosAtivosIds = professionals
      .filter(
        (p) =>
          (p.status === "ATIVO" || p.status === "ativo") &&
          (p.funcao === "Barbeiro" || p.funcao === "Barbeiros")
      )
      .map((p) => p.id);

    // Domingo é fechado por padrão
    if (dia === "DOMINGO") {
      return {
        horario_abertura: "09:00",
        horario_fechamento: "19:30",
        tem_almoco: false,
        horario_almoco_inicio: "12:30",
        horario_almoco_fim: "14:00",
        is_feriado: true,
        profissionais_ids: [],
      };
    }

    // Segunda a sábado: aberto com horários padrão, intervalo de almoço e todos os barbeiros ativos
    return {
      horario_abertura: "09:00",
      horario_fechamento: "19:30",
      tem_almoco: true,
      horario_almoco_inicio: "12:30",
      horario_almoco_fim: "14:00",
      is_feriado: false,
      profissionais_ids: barbeirosAtivosIds,
    };
  };

  // Função para abrir modal de edição
  const handleOpenModal = (dia: string) => {
    setSelectedDia(dia);
    const horarioExistente = getHorarioByDia(dia);

    if (horarioExistente) {
      setSelectedHorario(horarioExistente);
      reset({
        horario_abertura: horarioExistente.horario_abertura || "09:00",
        horario_fechamento: horarioExistente.horario_fechamento || "19:30",
        tem_almoco: horarioExistente.tem_almoco ?? true,
        horario_almoco_inicio:
          horarioExistente.horario_almoco_inicio || "12:30",
        horario_almoco_fim: horarioExistente.horario_almoco_fim || "14:00",
        is_feriado: horarioExistente.is_feriado || false,
        profissionais_ids:
          horarioExistente.profissionais?.map((p) => p.id) || [],
      });
    } else {
      setSelectedHorario(null);
      const valoresPadrao = getValoresPadrao(dia);

      reset(valoresPadrao);
    }
    onOpen();
  };

  const handleCloseModal = () => {
    setSelectedDia(null);
    setSelectedHorario(null);
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
      };

      if (selectedHorario) {
        // Atualizar horário existente
        await UpdateHorarioFuncionamento(selectedHorario.id, payload);
        addToast({
          title: "Sucesso",
          description: "Horário atualizado com sucesso!",
          color: "success",
          timeout: 3000,
        });
      } else {
        // Criar novo horário
        await CreateHorarioFuncionamento(payload);
        addToast({
          title: "Sucesso",
          description: "Horário cadastrado com sucesso!",
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
        description: selectedHorario
          ? "Falha ao atualizar horário. Tente novamente."
          : "Falha ao cadastrar horário. Tente novamente.",
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

          {/* Abas de Seleção de Semana */}
          <div className="bg-gray-900 rounded-lg p-2 mb-6 border border-gray-700">
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  semanaSelecionada === "atual"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                type="button"
                onClick={() => setSemanaSelecionada("atual")}
              >
                Semana Atual
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  semanaSelecionada === "proxima"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                type="button"
                onClick={() => setSemanaSelecionada("proxima")}
              >
                Próxima Semana
              </button>
            </div>
          </div>

          {/* Grid de Cards dos Dias */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Carregando horários...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DIAS_SEMANA.map((dia) => {
                const horario = getHorarioByDia(dia.value);
                const quantidadeBarbeirosCard =
                  horario?.profissionais?.length || 0;
                const horariosDisponiveisCard =
                  horario && !horario.is_feriado && quantidadeBarbeirosCard > 0
                    ? calcularHorariosDisponiveis(
                        horario.horario_abertura,
                        horario.horario_fechamento,
                        horario.tem_almoco,
                        horario.horario_almoco_inicio,
                        horario.horario_almoco_fim,
                        30,
                        quantidadeBarbeirosCard
                      )
                    : 0;

                // Calcula a data do dia da semana automaticamente baseado na semana selecionada
                const dataDoDia = calcularDataDoDia(
                  dia.value,
                  semanaSelecionada
                );

                const dataFormatada = `${String(dataDoDia.dia).padStart(2, "0")}/${String(dataDoDia.mes).padStart(2, "0")}/${dataDoDia.ano}`;
                const hoje = new Date();
                const hojeFormatado = `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;
                const isHoje = dataFormatada === hojeFormatado;

                return (
                  <Card
                    key={dia.value}
                    className={`bg-gray-900 border ${
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
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {dataFormatada}
                          </p>
                        </div>
                        <Button
                          color="primary"
                          size="sm"
                          startContent={<PencilIcon className="w-3 h-3" />}
                          variant="flat"
                          onPress={() => handleOpenModal(dia.value)}
                        >
                          {horario ? "Editar" : "Config"}
                        </Button>
                      </div>

                      {horario ? (
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Horário:</span>
                            <span className="text-white font-medium">
                              {horario.horario_abertura} -{" "}
                              {horario.horario_fechamento}
                            </span>
                          </div>

                          {horario.tem_almoco &&
                            horario.horario_almoco_inicio &&
                            horario.horario_almoco_fim && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400">Almoço:</span>
                                <span className="text-white font-medium">
                                  {horario.horario_almoco_inicio} -{" "}
                                  {horario.horario_almoco_fim}
                                </span>
                              </div>
                            )}

                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Disponíveis:</span>
                            <span className="text-green-400 font-medium">
                              {horario.is_feriado ? 0 : horariosDisponiveisCard}
                            </span>
                          </div>

                          {horario.profissionais &&
                            horario.profissionais.length > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-400">
                                  Barbeiros:
                                </span>
                                <span className="text-white font-medium">
                                  {horario.profissionais.length}
                                </span>
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
              {selectedDia
                ? (() => {
                    const diaInfo = DIAS_SEMANA.find(
                      (d) => d.value === selectedDia
                    );
                    const dataDoDia = calcularDataDoDia(
                      selectedDia,
                      semanaSelecionada
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
                {selectedHorario ? "Atualizar" : "Salvar"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Footer />
    </section>
  );
}
