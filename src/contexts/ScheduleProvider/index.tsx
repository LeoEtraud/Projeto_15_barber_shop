import { createContext, useState } from "react";
import { addToast } from "@heroui/react";

import {
  IAppointments,
  IBarbers,
  IContext,
  IProfessionals,
  IScheduleProvider,
  ISchedules,
  IServices,
} from "./types";
import {
  GetAppointments,
  GetAppointmentsByProfessional,
  GetBarbersAll,
  GetProfessionalsAll,
  GetSchedulesAll,
  GetServicesAll,
} from "./util";

import { useLoading } from "@/contexts/LoadingProvider";

// Função auxiliar para garantir que a data UTC seja interpretada corretamente
function parseUTCDate(dateString: string): Date {
  // Se a string já tem timezone explícito (Z ou offset como +HH:MM ou -HH:MM), o Date já interpreta corretamente
  // Caso contrário, assumimos que é UTC e adicionamos o 'Z'
  const hasTimezone = dateString.includes('Z') || 
                      /[+-]\d{2}:\d{2}$/.test(dateString) || 
                      /[+-]\d{4}$/.test(dateString);
  
  if (!hasTimezone) {
    // Se não tem timezone, assume UTC
    dateString = `${dateString}Z`;
  }
  
  // Cria o Date que automaticamente converte de UTC para o horário local do navegador
  return new Date(dateString);
}

// Função para transformar o formato da API para o formato esperado
function transformAppointmentFromAPI(appointment: any): IAppointments {
  try {
    // Converte hora_inicio e hora_fim para data e horário formatados
    let data = "";
    let horario = "";
    let valor = 0;

    if (appointment.hora_inicio) {
      // Garante que a data UTC seja interpretada corretamente e convertida para horário local
      const startDate = parseUTCDate(appointment.hora_inicio);

      if (!Number.isNaN(startDate.getTime())) {
        // Usa os métodos locais que já fazem a conversão automática de UTC para local
        const day = String(startDate.getDate()).padStart(2, "0");
        const month = String(startDate.getMonth() + 1).padStart(2, "0");
        const year = startDate.getFullYear();

        data = `${day}/${month}/${year}`;

        const startHours = String(startDate.getHours()).padStart(2, "0");
        const startMinutes = String(startDate.getMinutes()).padStart(2, "0");

        if (appointment.hora_fim) {
          // Garante que a data UTC seja interpretada corretamente e convertida para horário local
          const endDate = parseUTCDate(appointment.hora_fim);

          if (!Number.isNaN(endDate.getTime())) {
            const endHours = String(endDate.getHours()).padStart(2, "0");
            const endMinutes = String(endDate.getMinutes()).padStart(2, "0");

            horario = `${startHours}:${startMinutes} - ${endHours}:${endMinutes}`;
          } else {
            horario = `${startHours}:${startMinutes}`;
          }
        } else {
          horario = `${startHours}:${startMinutes}`;
        }
      }
    }

    // Converte valor_pago para number
    if (
      appointment.valor_pago !== undefined &&
      appointment.valor_pago !== null
    ) {
      const parsedValue =
        typeof appointment.valor_pago === "string"
          ? parseFloat(appointment.valor_pago)
          : Number(appointment.valor_pago);

      if (!Number.isNaN(parsedValue)) {
        valor = parsedValue;
      }
    }

    // Extrai os nomes dos serviços
    const servicos: string[] = [];

    if (appointment.servicos && Array.isArray(appointment.servicos)) {
      appointment.servicos.forEach((item: any) => {
        if (item?.servico?.nome) {
          servicos.push(item.servico.nome);
        }
      });
    }

    return {
      id: appointment.id,
      data,
      horario,
      valor,
      cliente: appointment.cliente,
      status: appointment.status,
      servicos: servicos.length > 0 ? servicos : undefined,
      hora_inicio: appointment.hora_inicio,
      hora_fim: appointment.hora_fim,
      valor_pago: valor,
    };
  } catch (error) {
    console.error("Erro ao transformar agendamento:", error, appointment);

    // Retorna um objeto mínimo em caso de erro
    return {
      id: appointment.id || "",
      data: "",
      horario: "",
      valor: 0,
      cliente: appointment.cliente,
      status: appointment.status,
      hora_inicio: appointment.hora_inicio,
      hora_fim: appointment.hora_fim,
    };
  }
}

export const ScheduleContext = createContext<IContext>({} as IContext);

export const ScheduleProvider = ({ children }: IScheduleProvider) => {
  const { withLoading } = useLoading();
  const [barbers, setBarbers] = useState<IBarbers[]>([]);
  const [professionals, setProfessionals] = useState<IProfessionals[]>([]);
  const [services, setServices] = useState<IServices[]>([]);
  const [schedules, setSchedules] = useState<ISchedules[]>([]);
  const [appointments, setAppointments] = useState<IAppointments[]>([]);
  const [professionalAppointments, setProfessionalAppointments] = useState<
    IAppointments[]
  >([]);

  // FUNÇÃO PARA LISTAR TODOS OS BARBEIROS ATIVOS
  async function fetchBarbers() {
    try {
      return await withLoading(
        (async () => {
          const response = await GetBarbersAll();

          setBarbers(response.barbers);
        })()
      );
    } catch {
      addToast({
        title: "Erro",
        description: "Falha na listagem dos Barbeiros!",
        color: "danger",
        timeout: 3000,
      });
    }
  }

  // FUNÇÃO PARA LISTAR TODOS OS PROFISSIONAIS

  async function fetchProfessionals() {
    try {
      return await withLoading(
        (async () => {
          const response = await GetProfessionalsAll();

          // Transforma os dados da API para o formato esperado
          const transformedProfessionals: IProfessionals[] = (
            response.professionalAll || []
          ).map((professional: any) => ({
            id: professional.id,
            barbeariaId: professional.id_barbearia,
            nome: professional.nome,
            telefone: professional.telefone,
            email: professional.usuario?.email || "",
            data_nascimento: professional.data_nascimento,
            funcao: professional.funcao,
            avatar: professional.avatar,
            qtd_atendimentos: professional.qtd_atendimentos || 0,
            nota_avaliacao: professional.nota_avaliacao || 0,
            status: professional.status,
          }));

          setProfessionals(transformedProfessionals);
        })()
      );
    } catch {
      addToast({
        title: "Erro",
        description: "Falha na listagem dos Profissionais!",
        color: "danger",
        timeout: 3000,
      });
    }
  }

  // FUNÇÃO PARA LISTAR TODOS OS SERVIÇOS
  async function fetchServices() {
    try {
      return await withLoading(
        (async () => {
          const response = await GetServicesAll();

          setServices(response.services);
        })()
      );
    } catch {
      addToast({
        title: "Erro",
        description: "Falha na listagem dos Serviços!",
        color: "danger",
        timeout: 3000,
      });
    }
  }

  // FUNÇÃO PARA BUSCAR AS DATAS E HORÁRIOS DOS AGENDAMENTOS CONFIRMADOS
  async function fetchSchedules(barbeiroId: string) {
    try {
      if (!barbeiroId) {
        throw new Error("ID do barbeiro é obrigatório");
      }

      return await withLoading(
        (async () => {
          const response = await GetSchedulesAll(barbeiroId);

          setSchedules(response.schedules);
        })()
      );
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      addToast({
        title: "Erro",
        description: "Falha na listagem dos horários disponíveis!",
        color: "danger",
        timeout: 3000,
      });
    }
  }

  // FUNÇÃO PARA BUSCAR OS AGENDAMENTOS DO CLIENTE
  async function fetchAppointments(id: string) {
    try {
      const response = await withLoading(GetAppointments(id));

      // Verifica se a resposta tem a estrutura esperada
      if (!response || !response.appointments) {
        console.warn("Resposta da API não tem a estrutura esperada:", response);
        setAppointments([]);

        return response || [];
      }

      // Transforma os agendamentos do formato da API para o formato esperado
      const transformedAppointments = response.appointments.map(
        (appointment: any) => {
          try {
            const transformed = transformAppointmentFromAPI(appointment);

            // Adiciona o nome do profissional se disponível
            if (appointment.profissional?.nome) {
              transformed.barbeiro = appointment.profissional.nome;
            }

            return transformed;
          } catch (error) {
            console.error(
              "Erro ao transformar agendamento individual:",
              error,
              appointment
            );

            return null;
          }
        }
      );

      // Filtra agendamentos nulos (que deram erro na transformação)
      const validAppointments = transformedAppointments.filter(
        (appointment: IAppointments) => appointment !== null
      );

      setAppointments(validAppointments);

      return response || [];
    } catch (error: any) {
      console.error("Erro ao buscar agendamentos:", error);
      setAppointments([]);
      addToast({
        title: "Erro",
        description: "Falha na listagem dos históricos de Agendamentos!",
        color: "danger",
        timeout: 3000,
      });
      throw error;
    }
  }

  // FUNÇÃO PARA BUSCAR OS AGENDAMENTOS DO PROFISSIONAL
  async function fetchAppointmentsByProfessional(profissionalId: string) {
    try {
      const response = await withLoading(
        GetAppointmentsByProfessional(profissionalId)
      );

      // Verifica se a resposta tem a estrutura esperada
      if (!response || !response.appointments) {
        console.warn("Resposta da API não tem a estrutura esperada:", response);
        setProfessionalAppointments([]);

        return response || [];
      }

      // Transforma os agendamentos do formato da API para o formato esperado
      const transformedAppointments = response.appointments.map(
        (appointment: any) => {
          try {
            return transformAppointmentFromAPI(appointment);
          } catch (error) {
            console.error(
              "Erro ao transformar agendamento individual:",
              error,
              appointment
            );

            return null;
          }
        }
      );

      // Filtra agendamentos nulos (que deram erro na transformação)
      const validAppointments = transformedAppointments.filter(
        (appointment: IAppointments) => appointment !== null
      );

      setProfessionalAppointments(validAppointments);

      return response || [];
    } catch (error: any) {
      console.error("Erro ao buscar agendamentos do profissional:", error);
      setProfessionalAppointments([]);
      addToast({
        title: "Erro",
        description: "Falha na listagem dos agendamentos do profissional!",
        color: "danger",
        timeout: 3000,
      });
      throw error;
    }
  }

  return (
    <ScheduleContext.Provider
      value={{
        barbers,
        fetchBarbers,
        professionals,
        fetchProfessionals,
        services,
        fetchServices,
        schedules,
        fetchSchedules,
        appointments,
        fetchAppointments,
        professionalAppointments,
        fetchAppointmentsByProfessional,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};
