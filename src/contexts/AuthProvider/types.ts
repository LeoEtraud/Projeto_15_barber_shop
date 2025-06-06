export interface IPayLoad {
  msg?: string;
  token: string;
  user: IUser;
}

export interface IUser {
  id: string;
  username: string;
  email: string;
  phone_number: string;
}

export type SignInFormData = {
  phone_number: string;
  password: string;
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
