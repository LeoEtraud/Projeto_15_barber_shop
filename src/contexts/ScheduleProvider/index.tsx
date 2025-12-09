import { createContext, useState } from "react";
import { addToast } from "@heroui/react";

import {
  IAppointments,
  IBarbers,
  IContext,
  IScheduleProvider,
  ISchedules,
  IServices,
} from "./types";
import {
  GetAppointments,
  GetAppointmentsByProfessional,
  GetBarbersAll,
  GetSchedulesAll,
  GetServicesAll,
} from "./util";

import { useLoading } from "@/contexts/LoadingProvider";

// Função para transformar o formato da API para o formato esperado
function transformAppointmentFromAPI(appointment: any): IAppointments {
  try {
    // Converte hora_inicio e hora_fim para data e horário formatados
    let data = "";
    let horario = "";
    let valor = 0;

    if (appointment.hora_inicio) {
      const startDate = new Date(appointment.hora_inicio);

      if (!Number.isNaN(startDate.getTime())) {
        const day = String(startDate.getDate()).padStart(2, "0");
        const month = String(startDate.getMonth() + 1).padStart(2, "0");
        const year = startDate.getFullYear();
        data = `${day}/${month}/${year}`;

        const startHours = String(startDate.getHours()).padStart(2, "0");
        const startMinutes = String(startDate.getMinutes()).padStart(2, "0");

        if (appointment.hora_fim) {
          const endDate = new Date(appointment.hora_fim);

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
    if (appointment.valor_pago !== undefined && appointment.valor_pago !== null) {
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
        })(),
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

  // FUNÇÃO PARA LISTAR TODOS OS SERVIÇOS
  async function fetchServices() {
    try {
      return await withLoading(
        (async () => {
          const response = await GetServicesAll();
          setServices(response.services);
        })(),
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
        })(),
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
      setAppointments(response.appointments as IAppointments[]);
      return response || [];
    } catch (error: any) {
      console.error("Erro ao buscar agendamentos:", error);
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
        GetAppointmentsByProfessional(profissionalId),
      );

      // Verifica se a resposta tem a estrutura esperada
      if (!response || !response.appointments) {
        console.warn(
          "Resposta da API não tem a estrutura esperada:",
          response,
        );
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
              appointment,
            );

            return null;
          }
        },
      );

      // Filtra agendamentos nulos (que deram erro na transformação)
      const validAppointments = transformedAppointments.filter(
        (appointment) => appointment !== null,
      ) as IAppointments[];

      setProfessionalAppointments(validAppointments);
      return response || [];
    } catch (error: any) {
      console.error("Erro ao buscar agendamentos do profissional:", error);
      setProfessionalAppointments([]);
      addToast({
        title: "Erro",
        description:
          "Falha na listagem dos agendamentos do profissional!",
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
