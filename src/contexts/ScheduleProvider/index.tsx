import { createContext, useState } from "react";
import { addToast } from "@heroui/react";

import {
  IBarbers,
  IContext,
  IScheduleProvider,
  ISchedules,
  IServices,
} from "./types";
import { GetBarbersAll, GetSchedulesAll, GetServicesAll } from "./util";

export const ScheduleContext = createContext<IContext>({} as IContext);

export const ScheduleProvider = ({ children }: IScheduleProvider) => {
  const [barbers, setBarbers] = useState<IBarbers[]>([]);
  const [services, setServices] = useState<IServices[]>([]);
  const [schedules, setSchedules] = useState<ISchedules[]>([]);

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

  return (
    <ScheduleContext.Provider
      value={{
        barbers,
        fetchBarbers,
        services,
        fetchServices,
        schedules,
        fetchSchedules,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};
