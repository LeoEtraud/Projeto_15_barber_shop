import { apiBarber } from "@/services/apiServer";

// Interface para os dados do dashboard do gestor
export interface DashboardStats {
  totalClientes: number;
  agendamentosHoje: number;
  quantidadeProfissionais: number;
  receitaMes: number;
}

// CHAMADA DA API PARA BUSCAR ESTATÍSTICAS DO DASHBOARD DO GESTOR
export async function getDashboardStats(
  barbeariaId: string
): Promise<DashboardStats> {
  try {
    if (!barbeariaId) {
      throw new Error("ID da barbearia é obrigatório");
    }

    const request = await apiBarber.get(
      `/gestor/dashboard/stats/${barbeariaId}`
    );

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}
