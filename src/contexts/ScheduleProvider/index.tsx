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
  GetBarbersAll,
  GetSchedulesAll,
  GetServicesAll,
} from "./util";

import { useLoading } from "@/contexts/LoadingProvider";

export const ScheduleContext = createContext<IContext>({} as IContext);

export const ScheduleProvider = ({ children }: IScheduleProvider) => {
  const { withLoading } = useLoading();
  const [barbers, setBarbers] = useState<IBarbers[]>([]);
  const [services, setServices] = useState<IServices[]>([]);
  const [schedules, setSchedules] = useState<ISchedules[]>([]);
  const [appointments, setAppointments] = useState<IAppointments[]>([]);

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
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};
