import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Input } from "@heroui/input";
import { Button, Card, CardBody, Image, ToastProvider } from "@heroui/react";
import { useNavigate, useParams } from "react-router-dom";
import { XCircleIcon } from "@heroicons/react/24/solid";

import eye_slash from "@/assets/eye-slash.svg";
import eye from "@/assets/eye.svg";
import { formatPhone } from "@/utils/format-Cpf-Phone";
import { Header } from "@/components/Header";
import { useUser } from "@/contexts/UserProvider/useUser";
import { IUser, PasswordForm } from "@/contexts/UserProvider/types";
import { useAuth } from "@/contexts/AuthProvider";

// FUNÇÃO PARA DEFINIR AS LETRAS INICIAIS DO USUÁRIO
function getInitials(fullName: string) {
  const parts = (fullName || "").trim().split(/\s+/);

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  const first = parts[0].slice(0, 1).toUpperCase();
  const last = parts[parts.length - 1].slice(0, 1).toUpperCase();

  return `${first}${last}`;
}

export function UserProfilePage() {
  const { userData, searchUser, onChangePassword, onSubmitFormProfile } =
    useUser();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    // Sempre buscar dados quando o componente montar ou o ID mudar
    if (id) {
      searchUser(id);
    }
  }, [id]);

  // Usar dados do contexto de autenticação se não houver dados específicos carregados
  const currentUser =
    userData ||
    (user?.user as
      | {
          nome: string;
          email: string;
          telefone: string;
          data_nascimento?: string;
        }
      | undefined);

  const defaultValues = useMemo<IUser>(
    () => ({
      id: user?.user?.id ?? (id as string) ?? "",
      nome: currentUser?.nome || "",
      email: currentUser?.email || "",
      telefone: currentUser?.telefone || "",
      data_nascimento: currentUser?.data_nascimento || "",
    }),
    [currentUser]
  );

  const schema_user = yup.object().shape({
    id: yup.string().min(3).required("O Nome é obrigatório"),
    nome: yup.string().min(3).required("O Nome é obrigatório"),
    email: yup
      .string()
      .required("O E-mail é obrigatório")
      .email("Formato de e-mail inválido")
      .matches(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "E-mail deve seguir o padrão: exemplo@dominio.com"
      )
      .test(
        "email-valido",
        "E-mail inválido. Use um formato válido como: usuario@exemplo.com",
        (value) => {
          if (!value) return false;

          // Validação adicional: verifica se o domínio tem pelo menos 2 caracteres
          const parts = value.split("@");

          if (parts.length !== 2) return false;

          const [user, domain] = parts;

          if (!user || user.length < 1) return false;

          if (!domain || !domain.includes(".")) return false;

          const domainParts = domain.split(".");

          return domainParts.every((part) => part.length >= 2);
        }
      ),
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
    data_nascimento: yup
      .string()
      .required("A data de nascimento é obrigatória")
      .test("data-valida", "Informe uma data válida", (value) => {
        if (!value) return false;

        const birthDate = new Date(value);
        const today = new Date();

        // Verifica se a data é válida
        if (isNaN(birthDate.getTime())) return false;

        // Verifica se não é uma data futura
        return birthDate <= today;
      })
      .test("idade-minima", "Você deve ter pelo menos 13 anos", (value) => {
        if (!value) return false;

        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        // Calcula idade exata
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          return age - 1 >= 13;
        }

        return age >= 13;
      })
      .test("idade-maxima", "Idade inválida", (value) => {
        if (!value) return false;

        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();

        // Verifica se não tem mais de 120 anos
        return age <= 120;
      }),
  });

  const {
    control: control_user,
    handleSubmit: handleSubmit_user,
    watch,
    reset: reset_user,
    formState: { isSubmitting: isSubmitting_user, errors: errors_user },
  } = useForm<IUser>({
    resolver: yupResolver(schema_user),
    defaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  // Atualiza o formulário quando os dados do usuário mudarem
  useEffect(() => {
    if (currentUser) {
      reset_user({
        id: user?.user?.id ?? (id as string) ?? "",
        nome: currentUser.nome || "",
        email: currentUser.email || "",
        telefone: currentUser.telefone || "",
        data_nascimento: currentUser.data_nascimento || "",
      });
    }
  }, [currentUser, reset_user, user?.user?.id, id]);

  // Observa os valores do formulário para detectar alterações
  const watchedValues = watch();

  // Compara os valores atuais com os valores originais

  const hasChanges = useMemo(() => {
    if (!currentUser) return false;

    const currentNome = watchedValues.nome?.trim() || "";
    const currentEmail = watchedValues.email?.trim() || "";
    const currentTelefone = (watchedValues.telefone || "").replace(/\D/g, "");
    const currentDataNascimento = watchedValues.data_nascimento?.trim() || "";

    const originalNome = (currentUser.nome || "").trim();
    const originalEmail = (currentUser.email || "").trim();
    const originalTelefone = (currentUser.telefone || "").replace(/\D/g, "");
    const originalDataNascimento = (currentUser.data_nascimento || "").trim();

    return (
      currentNome !== originalNome ||
      currentEmail !== originalEmail ||
      currentTelefone !== originalTelefone ||
      currentDataNascimento !== originalDataNascimento
    );
  }, [watchedValues, currentUser]);

  const [isVisible, setIsVisible] = useState(false);
  const [isVisibleNew, setIsVisibleNew] = useState(false);
  const [isVisibleConfirm, setIsVisibleConfirm] = useState(false);

  const schema = yup.object().shape({
    senha_atual: yup.string().required("Informe a senha atual"),
    nova_senha: yup.string().min(6).required("Informe a nova senha"),
    confirma_nova_senha: yup
      .string()
      .oneOf([yup.ref("nova_senha"), ""], "As senhas não coincidem")
      .required("Confirme a nova senha"),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<PasswordForm>({
    resolver: yupResolver(schema),
    defaultValues: { senha_atual: "", nova_senha: "", confirma_nova_senha: "" },
  });

  useEffect(() => {
    reset({ senha_atual: "", nova_senha: "", confirma_nova_senha: "" });
  }, [reset]);

  // Função intermediária para adicionar o id ao payload antes de chamar onChangePassword
  const handlePasswordSubmit = async (data: PasswordForm) => {
    const userId = user?.user?.id ?? (id as string) ?? "";

    await onChangePassword({
      id: userId,
      senha_atual: data.senha_atual,
      nova_senha: data.nova_senha,
    });
    reset({ senha_atual: "", nova_senha: "", confirma_nova_senha: "" });
  };

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
        <div className="relative bg-gray-900 rounded-xl shadow-2xl px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8 flex flex-col gap-8 w-full max-w-4xl">
          <Helmet title="Perfil" />
          <ToastProvider placement={"top-right"} toastOffset={60} />

          <button
            aria-label="Fechar"
            className="absolute right-4 top-4 h-9 w-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200"
            title="Fechar"
            type="button"
            onClick={() => navigate(-1)}
          >
            <XCircleIcon className="w-7 h-7" />
          </button>

          {/* Header do Perfil */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 pb-6 border-b border-gray-700">
            <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white text-4xl font-bold shadow-lg select-none">
              {initials}
            </div>
            <div className="flex flex-col items-center sm:items-start gap-2 flex-1">
              <h1 className="text-3xl font-bold text-white">
                {currentUser?.nome || "Meu Perfil"}
              </h1>
            </div>
          </div>

          {/*   FORMULÁRIO DE ATUALIZAÇÃO DE DADOS  */}
          <Card className="bg-gray-800 border border-gray-700 shadow-lg">
            <CardBody className="gap-6 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <h2 className="text-xl text-white font-semibold">
                  Informações Pessoais
                </h2>
              </div>

              <form
                className="flex flex-col gap-6 w-full"
                onSubmit={handleSubmit_user(onSubmitFormProfile)}
              >
                <input id="id" name="id" type="hidden" />
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
                          errorMessage={errors_user.email?.message}
                          id="email"
                          isInvalid={!!errors_user.email}
                          label="E-mail"
                          maxLength={60}
                          size="sm"
                          type="email"
                          {...field}
                        />
                      )}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Controller
                      control={control_user}
                      name="data_nascimento"
                      render={({ field }) => (
                        <Input
                          isRequired
                          autoComplete="bday"
                          className="w-full p-3 rounded-lg text-black focus:outline-none"
                          errorMessage={errors_user.data_nascimento?.message}
                          id="data_nascimento"
                          isInvalid={!!errors_user.data_nascimento}
                          label="Data de Nascimento"
                          size="sm"
                          type="date"
                          {...field}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 ${
                      !hasChanges && !isSubmitting_user
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }`}
                    color="primary"
                    disabled={isSubmitting_user || !hasChanges}
                    isLoading={isSubmitting_user}
                    radius="lg"
                    size="lg"
                    title={
                      !hasChanges && !isSubmitting_user
                        ? "Nenhuma alteração foi feita"
                        : ""
                    }
                    type="submit"
                    variant="shadow"
                  >
                    {isSubmitting_user ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/*   FORMULÁRIO DE ATUALIZAÇÃO DE SENHA  */}
          <Card className="bg-gray-800 border border-gray-700 shadow-lg">
            <CardBody className="gap-6 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
                <h2 className="text-xl text-white font-semibold">
                  Segurança da Conta
                </h2>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 flex gap-3">
                <svg
                  className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    fillRule="evenodd"
                  />
                </svg>
                <p className="text-yellow-200 text-sm">
                  Por segurança, você precisará fazer login novamente após
                  alterar sua senha.
                </p>
              </div>

              {/* FORMULÁRIO DE ATUALIZAÇÃO DE SENHA */}
              <form
                className="flex flex-col gap-6 w-full"
                onSubmit={handleSubmit(handlePasswordSubmit)}
              >
                <input id="id" name="id" type="hidden" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="md:col-span-2">
                    <Controller
                      control={control}
                      name="senha_atual"
                      render={({ field }) => (
                        <Input
                          isRequired
                          className="w-full p-3 rounded-lg text-black focus:outline-none"
                          errorMessage={errors.senha_atual?.message}
                          id="senha_atual"
                          isInvalid={!!errors.senha_atual}
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
                              {isVisible ? (
                                <Image
                                  alt="Ocultar senha"
                                  src={eye_slash}
                                  width={30}
                                />
                              ) : (
                                <Image
                                  alt="Mostrar senha"
                                  src={eye}
                                  width={30}
                                />
                              )}
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
                        errorMessage={errors.nova_senha?.message}
                        id="nova_senha"
                        isInvalid={!!errors.nova_senha}
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
                            {isVisibleNew ? (
                              <Image
                                alt="Ocultar senha"
                                src={eye_slash}
                                width={30}
                              />
                            ) : (
                              <Image alt="Mostrar senha" src={eye} width={30} />
                            )}
                          </button>
                        }
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="confirma_nova_senha"
                    render={({ field }) => (
                      <Input
                        isRequired
                        className="w-full p-3 rounded-lg text-black focus:outline-none"
                        errorMessage={errors.confirma_nova_senha?.message}
                        id="confirma"
                        isInvalid={!!errors.confirma_nova_senha}
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
                            {isVisibleConfirm ? (
                              <Image
                                alt="Ocultar senha"
                                src={eye_slash}
                                width={30}
                              />
                            ) : (
                              <Image alt="Mostrar senha" src={eye} width={30} />
                            )}
                          </button>
                        }
                      />
                    )}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-8"
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    radius="lg"
                    size="lg"
                    type="submit"
                    variant="shadow"
                  >
                    {isSubmitting ? "Alterando..." : "Alterar Senha"}
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
