import axios from "axios";
import Cookies from "js-cookie";

// Usando import.meta.env para acessar variáveis de ambiente no Vite
export const apiBarber = axios.create({
  baseURL: import.meta.env.VITE_API,
});

// Interceptor para adicionar o token de autorização
apiBarber.interceptors.request.use((config) => {
  const token = Cookies.get("barberToken"); // Pegue o token do cookie a cada requisição

  if (!config.url?.includes("/auth")) {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Interceptor para tratar a resposta e atualizar o token
apiBarber.interceptors.response.use(
  (response) => {
    const newToken = response.headers["new-token"];

    if (newToken) {
      Cookies.set("barberToken", newToken);
    }

    return response;
  },
  (error) => {
    const { response, config } = error;

    // se for a chamada de login, deixa o erro fluir pra catch() do signIn
    if (config.url?.endsWith("/auth")) {
      return Promise.reject(error);
    }
    // caso contrário, trata 401 como logout
    if (response?.status === 401) {
      // Aqui seu logout forçado
      Cookies.remove("barberId");
      Cookies.remove("barberToken");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);
