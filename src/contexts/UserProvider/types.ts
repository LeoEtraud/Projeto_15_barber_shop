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

// ATUALIZAÇÃO DE PERFIL DO USUÁRIO (NOME, EMAIL, TELEFONE)
export interface UpdateProfilePayload {
  nome: string;
  email: string;
  telefone: string;
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
  onSubmitFormProfile: (data: UpdateProfilePayload) => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
}

export interface IUserProvider {
  children: JSX.Element;
}
