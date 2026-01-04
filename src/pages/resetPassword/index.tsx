import {
  addToast,
  Button,
  Divider,
  Image,
  Input,
  InputOtp,
  Link,
} from "@heroui/react";
import { button as buttonStyles } from "@heroui/theme";
import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import checkAnimation from "../../assets/confirmed.gif";
import eye_slash from "../../assets/eye-slash.svg";
import eye from "../../assets/eye.svg";

import {
  postCodeRecoverPassword,
  sendNewPassword,
} from "@/contexts/AuthProvider/util";

// Tipos separados para cada etapa do formulário
type Step1FormData = {
  email: string;
};

type Step2FormData = {
  codigo_recupera_senha: string;
  nova_senha: string;
  confirme_nova_senha: string;
};

export function ResetPassword() {
  // Controle de etapa: false = coleta de e-mail / true = código e nova senha
  const [isCode, setIsCode] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Controle de visibilidade das senhas
  const [isVisible, setIsVisible] = useState(false);
  const [isVisibleConfirm, setIsVisibleConfirm] = useState(false);

  // no topo do componente ResetPassword:
  const [submittedEmail, setSubmittedEmail] = useState<string>("");

  function maskEmail(email: string) {
    const [user, domain] = email.split("@");

    if (!domain) return email;

    // mascara o usuário (parte antes do @)
    const maskUser = (s: string) => {
      if (s.length <= 5) return s[0] + "*".repeat(s.length - 1);

      return s.slice(0, 3) + "*".repeat(s.length - 5) + s.slice(-2);
    };

    // retorna o e-mail com usuário mascarado e domínio completo
    return `${maskUser(user)}@${domain}`;
  }

  // Schema para a etapa 1: validação do e-mail
  const schemaStep1 = yup.object().shape({
    email: yup
      .string()
      .email("Insira um e-mail válido")
      .required("O E-mail é obrigatório"),
  });

  // Schema para a etapa 2: validação dos campos de código e senha
  const schemaStep2 = yup.object().shape({
    codigo_recupera_senha: yup
      .string()
      .required("O Número do código é obrigatório")
      .matches(/^\d{6}$/, "Informe os 6 dígitos do código"),
    nova_senha: yup
      .string()
      .required("A nova senha é obrigatória")
      .min(6, "A nova senha deve conter no mínimo 6 caracteres"),
    confirme_nova_senha: yup
      .string()
      .required("A confirmação de nova senha é obrigatória")
      .oneOf([yup.ref("nova_senha")], "As senhas não conferem"),
  });

  // Hook do useForm para a etapa 1
  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { isSubmitting: isSubmittingStep1 },
    reset: resetStep1,
  } = useForm<Step1FormData>({
    resolver: yupResolver(schemaStep1),
    defaultValues: { email: "" },
  });

  // Hook do useForm para a etapa 2
  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    watch: watchStep2,
    control,
    formState: { isSubmitting: isSubmittingStep2 },
    setError,
    clearErrors,
    reset: resetStep2,
  } = useForm<Step2FormData>({
    resolver: yupResolver(schemaStep2),
    defaultValues: {
      codigo_recupera_senha: "",
      nova_senha: "",
      confirme_nova_senha: "",
    },
  });

  // Utiliza watch para monitorar os valores dos campos de senha (para exibir os botões de visibilidade)
  const novaSenhaValue = watchStep2("nova_senha");
  const confirmeNovaSenhaValue = watchStep2("confirme_nova_senha");

  function toggleVisibility() {
    setIsVisible((prev) => !prev);
  }

  function toggleVisibilityConfirm() {
    setIsVisibleConfirm((prev) => !prev);
  }

  // Handler para a etapa 1 (e-mail)
  async function onSubmitStep1(data: Step1FormData) {
    const { email } = data;

    try {
      if (email.length > 0) {
        await postCodeRecoverPassword(email);

        setSubmittedEmail(email.trim());

        addToast({
          title: "Informação",
          description:
            "Um código foi enviado ao seu email, verifique sua conta.",
          color: "primary",
          timeout: 5000,
        });
        setTimeout(() => {
          setIsCode(true);
        }, 1000);
      }
    } catch (error: any) {
      // Extrai a mensagem de erro do back-end
      const errorMessage =
        error?.response?.data?.error ||
        "Não foi possível enviar o código de recuperação. Por favor, tente novamente.";

      addToast({
        title: "Informação",
        description: errorMessage,
        color: "danger",
        timeout: 5000,
      });
    }
  }

  // Handler para a etapa 2 (código e nova senha)
  async function onSubmitStep2(data: Step2FormData) {
    try {
      const { codigo_recupera_senha, nova_senha } = data;

      const result = await sendNewPassword(codigo_recupera_senha, nova_senha);

      // Se sua função retorna algo tipo { ok: boolean } / { status }, valide aqui
      if (
        (result && result.ok === false) ||
        (result?.status && result.status >= 400)
      ) {
        throw new Error("INVALID_CODE");
      }

      // Adiciona um delay de 1 segundo antes de disparar o toast e mudar para a tela de sucesso
      setTimeout(() => {
        addToast({
          title: "Informação",
          description: "Senha redefinida com sucesso!",
          color: "success",
          timeout: 5000,
        });

        // limpar erros/inputs da etapa 2 (opcional)
        resetStep2({
          codigo_recupera_senha: "",
          nova_senha: "",
          confirme_nova_senha: "",
        });

        // avançar para a etapa de sucesso
        setIsSuccess(true); // <-- volta pra cá
        setIsCode(false); // <-- opcional, para garantir que só a etapa 3 apareça
      }, 1000); // Delay de 1 segundo (1000 milissegundos)
    } catch {
      // NÃO avança de etapa
      setIsSuccess(false);

      // Mostra erro no campo de código
      setError("codigo_recupera_senha", {
        type: "manual",
        message: "Código inválido. Tente novamente.",
      });

      addToast({
        title: "Informação",
        description: "Erro ao redefinir a senha!",
        color: "danger",
        timeout: 5000,
      });
    }
  }

  const allowedKeysConfig = {
    name: "Código de verificação",
    value: "^[0-9]*$",
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <section className="border border-gray-800 bg-zinc-950 rounded-lg px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8 flex flex-col items-center justify-center gap-8 shadow-2xl">
        <Helmet title="Recup. Acesso" />
        
        {/* Header com Título */}
        {!isSuccess && (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {!isCode ? "Recuperar senha" : "Redefinir senha"}
              </h1>
              <p className="text-gray-400 text-sm md:text-base">
                {!isCode
                  ? "Informe seu e-mail para receber o código de recuperação"
                  : "Digite o código recebido e defina uma nova senha"}
              </p>
            </div>
          </div>
        )}

        {/* Etapa 1: Formulário de e-mail */}
        {!isCode && !isSuccess && (
          <form
            className="flex flex-col w-80 gap-4"
            onSubmit={handleSubmitStep1(onSubmitStep1)}
          >
            <Input
              isRequired
              className="w-full p-3 rounded-lg text-black focus:outline-none"
              description="Informe o e-mail cadastrado na sua conta"
              errorMessage="Por favor, insira um e-mail válido."
              id="email"
              label="E-mail"
              size="sm"
              type="text"
              {...registerStep1("email")}
            />

            <Button
              className={`${buttonStyles({
                color: "primary",
                radius: "full",
                variant: "shadow",
              })} w-64 mx-auto mt-2 font-extrabold text-base py-6`}
              disabled={isSubmittingStep1}
              isLoading={isSubmittingStep1}
              type="submit"
            >
              {isSubmittingStep1 ? "Enviando..." : "ENVIAR CÓDIGO"}
            </Button>

            <div className="flex items-center my-4">
              <Divider className="flex-1 bg-gray-800" />
              <span className="mx-4 text-gray-600 text-sm">Ou</span>
              <Divider className="flex-1 bg-gray-800" />
            </div>

            <div className="flex items-center justify-center">
              <p className="text-gray-400 text-sm mr-2">
                Lembrou sua senha?
              </p>
              <Link
                className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold text-sm"
                href="/"
              >
                Fazer login
              </Link>
            </div>
          </form>
        )}

        {/*ETAPA 2: FORMULÁRIO PARA CÓDIGO E REDEFINIÇÃO DE SENHA*/}
        {isCode && !isSuccess && (
          <form
            className="flex flex-col w-80 gap-4"
            onSubmit={handleSubmitStep2(onSubmitStep2)}
          >
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
              <p
                aria-live="polite"
                className="text-sm text-blue-200 text-center leading-relaxed"
              >
                Código enviado para{" "}
                <span className="text-blue-100 font-semibold break-all">
                  {submittedEmail ? maskEmail(submittedEmail) : "seu e-mail"}
                </span>
                . Verifique sua caixa de entrada e também a pasta de spam.
              </p>
            </div>

            <div className="w-full flex flex-col items-center gap-2 my-4">
              <Controller
                control={control}
                name="codigo_recupera_senha"
                render={({ field, fieldState }) => (
                  <>
                    <InputOtp
                      allowedKeys={allowedKeysConfig.value}
                      color="primary"
                      length={6}
                      size="lg"
                      value={field.value}
                      variant="bordered"
                      onValueChange={(val) => {
                        field.onChange(val);
                        if (fieldState.error)
                          clearErrors("codigo_recupera_senha");
                      }}
                    />
                    {fieldState.error && (
                      <span className="text-red-600 text-sm font-semibold mt-1">
                        {fieldState.error.message}
                      </span>
                    )}
                  </>
                )}
              />
            </div>

            <div className="w-full flex flex-col gap-4">
              <Input
                isRequired
                className="w-full p-3 rounded-lg text-black focus:outline-none"
                description="Mínimo de 6 caracteres"
                endContent={
                  novaSenhaValue && (
                    <button
                      aria-label="toggle password visibility"
                      className="focus:outline-none transition-opacity hover:opacity-70"
                      type="button"
                      onClick={toggleVisibility}
                    >
                      {isVisible ? (
                        <Image alt="Ocultar senha" src={eye_slash} width={30} />
                      ) : (
                        <Image alt="Mostrar senha" src={eye} width={30} />
                      )}
                    </button>
                  )
                }
                id="nova_senha"
                label="Nova Senha"
                size="sm"
                type={isVisible ? "text" : "password"}
                {...registerStep2("nova_senha")}
              />

              <Input
                isRequired
                className="w-full p-3 rounded-lg text-black focus:outline-none"
                description="Digite a mesma senha para confirmar"
                endContent={
                  confirmeNovaSenhaValue && (
                    <button
                      aria-label="toggle password visibility"
                      className="focus:outline-none transition-opacity hover:opacity-70"
                      type="button"
                      onClick={toggleVisibilityConfirm}
                    >
                      {isVisibleConfirm ? (
                        <Image alt="Ocultar senha" src={eye_slash} width={30} />
                      ) : (
                        <Image alt="Mostrar senha" src={eye} width={30} />
                      )}
                    </button>
                  )
                }
                id="confirme_nova_senha"
                label="Confirmar nova senha"
                size="sm"
                type={isVisibleConfirm ? "text" : "password"}
                validate={(value) => {
                  if (value.length < 6) {
                    return "A confirmação de senha deve conter no mínimo 6 caracteres.";
                  }
                  if (value !== novaSenhaValue) {
                    return "A confirmação de senha deve ser igual a senha.";
                  }
                }}
                value={confirmeNovaSenhaValue}
                {...registerStep2("confirme_nova_senha")}
              />
            </div>

            {/* <div className="flex items-center mb-6">
              <Link className="text-gray-400 pl-4" href="../recovery" size="sm">
                Reenviar código?
              </Link>
            </div> */}

            <Button
              className={`${buttonStyles({
                color: "primary",
                radius: "full",
                variant: "shadow",
              })} w-64 mx-auto mt-2 font-extrabold text-base py-6`}
              disabled={isSubmittingStep2}
              isLoading={isSubmittingStep2}
              type="submit"
            >
              {isSubmittingStep2 ? "Redefinindo..." : "REDEFINIR SENHA"}
            </Button>

            <div className="flex items-center my-4">
              <Divider className="flex-1 bg-gray-800" />
              <span className="mx-4 text-gray-600 text-sm">Ou</span>
              <Divider className="flex-1 bg-gray-800" />
            </div>

            <div className="flex items-center justify-center">
              <Link
                className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold text-sm"
                href="/recovery"
                onPress={(e) => {
                  // @ts-ignore caso a tipagem do evento não exponha preventDefault
                  e?.preventDefault?.();
                  setIsCode(false);
                  setSubmittedEmail("");
                  resetStep1({ email: "" });

                  // Limpa os campos da etapa 2 (código e senha)
                  resetStep2({
                    codigo_recupera_senha: "",
                    nova_senha: "",
                    confirme_nova_senha: "",
                  });

                  // Restaura os estados de visibilidade para a configuração inicial
                  setIsVisible(false);
                  setIsVisibleConfirm(false);
                  setIsSuccess(false); // Garante que a tela de sucesso seja ocultada
                }}
              >
                Alterar e-mail
              </Link>
            </div>
          </form>
        )}

        {/* Mensagem de sucesso */}
        {isSuccess && (
          <div className="text-center flex flex-col items-center justify-center gap-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Senha redefinida com sucesso!
              </h2>
              <p className="text-gray-400 text-sm">
                Você já pode fazer login com sua nova senha
              </p>
            </div>
            <Image
              alt="Sucesso"
              className="mx-auto"
              src={checkAnimation}
              width={200}
            />
            <Button
              className={`${buttonStyles({
                color: "primary",
                radius: "full",
                variant: "shadow",
              })} w-64 mx-auto font-extrabold text-base py-6`}
              as="a"
              href="/"
            >
              Fazer login
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
