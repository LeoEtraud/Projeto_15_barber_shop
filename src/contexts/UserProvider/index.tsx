import { createContext, useState } from "react";
import { addToast } from "@heroui/react";

import { IContext, IUser, IUserProvider, UpdatePasswordPayload } from "./types";
import { getUser, updateUserPassword, updateUserProfile } from "./util";

export const UserContext = createContext<IContext>({} as IContext);

export const UserProvider = ({ children }: IUserProvider) => {
  const [userData, setUserdata] = useState<IUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // Função para limpar os dados do usuário
  const clearUserData = () => {
    setUserdata(null);
  };

  // FUNÇÃO PARA BUSCAR TODOS OS DADOS DO USUÁRIO
  async function searchUser(id: string) {
    try {
      setIsLoadingUser(true);

      const response = await getUser(id);

      // A API retorna { user: { nome, email, telefone } } mas não inclui o id
      // Vamos adicionar o id que foi usado na busca
      const userData = response?.user || response;

      if (userData && (userData.nome || userData.email)) {
        const data: IUser = {
          id: id, // Usar o id que foi passado como parâmetro
          nome: userData.nome || "",
          email: userData.email || "",
          telefone: userData.telefone || "",
          data_nascimento: userData.data_nascimento || "",
        };

        setUserdata(data);
      } else {
        addToast({
          title: "Aviso",
          description: "Dados do usuário não encontrados.",
          color: "warning",
          timeout: 4000,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      addToast({
        title: "Erro",
        description: "Falha ao carregar dados do usuário. Tente novamente.",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setIsLoadingUser(false);
    }
  }

  // FUNÇÃO PARA ALTERAR OS DADOS DO USUÁRIO
  async function onSubmitFormProfile(data: IUser) {
    try {
      const payload = {
        ...data,
        telefone: (data.telefone || "").replace(/\D/g, ""),
      };

      await updateUserProfile(payload);

      addToast({
        title: "Sucesso",
        description:
          "Perfil atualizado com sucesso. Você será redirecionado para fazer login novamente.",
        color: "success",
        timeout: 5000,
      });

      // Limpar dados do usuário após atualização
      setUserdata(null);

      // Aguardar um pouco para o usuário ver a mensagem de sucesso
      setTimeout(() => {
        // Fazer logout para forçar novo login
        window.location.href = "/";
      }, 2000);
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

  // FUNÇÃO PARA ALTERAR A SENHA DO USUÁRIO
  async function onChangePassword(data: UpdatePasswordPayload) {
    try {
      await updateUserPassword({
        id: data.id,
        senha_atual: data.senha_atual,
        nova_senha: data.nova_senha,
      });

      addToast({
        title: "Sucesso",
        description:
          "Senha alterada com sucesso. Você será redirecionado para fazer login novamente.",
        color: "success",
        timeout: 5000,
      });

      // Limpar dados do usuário após alteração de senha
      setUserdata(null);

      // Aguardar um pouco para o usuário ver a mensagem de sucesso
      setTimeout(() => {
        // Fazer logout para forçar novo login
        window.location.href = "/";
      }, 2000);
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

  return (
    <UserContext.Provider
      value={{
        searchUser,
        onChangePassword,
        userData,
        onSubmitFormProfile,
        isLoadingUser,
        clearUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
