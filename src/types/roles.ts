// Enum de Roles do Sistema
export enum UserRole {
  CLIENTE = "CLIENTE",
  PROFISSIONAL = "PROFISSIONAL",
  GESTOR = "GESTOR",
}

// Tipo para permissões específicas
export type Permission =
  | "view_appointments"
  | "create_appointments"
  | "cancel_appointments"
  | "view_own_appointments"
  | "view_all_appointments"
  | "manage_barbers"
  | "manage_services"
  | "manage_schedules"
  | "view_reports"
  | "manage_users"
  | "view_dashboard"
  | "manage_barbearia";

// Mapeamento de Roles para Permissões
export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.CLIENTE]: [
    "view_own_appointments",
    "create_appointments",
    "cancel_appointments",
    "view_appointments",
  ],
  [UserRole.PROFISSIONAL]: [
    "view_own_appointments",
    "view_appointments",
    "manage_schedules",
    "view_dashboard",
  ],
  [UserRole.GESTOR]: [
    "view_all_appointments",
    "manage_barbers",
    "manage_services",
    "manage_schedules",
    "view_reports",
    "manage_users",
    "view_dashboard",
    "manage_barbearia",
    "create_appointments",
    "cancel_appointments",
  ],
};

// Função auxiliar para verificar se um role tem uma permissão
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return RolePermissions[role]?.includes(permission) ?? false;
}

// Função auxiliar para verificar se um role tem qualquer uma das permissões
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

// Função auxiliar para verificar se um role tem todas as permissões
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

