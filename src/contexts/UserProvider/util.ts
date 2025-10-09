import { IUser, UpdatePasswordPayload } from "./types";

import { apiBarber } from "@/services/apiServer";

// CHAMADA DA API PARA BUSCA DE DADOS DO USUÁRIO
export async function getUser(id: string) {
  try {
    const request = await apiBarber.get(`/get-user/${id}`);

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

// CHAMADA DA API PARA ATUALIZAÇÃO DE DADOS DO PERFIL DO USUÁRIO
export async function updateUserProfile(payload: IUser) {
  try {
    const request = await apiBarber.put("/update-user", payload);

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

// CHAMADA DA API PARA ATUALIZAÇÃO DE SENHA DO USUÁRIO
export async function updateUserPassword(payload: UpdatePasswordPayload) {
  try {
    const request = await apiBarber.post("/change-password", payload);

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}
