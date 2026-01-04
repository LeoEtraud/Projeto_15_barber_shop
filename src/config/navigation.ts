import { UserRole, Permission } from "@/types/roles";

export interface NavigationItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  /**
   * Roles permitidos para ver este item
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
}

/**
 * Configuração de navegação da aplicação
 * Cada item será exibido apenas se o usuário tiver as permissões necessárias
 */
export const navigationItems: NavigationItem[] = [
  // Rotas para CLIENTE
  {
    id: "agendamento",
    title: "Realizar Agendamento",
    description: "Agende seu horário com nossos barbeiros",
    icon: "✂️",
    path: "/choice-barber",
    allowedRoles: [UserRole.CLIENTE],
    requiredPermissions: ["create_appointments"],
  },
  {
    id: "meus-agendamentos",
    title: "Meus Agendamentos",
    description: "Veja seus agendamentos confirmados e realizados",
    icon: "📅",
    path: "/history-appointments",
    allowedRoles: [UserRole.CLIENTE],
    requiredPermissions: ["view_own_appointments"],
  },

  // Rotas para PROFISSIONAL
  {
    id: "dashboard-profissional",
    title: "Dashboard",
    description: "Visualize seus atendimentos e estatísticas",
    icon: "📊",
    path: "/profissional/dashboard",
    allowedRoles: [UserRole.PROFISSIONAL, UserRole.GESTOR],
    requiredPermissions: ["view_dashboard"],
  },
  {
    id: "agendamentos-profissional",
    title: "Meus Agendamentos",
    description: "Veja seus agendamentos como profissional",
    icon: "📅",
    path: "/history-appointments",
    allowedRoles: [UserRole.PROFISSIONAL],
    requiredPermissions: ["view_appointments"],
  },

  // Rotas para GESTOR
  {
    id: "dashboard-gestor",
    title: "Dashboard Gestor",
    description: "Visão geral da barbearia",
    icon: "🏢",
    path: "/gestor/dashboard",
    allowedRoles: [UserRole.GESTOR],
    requiredPermissions: ["view_dashboard"],
  },
  {
    id: "gerenciar-barbeiros",
    title: "Gerenciar Barbeiros",
    description: "Gerencie os profissionais da barbearia",
    icon: "👨‍💼",
    path: "/gestor/barbeiros",
    allowedRoles: [UserRole.GESTOR],
    requiredPermissions: ["manage_barbers"],
  },
  {
    id: "agendamentos-gestor",
    title: "Todos os Agendamentos",
    description: "Visualize todos os agendamentos da barbearia",
    icon: "📋",
    path: "/history-appointments",
    allowedRoles: [UserRole.GESTOR],
    requiredPermissions: ["view_all_appointments"],
  },
  {
    id: "gerenciar-horarios",
    title: "Gerenciar Horários",
    description: "Configure os horários de funcionamento da barbearia",
    icon: "🕐",
    path: "/gestor/horarios",
    allowedRoles: [UserRole.GESTOR],
    requiredPermissions: ["manage_schedules"],
  },
];

/**
 * Filtra os itens de navegação baseado no role e permissões do usuário
 */
export function getFilteredNavigation(
  userRole: UserRole,
  checkAnyPermission: (permissions: Permission[]) => boolean,
  checkAllPermissions: (permissions: Permission[]) => boolean
): NavigationItem[] {
  return navigationItems.filter((item) => {
    // Verifica roles permitidos
    if (item.allowedRoles && item.allowedRoles.length > 0) {
      if (!item.allowedRoles.includes(userRole)) {
        return false;
      }
    }

    // Verifica permissões necessárias
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      if (item.requireAllPermissions) {
        return checkAllPermissions(item.requiredPermissions);
      } else {
        return checkAnyPermission(item.requiredPermissions);
      }
    }

    return true;
  });
}
