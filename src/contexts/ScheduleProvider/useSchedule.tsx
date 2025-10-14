import { useContext } from "react";

import { ScheduleContext } from ".";

export const useSchedule = () => {
  const context = useContext(ScheduleContext);

  return context;
};
