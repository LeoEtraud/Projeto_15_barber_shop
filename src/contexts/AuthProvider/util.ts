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
export async function LoginRequest(identifier: string, senha: string) {
  try {
    const isEmail = identifier.includes("@");
    const telefoneDigits = identifier.replace(/\D/g, "");
    const payload = isEmail
      ? { email: identifier, senha }
      : { telefone: telefoneDigits, senha };

    const request = await apiBarber.post("/auth", payload);

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
export async function sendNewPassword(
  codigo_recupera_senha: string,
  nova_senha: string,
) {
  try {
    const request = await apiBarber.post("/reset-password", {
      codigo_recupera_senha,
      nova_senha,
    });

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}
