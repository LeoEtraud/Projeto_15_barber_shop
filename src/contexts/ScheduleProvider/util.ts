import { apiBarber } from "@/services/apiServer";

// CHAMADA DA API PARA BUSCA DE TODOS OS BARBEIROS
export async function GetBarbersAll() {
  try {
    const request = await apiBarber.get("/get-barbers");

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

// CHAMADA DA API PARA BUSCA DE TODOS OS SERVIÇOS
export async function GetServicesAll() {
  try {
    const request = await apiBarber.get("/get-services");

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

// CHAMADA DA API PARA BUSCA DE TODOS AGENDAMENTOS CONFIRMADOS DO BARBEIRO
export async function GetSchedulesAll(barbeiroId: string) {
  try {
    if (!barbeiroId) {
      throw new Error("ID do barbeiro é obrigatório");
    }

    const request = await apiBarber.get(`/get-schedules/${barbeiroId}`);

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

// CHAMADA DA API PARA BUSCA DE TODOS OS AGENDAMENTOS DO CLIENTE
export async function GetAppointments(id: string) {
  try {
    const request = await apiBarber.get(`/get-appointments/${id}`);

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

// CHAMADA DA API PARA BUSCAR AGENDAMENTOS POR PROFISSIONAL ID
export async function GetAppointmentsByProfessional(profissionalId: string) {
  try {
    if (!profissionalId) {
      throw new Error("ID do profissional é obrigatório");
    }

    const request = await apiBarber.get(
      `/get-appointments-professional/${profissionalId}`
    );

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}
