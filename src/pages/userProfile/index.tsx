import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Input } from "@heroui/input";
import { Button, Card, CardBody, Divider, ToastProvider } from "@heroui/react";
import { useNavigate, useParams } from "react-router-dom";

import { formatPhone } from "@/utils/format-Cpf-Phone";
import { Header } from "@/components/Header";
import { useUser } from "@/contexts/UserProvider/useUser";
import { PasswordForm } from "@/contexts/UserProvider/types";
import { useAuth } from "@/contexts/AuthProvider";

function getInitials(fullName: string) {
  const parts = (fullName || "").trim().split(/\s+/);

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  const first = parts[0].slice(0, 1).toUpperCase();
  const last = parts[parts.length - 1].slice(0, 1).toUpperCase();

  return `${first}${last}`;
}

function UserProfile() {
  const {
    userData,
    searchUser,
    onChangePassword,
    onSubmitFormProfile,
    isEditing,
    setIsEditing,
  } = useUser();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    // Buscar dados do usuário quando o componente for montado
    const fetchUser = async () => {
      if (id && id !== user?.user?.id) {
        // Se o ID da URL for diferente do usuário logado, buscar dados específicos
        await searchUser(id);
      } else if (user?.user && !userData) {
        // Se for o próprio usuário e não há dados carregados, buscar dados específicos
        await searchUser(user.user.id);
      }
    };

    fetchUser();
  }, []);

  // Usar dados do contexto de autenticação se não houver dados específicos carregados
  const currentUser =
    userData ||
    (user?.user as
      | { nome: string; email: string; telefone: string }
      | undefined);

  type ProfileFormData = {
    nome: string;
    email: string;
    telefone: string;
  };

  const defaultValues = useMemo<ProfileFormData>(
    () => ({
      nome: currentUser?.nome || "",
      email: currentUser?.email || "",
      telefone: currentUser?.telefone || "",
    }),
    [currentUser]
  );

  const schema_user = yup.object().shape({
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
    control: control_user,
    handleSubmit: handleSubmit_user,
    formState: { isSubmitting: isSubmitting_user },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(schema_user),
    defaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

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

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<PasswordForm>({
    resolver: yupResolver(schema),
    defaultValues: { senha_atual: "", nova_senha: "", confirma: "" },
  });

  useEffect(() => {
    reset({ senha_atual: "", nova_senha: "", confirma: "" });
  }, [reset]);

  const [initials, setInitials] = useState<string>("");

  useEffect(() => {
    // Atualiza as iniciais sempre que o nome mudar
    const newInitials = getInitials(user?.user.nome ?? "");

    setInitials(newInitials);
  }, [user?.user.nome]);

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

          {/*   FORMULÁRIO DE ATUALIZAÇÃO DE DADOS  */}
          <Card className="bg-gray-900 border border-gray-700">
            <CardBody className="gap-4">
              <form
                className="flex flex-col gap-4 w-full max-w-xl mx-auto"
                onSubmit={handleSubmit_user(onSubmitFormProfile)}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    control={control_user}
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
                    control={control_user}
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
                      control={control_user}
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
                    disabled={isSubmitting_user}
                    isLoading={isSubmitting_user}
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

          {/*   FORMULÁRIO DE ATUALIZAÇÃO DE SENHA  */}
          <Card className="bg-gray-900 border border-gray-700">
            <CardBody className="gap-4">
              <h2 className="text-lg text-white font-semibold">
                Alterar senha
              </h2>
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
        </div>
      </div>
    </section>
  );
}

export default function UserProfilePage() {
  return <UserProfile />;
}
