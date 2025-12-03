import React, { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { addToast } from "@heroui/react";

import { useAuth } from "@/contexts/AuthProvider/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { UserRole, Permission } from "@/types/roles";
import { useLoading } from "@/contexts/LoadingProvider";

interface RoleProtectedRouteProps {
  children: ReactNode;
  /**
   * Roles permitidos para acessar esta rota
   */
  allowedRoles?: UserRole[];
  /**
   * Permissões necessárias (usuário precisa ter pelo menos uma)
   */
  requiredPermissions?: Permission[];
  /**
   * Se true, usuário precisa ter TODAS as permissões
   */
  requireAllPermissions?: boolean;
  /**
   * Rota de redirecionamento quando acesso negado (padrão: /home)
   */
  redirectTo?: string;
  /**
   * Mensagem a ser exibida quando acesso negado
   */
  accessDeniedMessage?: string;
}

/**
 * Componente para proteger rotas baseado em roles e permissões
 */
export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermissions,
  requireAllPermissions = false,
  redirectTo = "/home",
  accessDeniedMessage = "Você não tem permissão para acessar esta página.",
}) => {
  const { token, checkAuth, user } = useAuth();
  const { userRole, checkPermission, checkAnyPermission, checkAllPermissions } =
    usePermissions();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useLoading();

  useEffect(() => {
    (async () => {
      try {
        await checkAuth();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!token || !user) {
      setHasAccess(false);
      return;
    }

    let access = true;

    // Verifica roles permitidos
    if (allowedRoles && allowedRoles.length > 0) {
      access = allowedRoles.includes(userRole);
    }

    // Verifica permissões necessárias
    if (access && requiredPermissions && requiredPermissions.length > 0) {
      if (requireAllPermissions) {
        access = checkAllPermissions(requiredPermissions);
      } else {
        access = checkAnyPermission(requiredPermissions);
      }
    }

    setHasAccess(access);

    // Mostra mensagem se acesso negado
    if (!access && token) {
      addToast({
        title: "Acesso Negado",
        description: accessDeniedMessage,
        color: "danger",
        timeout: 4000,
      });
    }
  }, [
    token,
    user,
    userRole,
    allowedRoles,
    requiredPermissions,
    requireAllPermissions,
    checkAnyPermission,
    checkAllPermissions,
  ]);

  if (loading) {
    return null;
  }

  if (!token) {
    return <Navigate to="/" />;
  }

  if (!hasAccess) {
    return <Navigate to={redirectTo} />;
  }

  return <>{children}</>;
};

