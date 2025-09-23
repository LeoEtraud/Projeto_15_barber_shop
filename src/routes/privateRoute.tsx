import React, { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthProvider/useAuth";

import { useLoading } from "@/contexts/LoadingProvider";

interface PrivateRouteProps {
  children: ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { token, checkAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const { show, hide } = useLoading();

  useEffect(() => {
    (async () => {
      show();
      try {
        await checkAuth();
      } finally {
        setLoading(false);
        hide();
      }
    })();
    // Executa apenas uma vez na montagem
  }, []); // Removemos checkAuth da lista de dependências

  if (loading) {
    return null; // ou um spinner de loading
  }

  return token ? <>{children}</> : <Navigate to="/" />;
};
