import Cookies from "js-cookie";

import { IPayLoad } from "./types";

import { apiBarber } from "@/services/apiServer";

export function setUserLocalStorage(user: IPayLoad | null) {
  Cookies.set("barberId", JSON.stringify(user), {
    expires: (30 / 1440) * 24, //12horas
  });
  if (user && user.token) {
    Cookies.set("barberToken", user.token, {
      expires: (30 / 1440) * 24, //12horas
    });
  }
}

export function getUserLocalStorage() {
  const json = Cookies.get("barberId");

  if (!json) {
    return null;
  }

  const user = JSON.parse(json);

  return user ?? null;
}

export function getTokenLocalStorage() {
  const token = Cookies.get("barberToken");

  if (!token) {
    return null;
  }

  return token;
}

export async function LoginRequest(cpf: string, password: string) {
  try {
    const request = await apiBarber.post("/auth", { cpf, password });

    return request.data;
  } catch (error) {
    return Promise.reject(error);
  }
}
