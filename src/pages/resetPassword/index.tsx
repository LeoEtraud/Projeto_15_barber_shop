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

    // mascara o domínio (parte depois do @, antes do .)
    const [dname, ...tldParts] = domain.split(".");
    const maskDomain = (s: string) => {
      if (s.length <= 3) return s[0] + "*".repeat(s.length - 1);

      return s.slice(0, 2) + "*".repeat(s.length - 2);
    };

    const maskedDomain = dname ? maskDomain(dname) : domain;
    const tld = tldParts.length ? "." + tldParts.join(".") : "";

    return `${maskUser(user)}@${maskedDomain}${tld}`;
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
    } catch {
      addToast({
        title: "Informação",
        description: "Erro ao enviar o código para seu E-mail!",
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
      <section className="border border-gray-800 bg-zinc-950 rounded-lg px-28 py-6 flex flex-col items-center justify-center gap-10">
        <Helmet title="Recup. Acesso" />
        <div className="w-80 md:w-full px-4 sm:px-6 md:px-4">
          <h1 className="text-2xl md:text-3xl lg:text-2xl font-bold text-center">
            Recuperação de acesso
          </h1>
        </div>

        {/* Etapa 1: Formulário de e-mail */}
        {!isCode && !isSuccess && (
          <form
            className="flex flex-col w-80"
            onSubmit={handleSubmitStep1(onSubmitStep1)}
          >
            <Input
              isRequired
              className="w-auto p-3 rounded-lg text-black focus:outline-none"
              errorMessage="Por favor, insira um e-mail válido."
              id="email"
              label="E-mail"
              size="sm"
              type="text"
              {...registerStep1("email")}
              description="Informe seu e-mail para recuperação de senha."
            />

            <Button
              className={`${buttonStyles({
                color: "primary",
                radius: "full",
                variant: "shadow",
              })} w-40 mx-auto mt-5 font-extrabold`}
              disabled={isSubmittingStep1}
              isLoading={isSubmittingStep1}
              type="submit"
            >
              ENVIAR
            </Button>

            <div className="flex items-center my-6">
              <Divider className="flex-1 bg-gray-800" />
              <span className="mx-4 text-gray-600">Ou</span>
              <Divider className="flex-1 bg-gray-800" />
            </div>

            <div className="flex items-center justify-center">
              <Link className="text-gray-400" href="/" size="sm">
                Realizar login
              </Link>
            </div>
          </form>
        )}

        {/*ETAPA 2: FORMULÁRIO PARA CÓDIGO E REDEFINIÇÃO DE SENHA*/}
        {isCode && !isSuccess && (
          <form
            className="flex flex-col w-80"
            onSubmit={handleSubmitStep2(onSubmitStep2)}
          >
            <p
              aria-live="polite"
              className="text-xs text-gray-400 px-3 select-none text-center leading-relaxed"
            >
              Código enviado para{" "}
              <span className="text-gray-200 font-medium break-all">
                {submittedEmail ? maskEmail(submittedEmail) : "seu e-mail"}
              </span>
              . Verifique sua caixa de entrada (e também a pasta de spam) e
              digite-o abaixo.
            </p>

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
                      <span className="text-[11px] text-red-500 mt-1">
                        {fieldState.error.message}
                      </span>
                    )}
                  </>
                )}
              />
            </div>

            <div className="w-full flex flex-col items-center gap-1">
              <Input
                isRequired
                className="w-full p-3 rounded-lg focus:outline-none"
                endContent={
                  novaSenhaValue && (
                    <button
                      aria-label="toggle password visibility"
                      className="focus:outline-none"
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
                className="w-full p-3 rounded-lg focus:outline-none"
                endContent={
                  confirmeNovaSenhaValue && (
                    <button
                      aria-label="toggle password visibility"
                      className="focus:outline-none"
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
              })} w-60 mx-auto mt-5 font-extrabold`}
              disabled={isSubmittingStep2}
              isLoading={isSubmittingStep2}
              type="submit"
            >
              CADASTRAR NOVA SENHA
            </Button>

            <div className="flex items-center my-6">
              <Divider className="flex-1 bg-gray-800" />
              <span className="mx-4 text-gray-600">Ou</span>
              <Divider className="flex-1 bg-gray-800" />
            </div>

            <div className="flex items-center justify-center">
              <Link
                className="text-gray-400"
                href="/recovery"
                size="sm"
                onPress={(e) => {
                  // @ts-ignore caso a tipagem do evento não exponha preventDefault
                  e?.preventDefault?.();
                  setIsCode(false);
                  setSubmittedEmail("");
                  resetStep1({ email: "" });
                }}
              >
                Alterar e-mail
              </Link>
            </div>
          </form>
        )}

        {/* Mensagem de sucesso */}
        {isSuccess && (
          <div className="text-center flex flex-col items-center justify-center">
            <h2 className="text-2xl py-10">Senha redefinida com sucesso!</h2>
            <Image
              alt="HeroUI hero Image"
              className="mx-auto mb-10"
              src={checkAnimation}
              width={200}
            />
            <Link href="/" size="md">
              Realizar login
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
