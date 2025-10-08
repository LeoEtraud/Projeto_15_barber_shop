import { UpdatePasswordPayload, UpdateProfilePayload } from "./types";

import { apiBarber } from "@/services/apiServer";

// CHAMADA DA API PARA CRIAÇÃO DE NOVO USUÁRIO
export async function getUser(id: string) {
  try {
    const request = await apiBarber.get(`/get-user/${id}`);

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

// CHAMADA DA API PARA ATUALIZAÇÃO DE DADOS DO USUÁRIO
export async function updateUserProfile(payload: UpdateProfilePayload) {
  try {
    const sanitized = {
      ...payload,
      telefone: (payload.telefone || "").replace(/\D/g, ""),
    };

    const request = await apiBarber.put("/update-user", sanitized);

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function updateUserPassword(payload: UpdatePasswordPayload) {
  try {
    const request = await apiBarber.post("/change-password", payload);

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}
