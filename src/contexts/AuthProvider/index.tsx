import { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

import { IAuthProvider, IContext, IPayLoad } from "./types";
import { setUserLocalStorage } from "./util";

export const AuthContext = createContext<IContext>({} as IContext);
export const AuthProvider = ({ children }: IAuthProvider) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<IPayLoad | null>(
    typeof window !== "undefined"
      ? JSON.parse(Cookies.get("corujaId") || "null")
      : null
  );

  const [token, setToken] = useState<string | null>(
    typeof window !== "undefined" ? Cookies.get("corujaToken") || null : null
  );

  async function authenticate(response: any) {
    setUserLocalStorage(response);
    setUser(response);
    setToken(response.token);
    setTimeout(() => {
      navigate("/dashboard");
    }, 750);
  }

  return (
    <AuthContext.Provider
      value={{
        authenticate,
        user,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
