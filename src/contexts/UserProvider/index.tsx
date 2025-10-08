import { createContext, useState } from "react";
import { addToast } from "@heroui/react";
import Cookies from "js-cookie";

import {
  IContext,
  IUser,
  IUserProvider,
  PasswordForm,
  UpdateProfilePayload,
} from "./types";
import { getUser, updateUserPassword, updateUserProfile } from "./util";

import { useAuth } from "@/contexts/AuthProvider";

export const UserContext = createContext<IContext>({} as IContext);

export const UserProvider = ({ children }: IUserProvider) => {
  const [userData, setUserdata] = useState<IUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { user, checkAuth } = useAuth();

  // FUNÇÃO PARA BUSCAR TODOS OS DADOS DO USUÁRIO
  async function searchUser(id: string) {
    try {
      const response = await getUser(id);

      const data = (response && (response.user ?? response)) as IUser;

      setUserdata(data);
    } catch {}
  }

  // FUNÇÃO PARA ALTERAR A SENHA DO USUÁRIO
  async function onChangePassword(data: PasswordForm) {
    try {
      await updateUserPassword({
        senha_atual: data.senha_atual,
        nova_senha: data.nova_senha,
      });
      addToast({
        title: "Sucesso",
        description: "Senha alterada com sucesso.",
        color: "success",
        timeout: 4000,
      });
    } catch (error) {
      addToast({
        title: "Falha ao alterar senha",
        description:
          (error as any).response?.data?.error || "Erro ao alterar senha",
        color: "danger",
        timeout: 5000,
      });
    }
  }

  // FUNÇÃO PARA ALTERAR OS DADOS DO USUÁRIO
  async function onSubmitFormProfile(data: UpdateProfilePayload) {
    try {
      const payload = {
        ...data,
        telefone: (data.telefone || "").replace(/\D/g, ""),
      };

      const response = await updateUserProfile(payload);

      // Atualiza cookie com os dados locais (ou da resposta se existir)
      const updatedUser = {
        ...(user?.user || {}),
        nome: response?.user?.nome ?? data.nome,
        email: response?.user?.email ?? data.email,
        telefone: response?.user?.telefone ?? payload.telefone,
      };
      const token =
        response?.token || user?.token || Cookies.get("barberToken") || "";

      Cookies.set("barberId", JSON.stringify({ token, user: updatedUser }), {
        expires: (30 / 1440) * 24,
      });
      if (token) {
        Cookies.set("barberToken", token, { expires: (30 / 1440) * 24 });
      }
      await checkAuth();
      addToast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso.",
        color: "success",
        timeout: 4000,
      });
      setIsEditing(false);
    } catch (error) {
      addToast({
        title: "Falha ao atualizar",
        description:
          (error as any).response?.data?.error || "Erro ao atualizar perfil",
        color: "danger",
        timeout: 5000,
      });
    }
  }

  return (
    <UserContext.Provider
      value={{
        searchUser,
        onChangePassword,
        userData,
        onSubmitFormProfile,
        isEditing,
        setIsEditing,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
