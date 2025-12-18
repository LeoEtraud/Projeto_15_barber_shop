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

// CHAMADA DA API PARA BUSCA DE TODOS OS PROFISSIONAIS
export async function GetProfessionalsAll() {
  try {
    const request = await apiBarber.get("/get-professional-all");

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

// CHAMADA DA API PARA CONFIRMAR ATENDIMENTO
export async function ConfirmAppointment(appointmentId: string) {
  try {
    if (!appointmentId) {
      throw new Error("ID do agendamento é obrigatório");
    }

    const request = await apiBarber.patch(
      `/confirm-appointment/${appointmentId}`,
      {
        status: "REALIZADO",
      }
    );

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

// CHAMADA DA API PARA CRIAR PROFISSIONAL
export async function CreateProfessional(data: {
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  funcao?: string;
  avatar?: string;
  barbeariaId?: string;
}) {
  try {
    const request = await apiBarber.post("/create-professional", data);

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

// CHAMADA DA API PARA ATUALIZAR PROFISSIONAL
export async function UpdateProfessional(
  barberId: string,
  data: {
    nome?: string;
    email?: string;
    telefone?: string;
    data_nascimento?: string;
    funcao?: string;
    avatar?: string;
    status?: string;
  }
) {
  try {
    if (!barberId) {
      throw new Error("ID do barbeiro é obrigatório");
    }

    const request = await apiBarber.patch(
      `/update-professional/${barberId}`,
      data
    );

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

// CHAMADA DA API PARA EXCLUIR PROFISSIONAL
export async function DeleteProfessional(professionalId: string) {
  try {
    if (!professionalId) {
      throw new Error("ID do profissional é obrigatório");
    }

    const request = await apiBarber.delete(
      `/delete-professional/${professionalId}`
    );

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

// CHAMADA DA API PARA CRIAR SERVIÇO
export async function CreateService(data: {
  nome: string;
  preco: string;
  duracao: number;
  imagem?: string;
}) {
  try {
    const request = await apiBarber.post("/create-service", data);

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

// CHAMADA DA API PARA ATUALIZAR SERVIÇO
export async function UpdateService(
  serviceId: string,
  data: {
    nome?: string;
    preco?: string;
    duracao?: number;
    imagem?: string;
    status?: string;
  }
) {
  try {
    if (!serviceId) {
      throw new Error("ID do serviço é obrigatório");
    }

    const request = await apiBarber.patch(`/update-service/${serviceId}`, data);

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

// CHAMADA DA API PARA EXCLUIR SERVIÇO
export async function DeleteService(serviceId: string) {
  try {
    if (!serviceId) {
      throw new Error("ID do serviço é obrigatório");
    }

    const request = await apiBarber.delete(`/delete-service/${serviceId}`);

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}
