import axios from "axios";

// Usando import.meta.env para acessar variáveis de ambiente no Vite
export const apiBarber = axios.create({
  baseURL: import.meta.env.VITE_API,
});
