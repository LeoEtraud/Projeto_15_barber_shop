import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Input } from "@heroui/input";
import {
  addToast,
  Button,
  Card,
  CardBody,
  Divider,
  ToastProvider,
} from "@heroui/react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthProvider/useAuth";
import { updateUserProfile } from "@/contexts/AuthProvider/util";
import { formatPhone } from "@/utils/format-Cpf-Phone";
import { Header } from "@/components/Header";

type ProfileFormData = {
  nome: string;
  email: string;
  telefone: string;
};

const MOCK_PROFILE: ProfileFormData = {
  nome: "Leonardo Duarte",
  email: "leonardo.duarte.of@gmail.com",
  telefone: "(98) 98519-8944",
};

function getInitials(fullName: string) {
  const parts = (fullName || "").trim().split(/\s+/);

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  const first = parts[0].slice(0, 1).toUpperCase();
  const last = parts[parts.length - 1].slice(0, 1).toUpperCase();

  return `${first}${last}`;
}

export function UserProfilePage() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const currentUser = user?.user;

  const defaultValues = useMemo<ProfileFormData>(
    () => ({
      nome: currentUser?.nome || MOCK_PROFILE.nome,
      email: currentUser?.email || MOCK_PROFILE.email,
      telefone: currentUser?.tefefone || MOCK_PROFILE.telefone,
    }),
    [currentUser]
  );

  const schema = yup.object().shape({
    nome: yup.string().min(3).required("O Nome é obrigatório"),
    email: yup.string().email().required("O E-mail é obrigatório"),
    telefone: yup
      .string()
      .required("O número de contato é obrigatório")
      .test(
        "telefone-valido",
        "O contato deve conter no mínimo 11 números.",
        (value) => {
          const digits = (value || "").replace(/\D/g, "");

          return digits.length >= 11;
        }
      ),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(schema),
    defaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  async function onSubmit(data: ProfileFormData) {
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
        tefefone: response?.user?.tefefone ?? payload.telefone,
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

  const initials = getInitials(defaultValues.nome || "");

  return (
    <section className="min-h-screen bg-gray-800 flex flex-col text-white">
      {/* COMPONENTE CABEÇALHO */}
      <Header />

      {/* Conteúdo principal */}
      <div className="flex items-center justify-center flex-1 px-4 py-8 md:px-8">
        <div className="relative border border-gray-700 bg-gray-800 rounded-lg px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8 flex flex-col gap-8 w-full max-w-2xl">
          <Helmet title="Perfil" />
          <ToastProvider placement={"top-right"} toastOffset={60} />

          <button
            aria-label="Fechar"
            className="absolute right-3 top-3 h-8 w-8 flex items-center justify-center rounded-full text-gray-200 hover:text-white hover:bg-gray-700 transition"
            title="Fechar"
            type="button"
            onClick={() => navigate(-1)}
          >
            ×
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold select-none">
              {initials}
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold">Meu perfil</h1>
              <span className="text-gray-400 text-sm">
                As iniciais são geradas automaticamente
              </span>
            </div>
          </div>

          <Card className="bg-gray-900 border border-gray-700">
            <CardBody className="gap-4">
              <form
                className="flex flex-col gap-4 w-full max-w-xl mx-auto"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    control={control}
                    name="nome"
                    render={({ field }) => (
                      <Input
                        isRequired
                        autoComplete="name"
                        className="w-full p-3 rounded-lg text-black focus:outline-none"
                        id="nome"
                        isReadOnly={!isEditing}
                        label="Nome"
                        maxLength={60}
                        size="sm"
                        type="text"
                        {...field}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="telefone"
                    render={({ field }) => (
                      <Input
                        isRequired
                        autoComplete="tel"
                        className="w-full p-3 rounded-lg text-black focus:outline-none"
                        id="telefone"
                        inputMode="numeric"
                        isReadOnly={!isEditing}
                        label="Nº de contato"
                        maxLength={15}
                        size="sm"
                        type="tel"
                        {...field}
                        value={formatPhone(field.value || "")}
                        onChange={(e) =>
                          field.onChange(formatPhone(e.target.value))
                        }
                      />
                    )}
                  />

                  <div className="md:col-span-2">
                    <Controller
                      control={control}
                      name="email"
                      render={({ field }) => (
                        <Input
                          isRequired
                          autoComplete="email"
                          className="w-full p-3 rounded-lg text-black focus:outline-none"
                          id="email"
                          isReadOnly={!isEditing}
                          label="E-mail"
                          maxLength={60}
                          size="sm"
                          type="email"
                          {...field}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    color="primary"
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    radius="full"
                    type={isEditing ? "submit" : "button"}
                    variant="shadow"
                    onClick={() => {
                      if (!isEditing) setIsEditing(true);
                    }}
                  >
                    {isEditing ? "Salvar alterações" : "Editar"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <Divider className="bg-gray-700" />

          <PasswordSection />
        </div>
      </div>
    </section>
  );
}

function PasswordSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [isVisibleNew, setIsVisibleNew] = useState(false);
  const [isVisibleConfirm, setIsVisibleConfirm] = useState(false);

  const schema = yup.object().shape({
    senha_atual: yup.string().required("Informe a senha atual"),
    nova_senha: yup.string().min(6).required("Informe a nova senha"),
    confirma: yup
      .string()
      .oneOf([yup.ref("nova_senha"), ""], "As senhas não coincidem")
      .required("Confirme a nova senha"),
  });

  type PasswordForm = {
    senha_atual: string;
    nova_senha: string;
    confirma: string;
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<PasswordForm>({
    resolver: yupResolver(schema),
    defaultValues: { senha_atual: "", nova_senha: "", confirma: "" },
  });

  async function onChangePassword(data: PasswordForm) {
    try {
      const { updateUserPassword } = await import(
        "@/contexts/AuthProvider/util"
      );

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
      reset();
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
    <Card className="bg-gray-900 border border-gray-700">
      <CardBody className="gap-4">
        <h2 className="text-lg text-white font-semibold">Alterar senha</h2>
        <form
          className="flex flex-col gap-4 w-full max-w-xl mx-auto"
          onSubmit={handleSubmit(onChangePassword)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="md:col-span-2">
              <Controller
                control={control}
                name="senha_atual"
                render={({ field }) => (
                  <Input
                    isRequired
                    className="w-full p-3 rounded-lg text-black focus:outline-none"
                    id="senha_atual"
                    label="Senha atual"
                    size="sm"
                    type={isVisible ? "text" : "password"}
                    {...field}
                    endContent={
                      <button
                        aria-label="toggle"
                        className="text-xs"
                        type="button"
                        onClick={() => setIsVisible((v) => !v)}
                      >
                        {isVisible ? "Ocultar" : "Mostrar"}
                      </button>
                    }
                  />
                )}
              />
            </div>

            <Controller
              control={control}
              name="nova_senha"
              render={({ field }) => (
                <Input
                  isRequired
                  className="w-full p-3 rounded-lg text-black focus:outline-none"
                  id="nova_senha"
                  label="Nova senha"
                  size="sm"
                  type={isVisibleNew ? "text" : "password"}
                  {...field}
                  endContent={
                    <button
                      aria-label="toggle"
                      className="text-xs"
                      type="button"
                      onClick={() => setIsVisibleNew((v) => !v)}
                    >
                      {isVisibleNew ? "Ocultar" : "Mostrar"}
                    </button>
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="confirma"
              render={({ field }) => (
                <Input
                  isRequired
                  className="w-full p-3 rounded-lg text-black focus:outline-none"
                  id="confirma"
                  label="Confirme a nova senha"
                  size="sm"
                  type={isVisibleConfirm ? "text" : "password"}
                  {...field}
                  endContent={
                    <button
                      aria-label="toggle"
                      className="text-xs"
                      type="button"
                      onClick={() => setIsVisibleConfirm((v) => !v)}
                    >
                      {isVisibleConfirm ? "Ocultar" : "Mostrar"}
                    </button>
                  }
                />
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button
              color="primary"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              radius="full"
              type="submit"
              variant="shadow"
            >
              Salvar Nova Senha
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
