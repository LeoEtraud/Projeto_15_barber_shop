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

export const ScheduleContext = createContext<IContext>({} as IContext);

export const ScheduleProvider = ({ children }: IScheduleProvider) => {
  const [barbers, setBarbers] = useState<IBarbers[]>([]);
  const [services, setServices] = useState<IServices[]>([]);
  const [schedules, setSchedules] = useState<ISchedules[]>([]);
  const [appointments, setAppointments] = useState<IAppointments[]>([]);

  // FUNÇÃO PARA LISTAR TODOS OS BARBEIROS ATIVOS
  async function fetchBarbers() {
    try {
      const response = await GetBarbersAll();

      setBarbers(response.barbers);
    } catch {
      addToast({
        title: "Erro",
        description: "Falha na listagem dos Barbeiros!",
        color: "danger",
        timeout: 3000,
      });
    } finally {
    }
  }

  // FUNÇÃO PARA LISTAR TODOS OS SERVIÇOS
  async function fetchServices() {
    try {
      const response = await GetServicesAll();

      setServices(response.services);
    } catch {
      addToast({
        title: "Erro",
        description: "Falha na listagem dos Serviços!",
        color: "danger",
        timeout: 3000,
      });
    } finally {
    }
  }

  // FUNÇÃO PARA BUSCAR AS DATAS E HORÁRIOS DOS AGENDAMENTOS CONFIRMADOS
  async function fetchSchedules() {
    try {
      const response = await GetSchedulesAll();

      setSchedules(response.schedules);
    } catch {
      addToast({
        title: "Erro",
        description: "Falha na listagem dos Serviços!",
        color: "danger",
        timeout: 3000,
      });
    } finally {
    }
  }

  async function fetchAppointments(id: string) {
    try {
      const response = await GetAppointments(id);

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
