import { createContext, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { addToast } from "@heroui/react";

import { IAuthProvider, IContext, IPayLoad } from "./types";
import { UserRole } from "@/types/roles";

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

  const setUserCookies = useCallback((user: IPayLoad | null) => {
    Cookies.set("barberId", JSON.stringify(user), {
      expires: (30 / 1440) * 24, //12horas
    });
    if (user && user.token) {
      Cookies.set("barberToken", user.token, {
        expires: (30 / 1440) * 24, //12horas
      });
    }
  }, []);

  const getUserCookies = useCallback(() => {
    const json = Cookies.get("barberId");

    if (!json) {
      return null;
    }

    const user = JSON.parse(json);

    return user ?? null;
  }, []);

  const authenticate = useCallback(
    async (data: IPayLoad) => {
      setUserCookies(data);
      setUser(data);
      setToken(data.token);

      // Redireciona baseado no role do usuário
      const userRole = data.user?.role as UserRole | undefined;
      let redirectPath = "/home";

      if (userRole === UserRole.GESTOR) {
        redirectPath = "/gestor/dashboard";
      } else if (userRole === UserRole.PROFISSIONAL) {
        redirectPath = "/profissional/dashboard";
      }

      setTimeout(() => {
        navigate(redirectPath);
      }, 300);
    },
    [navigate, setUserCookies]
  );

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
  const logout = useCallback(() => {
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
  }, [navigate]);

  const contextValue = useMemo(
    () => ({
      authenticate,
      user,
      token,
      checkAuth,
      logout,
    }),
    [authenticate, user, token, checkAuth, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from "./useAuth";
