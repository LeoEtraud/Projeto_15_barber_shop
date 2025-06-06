import { apiBarber } from "@/services/apiServer";
import { SignInFormData } from "@/pages/createAccount";

// CHAMADA DA API PARA CRIAÇÃO DE NOVO USUÁRIO
export async function SendCreateUser(data: SignInFormData) {
  try {
    const request = await apiBarber.post("/register-user", data);

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

// CHAMADA DA API PARA REALIZAÇÃO DO LOGIN
export async function LoginRequest(phone_number: string, password: string) {
  try {
    const request = await apiBarber.post("/auth", { phone_number, password });

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

// CHAMADA PARA API DE ENVIO DE EMAIL PARA RECUPERAÇÃO DE SENHA
export async function postCodeRecoverPassword(email: string) {
  try {
    const request = await apiBarber.post("/recover-password", {
      email,
    });

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}

// CHAMADA PARA API DE ENVIO DE EMAIL PARA RECUPERAÇÃO DE SENHA
export async function sendNewPassword(token: string, new_password: string) {
  try {
    const request = await apiBarber.post("/reset-password", {
      token,
      new_password,
    });

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}
