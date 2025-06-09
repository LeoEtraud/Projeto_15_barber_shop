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
import { useForm } from "react-hook-form";
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
  code_number: string;
  new_password: string;
  confirm_new_password: string;
};

export function ResetPassword() {
  // Controle de etapa: false = coleta de e-mail / true = código e nova senha
  const [isCode, setIsCode] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Controle de visibilidade das senhas
  const [isVisible, setIsVisible] = useState(false);
  const [isVisibleConfirm, setIsVisibleConfirm] = useState(false);

  // Schema para a etapa 1: validação do e-mail
  const schemaStep1 = yup.object().shape({
    email: yup
      .string()
      .email("Insira um e-mail válido")
      .required("O E-mail é obrigatório"),
  });

  // Schema para a etapa 2: validação dos campos de código e senha
  const schemaStep2 = yup.object().shape({
    code_number: yup.string().required("O Número do código é obrigatório"),
    new_password: yup
      .string()
      .required("A nova senha é obrigatória")
      .min(6, "A nova senha deve conter no mínimo 6 caracteres"),
    confirm_new_password: yup
      .string()
      .required("A confirmação de nova senha é obrigatória")
      .oneOf([yup.ref("new_password")], "As senhas não conferem"),
  });

  // Hook do useForm para a etapa 1
  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { isSubmitting: isSubmittingStep1 },
  } = useForm<Step1FormData>({
    resolver: yupResolver(schemaStep1),
    defaultValues: { email: "" },
  });

  // Hook do useForm para a etapa 2
  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    watch: watchStep2,
    formState: { isSubmitting: isSubmittingStep2 },
  } = useForm<Step2FormData>({
    resolver: yupResolver(schemaStep2),
    defaultValues: {
      code_number: "",
      new_password: "",
      confirm_new_password: "",
    },
  });

  // Utiliza watch para monitorar os valores dos campos de senha (para exibir os botões de visibilidade)
  const newPasswordValue = watchStep2("new_password");
  const confirmNewPasswordValue = watchStep2("confirm_new_password");

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
        addToast({
          title: "Informação",
          description:
            "Código enviado com sucesso, verifique sua conta de E-mail.",
          color: "primary",
          timeout: 5000,
        });
        // Aqui você pode, opcionalmente, fazer uma chamada à API para enviar o código ao e-mail
        setTimeout(() => {
          setIsCode(true);
        }, 1000);
      }
    } catch {
      addToast({
        title: "Informação",
        description: "Erro durante o envio do código para seu E-mail!",
        color: "danger",
        timeout: 5000,
      });
    }
  }

  // Handler para a etapa 2 (código e nova senha)
  async function onSubmitStep2(data: Step2FormData) {
    try {
      const { code_number, new_password } = data;

      await sendNewPassword(code_number, new_password);
      addToast({
        title: "Informação",
        description: "Senha redefinida com sucesso!",
        color: "success",
        timeout: 5000,
      });
    } catch {
      addToast({
        title: "Informação",
        description: "Erro ao redefinir a senha!",
        color: "danger",
        timeout: 5000,
      });
    }

    // Aqui você pode fazer a chamada à API para redefinir a senha
    setIsSuccess(true);
  }

  const allowedKeysConfig = {
    name: "Código de verificação",
    value: "^[0-9]*$",
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <section className="border border-gray-800 bg-zinc-950 rounded-lg px-28 py-6 flex flex-col items-center justify-center gap-10">
        <Helmet title="Recovery" />
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
              <span className="mx-4 text-gray-600">ou</span>
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
            <h4 className="text-xs text-gray-400 px-3 select-none">
              Um código foi enviado ao seu e-mail, verifique na sua caixa de
              entrada e informe-o no campo abaixo!
            </h4>

            <div className="w-full flex flex-col items-center gap-4 my-4">
              <InputOtp
                allowedKeys={allowedKeysConfig.value}
                color="primary"
                length={6}
                size="lg"
                variant={"bordered"}
                {...registerStep2("code_number")}
              />
            </div>

            <div className="w-full flex flex-col items-center gap-1">
              <Input
                isRequired
                className="w-full p-3 rounded-lg focus:outline-none"
                endContent={
                  newPasswordValue && (
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
                id="new_password"
                label="Nova Senha"
                size="sm"
                type={isVisible ? "text" : "password"}
                {...registerStep2("new_password")}
              />

              <Input
                isRequired
                className="w-full p-3 rounded-lg focus:outline-none"
                endContent={
                  confirmNewPasswordValue && (
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
                id="confirm_new_password"
                label="Confirmar nova senha"
                size="sm"
                type={isVisibleConfirm ? "text" : "password"}
                validate={(value) => {
                  if (value.length < 6) {
                    return "A confirmação de senha deve conter no mínimo 6 caracteres.";
                  }
                  if (value !== newPasswordValue) {
                    return "A confirmação de senha deve ser igual a senha.";
                  }
                }}
                value={confirmNewPasswordValue}
                {...registerStep2("confirm_new_password")}
              />
            </div>

            <div className="flex items-center mb-6">
              <Link className="text-gray-400 pl-4" href="../recovery" size="sm">
                Reenviar código?
              </Link>
            </div>

            <Button
              className={`${buttonStyles({
                color: "primary",
                radius: "full",
                variant: "shadow",
              })} w-60 mx-auto mt-5 font-extrabold`}
              disabled={isSubmittingStep2}
              type="submit"
            >
              CADASTRAR NOVA SENHA
            </Button>

            <div className="flex items-center my-6">
              <Divider className="flex-1 bg-gray-800" />
              <span className="mx-4 text-gray-600">ou</span>
              <Divider className="flex-1 bg-gray-800" />
            </div>

            <div className="flex items-center justify-center">
              <Link
                className="text-gray-400"
                href="/recovery"
                size="sm"
                onPress={() => setIsCode(false)}
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
