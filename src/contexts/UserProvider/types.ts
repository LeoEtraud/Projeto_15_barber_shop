export interface IUser {
  id: string;
  nome: string;
  email: string;
  telefone: string;
}

// ATUALIZAÇÃO DE SENHA DO USUÁRIO
export interface UpdatePasswordPayload {
  senha_atual: string;
  nova_senha: string;
}

export type PasswordForm = {
  senha_atual: string;
  nova_senha: string;
  confirma: string;
};

export interface IContext {
  searchUser: (id: string) => void;
  userData: IUser | null;
  onChangePassword: (data: PasswordForm) => void;
  onSubmitFormProfile: (data: IUser) => void;
}

export interface IUserProvider {
  children: JSX.Element;
}
