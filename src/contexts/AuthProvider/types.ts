import { IUser } from "../UserProvider/types";

export interface IPayLoad {
  msg?: string;
  token: string;
  user: IUser;
}

export type SignInFormData = {
  nome: string;
  data_nascimento: string;
  email: string;
  telefone: string;
  senha: string;
};

export interface IContext {
  token: string | null;
  authenticate: (data: IPayLoad) => void;
  user: IPayLoad | null;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

export interface IAuthProvider {
  children: JSX.Element;
}
