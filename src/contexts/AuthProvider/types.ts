export interface IContext {}

export interface IPayLoad {
  msg?: string;
  token: string;
  user: IUser;
  permissions: string[];
}

export interface IUser {
  cpf: string;
  senha: string;
}

export interface IAuthProvider {
  children: JSX.Element;
}
