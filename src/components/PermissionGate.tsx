import { ReactNode } from "react";

import { usePermissions } from "@/hooks/usePermissions";
import { UserRole, Permission } from "@/types/roles";

interface PermissionGateProps {
  children: ReactNode;
  /**
   * Roles permitidos para ver este conteúdo
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
   * Conteúdo a exibir quando acesso negado (opcional)
   */
  fallback?: ReactNode;
  /**
   * Se true, não renderiza nada quando acesso negado
   */
  hideOnDeny?: boolean;
}

/**
 * Componente para renderizar conteúdo condicionalmente baseado em permissões
 * Útil para mostrar/esconder botões, menus, seções, etc.
 */
export function PermissionGate({
  children,
  allowedRoles,
  requiredPermissions,
  requireAllPermissions = false,
  fallback = null,
  hideOnDeny = true,
}: PermissionGateProps) {
  const { userRole, checkAnyPermission, checkAllPermissions } =
    usePermissions();

  let hasAccess = true;

  // Verifica roles permitidos
  if (allowedRoles && allowedRoles.length > 0) {
    hasAccess = allowedRoles.includes(userRole);
  }

  // Verifica permissões necessárias
  if (hasAccess && requiredPermissions && requiredPermissions.length > 0) {
    if (requireAllPermissions) {
      hasAccess = checkAllPermissions(requiredPermissions);
    } else {
      hasAccess = checkAnyPermission(requiredPermissions);
    }
  }

  if (!hasAccess) {
    return hideOnDeny ? null : <>{fallback}</>;
  }

  return <>{children}</>;
}
