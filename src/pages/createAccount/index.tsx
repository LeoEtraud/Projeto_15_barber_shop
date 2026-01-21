import { button as buttonStyles } from "@heroui/theme";
import { Helmet } from "react-helmet-async";
import { Input } from "@heroui/input";
import { ChangeEvent, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { addToast, Divider, ToastProvider, Image, Link } from "@heroui/react";
import { Button } from "@heroui/react";

import eye_slash from "../../assets/eye-slash.svg";
import eye from "../../assets/eye.svg";

import { useLoading } from "@/contexts/LoadingProvider";
import { formatPhone, normalizeName } from "@/utils/format-Cpf-Phone";
import { SendCreateUser } from "@/contexts/AuthProvider/util";
import { SignInFormData } from "@/contexts/AuthProvider/types";

export function CreateAccount() {
  const [isVisible, setIsVisible] = useState(false);
  const { show } = useLoading();

  const initialValues = {
    nome: "",
    data_nascimento: "",
    email: "",
    telefone: "",
    senha: "",
  };

  const schema = yup.object().shape({
    nome: yup.string().min(3).required("O Nome é obrigatório"),
    data_nascimento: yup
      .string()
      .required("A data de nascimento é obrigatória"),
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
    senha: yup.string().required("A senha é obrigatória"),
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isSubmitted, submitCount, errors },
    reset,
  } = useForm<SignInFormData>({
    resolver: yupResolver(schema),
    defaultValues: initialValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  function toggleVisibility() {
    setIsVisible(!isVisible);
  }

  // FUNÇÃO DE CRIAÇÃO DE USUÁRIO DA BARBEARIA
  async function CreateUser(data: SignInFormData) {
    try {
      const payload: SignInFormData = {
        ...data,
        nome: normalizeName(data.nome || ""),
        telefone: (data.telefone || "").replace(/\D/g, ""),
      };

      await SendCreateUser(payload);
      addToast({
        title: "Sucesso",
        description: "Cliente cadastrado com sucesso.",
        color: "success",
        timeout: 5000,
      });
      reset();
    } catch (error) {
      addToast({
        title: "Falha no envio do formulário!",
        description:
          (error as any).response?.data?.error ||
          "Erro ao criar conta de cliente",
        color: "danger",
        timeout: 5000,
      });
    } finally {
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <section className="border border-gray-800 bg-zinc-950 rounded-lg px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8 flex flex-col items-center justify-center gap-8 shadow-2xl">
        <Helmet title="Cadastro" />
        <ToastProvider placement={"top-right"} toastOffset={60} />

        {/* Header com Título */}
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Criar conta
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Preencha os dados abaixo para se cadastrar
            </p>
          </div>
        </div>

        <form
          autoComplete="on"
          className="flex flex-col w-80 gap-4"
          onSubmit={handleSubmit(CreateUser)}
        >
          {/* NOME */}
          <Controller
            control={control}
            name="nome"
            render={({ field, fieldState }) => (
              <Input
                isRequired
                autoComplete="name"
                className="w-full p-3 rounded-lg text-black focus:outline-none"
                description="Informe seu nome completo"
                errorMessage={fieldState.error?.message}
                id="nome"
                isInvalid={!!fieldState.error}
                label="Nome completo"
                maxLength={60}
                size="sm"
                type="text"
                {...field}
                validate={(value) => {
                  if (value.length < 3) {
                    return "O nome deve conter no mínimo 3 caracteres.";
                  }
                }}
              />
            )}
          />

          {/* DATA DE NASCIMENTO */}
          <Controller
            control={control}
            name="data_nascimento"
            render={({ field, fieldState }) => (
              <Input
                isRequired
                autoComplete="bday"
                className="w-full p-3 rounded-lg text-black focus:outline-none"
                description="Selecione sua data de nascimento"
                errorMessage={fieldState.error?.message}
                id="data_nascimento"
                isInvalid={!!fieldState.error}
                label="Data de Nascimento"
                max={new Date().toISOString().slice(0, 10)}
                size="sm"
                type="date"
                {...field}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const raw = e.target.value;
                  const sanitized = raw.replace(/[^0-9-]/g, "").slice(0, 10);

                  field.onChange(sanitized);
                }}
              />
            )}
          />

          {/* EMAIL */}
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <Input
                isRequired
                autoComplete="email"
                className="w-full p-3 rounded-lg text-black focus:outline-none"
                description="Informe um e-mail válido para login"
                errorMessage={fieldState.error?.message || "Insira um e-mail válido."}
                id="email"
                isInvalid={!!fieldState.error}
                label="E-mail"
                maxLength={60}
                size="sm"
                type="email"
                {...field}
              />
            )}
          />

          {/* TELEFONE */}
          <Controller
            control={control}
            name="telefone"
            render={({ field, fieldState }) => {
              const showError =
                fieldState.isTouched || isSubmitted || submitCount > 0;
              const message =
                errors.telefone?.message || fieldState.error?.message;

              return (
                <Input
                  isRequired
                  autoComplete="tel"
                  className="w-full p-3 rounded-lg text-black focus:outline-none"
                  description="Informe seu número com DDD (ex: (98) 99999-9999)"
                  errorMessage={showError ? message : undefined}
                  id="telefone"
                  inputMode="numeric"
                  isInvalid={
                    showError && !!(errors.telefone || fieldState.error)
                  }
                  label="Telefone"
                  maxLength={15}
                  size="sm"
                  type="tel"
                  {...field}
                  value={formatPhone(field.value || "")}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    field.onChange(formatPhone(e.target.value))
                  }
                />
              );
            }}
          />

          {/* SENHA */}
          <Controller
            control={control}
            name="senha"
            render={({ field, fieldState }) => (
              <Input
                isRequired
                autoComplete="new-password"
                className="w-full p-3 rounded-lg text-black focus:outline-none"
                description="Mínimo de 6 caracteres"
                endContent={
                  field.value && (
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
                errorMessage={fieldState.error?.message}
                id="senha"
                isInvalid={!!fieldState.error}
                label="Senha"
                size="sm"
                type={isVisible ? "text" : "password"}
                validate={(value) => {
                  if (value.length < 6) {
                    return "A senha deve conter no mínimo 6 caracteres.";
                  }
                }}
                {...field}
              />
            )}
          />

          <Button
            className={`${buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
            })} w-64 mx-auto mt-2 font-extrabold text-base py-6`}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Cadastrando..." : "CADASTRAR"}
          </Button>

          {/* LINK DE PÁGINAS */}
          <div className="flex items-center my-4">
            <Divider className="flex-1 bg-gray-800" />
            <span className="mx-4 text-gray-600 text-sm">Ou</span>
            <Divider className="flex-1 bg-gray-800" />
          </div>
          <div className="flex items-center justify-center">
            <p className="text-gray-400 text-sm mr-2">
              Já tem uma conta?
            </p>
            <Link
              className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold text-sm"
              href="/"
              onPress={show}
            >
              Fazer login
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
