import { createContext, useState } from "react";
import { addToast } from "@heroui/react";

import { IBarbers, IContext, IScheduleProvider } from "./types";
import { GetBarbersAll } from "./util";

export const ScheduleContext = createContext<IContext>({} as IContext);

export const ScheduleProvider = ({ children }: IScheduleProvider) => {
  const [barbers, setBarbers] = useState<IBarbers[]>([]);

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

  return (
    <ScheduleContext.Provider
      value={{
        barbers,
        fetchBarbers,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};
