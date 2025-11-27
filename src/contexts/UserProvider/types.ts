export interface IUser {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
}

// ATUALIZAÇÃO DE SENHA DO USUÁRIO
export interface UpdatePasswordPayload {
  id: string;
  senha_atual: string;
  nova_senha: string;
}

export type PasswordForm = {
  senha_atual: string;
  nova_senha: string;
  confirma_nova_senha: string;
};

export interface IContext {
  searchUser: (id: string) => void;
  userData: IUser | null;
  onChangePassword: (data: UpdatePasswordPayload) => void;
  onSubmitFormProfile: (data: IUser) => void;
  isLoadingUser: boolean;
  clearUserData: () => void;
}

export interface IUserProvider {
  children: JSX.Element;
}
