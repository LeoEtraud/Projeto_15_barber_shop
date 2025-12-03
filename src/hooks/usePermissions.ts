import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthProvider/useAuth";
import {
  UserRole,
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "@/types/roles";

/**
 * Hook para verificar permissões do usuário atual
 */
export function usePermissions() {
  const { user } = useAuth();

  // Obtém o role do usuário, padrão CLIENTE se não houver
  const userRole = useMemo<UserRole>(() => {
    const role = user?.user?.role as UserRole | undefined;

    return role || UserRole.CLIENTE;
  }, [user?.user?.role]);

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const checkPermission = useMemo(
    () => (permission: Permission) => {
      return hasPermission(userRole, permission);
    },
    [userRole]
  );

  /**
   * Verifica se o usuário tem qualquer uma das permissões
   */
  const checkAnyPermission = useMemo(
    () => (permissions: Permission[]) => {
      return hasAnyPermission(userRole, permissions);
    },
    [userRole]
  );

  /**
   * Verifica se o usuário tem todas as permissões
   */
  const checkAllPermissions = useMemo(
    () => (permissions: Permission[]) => {
      return hasAllPermissions(userRole, permissions);
    },
    [userRole]
  );

  /**
   * Verifica se o usuário tem um role específico
   */
  const isRole = useMemo(
    () => (role: UserRole) => {
      return userRole === role;
    },
    [userRole]
  );

  /**
   * Verifica se o usuário tem qualquer um dos roles
   */
  const isAnyRole = useMemo(
    () => (roles: UserRole[]) => {
      return roles.includes(userRole);
    },
    [userRole]
  );

  return {
    userRole,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    isRole,
    isAnyRole,
    // Helpers específicos por role
    isCliente: isRole(UserRole.CLIENTE),
    isProfissional: isRole(UserRole.PROFISSIONAL),
    isGestor: isRole(UserRole.GESTOR),
  };
}

