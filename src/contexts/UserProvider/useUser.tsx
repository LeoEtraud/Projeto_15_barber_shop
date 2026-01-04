import { useContext } from "react";

import { UserContext } from ".";

export const useUser = () => {
  const context = useContext(UserContext);

  return context;
};
