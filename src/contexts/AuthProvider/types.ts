export interface IPayLoad {
  msg?: string;
  token: string;
  user: IUser;
}

export interface IUser {
  id: string;
  nome: string;
  email: string;
  tefefone: string;
}

export type SignInFormData = {
  telefone: string;
  senha: string;
};

export interface IContext {
  token: string | null;
  authenticate: (data: IPayLoad) => void;
  user: IPayLoad | null;
  checkAuth: () => void;
  logout: () => void;
}

export interface IAuthProvider {
  children: JSX.Element;
}
