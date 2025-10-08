import { createContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { addToast } from "@heroui/react";

import { IAuthProvider, IContext, IPayLoad } from "./types";

import { useLoading } from "@/contexts/LoadingProvider";

export const AuthContext = createContext<IContext>({} as IContext);

export const AuthProvider = ({ children }: IAuthProvider) => {
  const navigate = useNavigate();

  useLoading();

  const [user, setUser] = useState<IPayLoad | null>(
    typeof window !== "undefined"
      ? JSON.parse(Cookies.get("barberId") || "null")
      : null
  );

  const [token, setToken] = useState<string | null>(
    typeof window !== "undefined" ? Cookies.get("barberToken") || null : null
  );

  function setUserCookies(user: IPayLoad | null) {
    Cookies.set("barberId", JSON.stringify(user), {
      expires: (30 / 1440) * 24, //12horas
    });
    if (user && user.token) {
      Cookies.set("barberToken", user.token, {
        expires: (30 / 1440) * 24, //12horas
      });
    }
  }

  function getUserCookies() {
    const json = Cookies.get("barberId");

    if (!json) {
      return null;
    }

    const user = JSON.parse(json);

    return user ?? null;
  }

  async function authenticate(data: IPayLoad) {
    try {
      setUserCookies(data);
      setUser(data);
      setToken(data.token);
      setTimeout(() => {
        navigate("/home");
      }, 300);
    } finally {
    }
  }

  // Função memoizada com verificações condicionais
  const checkAuth = useCallback(async () => {
    const userFromCookie = getUserCookies();
    const tokenFromCookie = Cookies.get("barberToken") || null;

    setUser((prevUser) => {
      if (JSON.stringify(prevUser) !== JSON.stringify(userFromCookie)) {
        return userFromCookie;
      }

      return prevUser;
    });

    setToken((prevToken) => {
      if (prevToken !== tokenFromCookie) {
        return tokenFromCookie;
      }

      return prevToken;
    });
  }, []);

  // FUNÇÃO PARA DESLOGAR DO SISTEMA
  function logout() {
    // substituir qualquer toast anterior
    addToast({
      title: "Logout",
      description: "Sessão encerrada com sucesso!",
      color: "danger",
      timeout: 3000,
    });

    // limpar estado e cookies na raiz
    setUser(null);
    setToken(null);
    Cookies.remove("barberId", { path: "/" });
    Cookies.remove("barberToken", { path: "/" });

    navigate("/");
  }

  return (
    <AuthContext.Provider
      value={{
        authenticate,
        user,
        token,
        checkAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from "./useAuth";
