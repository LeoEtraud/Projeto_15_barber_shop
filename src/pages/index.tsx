import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";
import { Helmet } from "react-helmet-async";
import { Input } from "@heroui/input";
import { ChangeEvent, useState, useRef } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { addToast, Divider, Image } from "@heroui/react";
import { Button } from "@heroui/react";

import eye_slash from "../assets/eye-slash.svg";
import eye from "../assets/eye.svg";

import { formatPhone } from "@/utils/format-Cpf-Phone";
import { useAuth } from "@/contexts/AuthProvider/useAuth";
import { LoginRequest } from "@/contexts/AuthProvider/util";
import { useLoading } from "@/contexts/LoadingProvider";

type LoginFormData = {
  telefone: string;
  senha: string;
};

export function Login() {
  const [isVisible, setIsVisible] = useState(false);
  const isLoggingInRef = useRef(false);
  const { show } = useLoading();

  const initialValues = { telefone: "", senha: "" };
  const { authenticate } = useAuth();

  const schema = yup.object().shape({
    telefone: yup
      .string()
      .required("Informe e-mail ou nº de contato")
      .test(
        "email-ou-telefone",
        "Informe um e-mail válido ou nº com 11 dígitos",
        (value) => {
          const v = value || "";

          if (!v) return false;
          if (v.includes("@")) {
            return /.+@.+\..+/.test(v);
          }
          const digits = v.replace(/\D/g, "");

          return digits.length >= 11;
        }
      ),
    senha: yup.string().required("A senha é obrigatória"),
  });

  // Habilita validação onChange para usar isValid
  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
    defaultValues: initialValues,
    mode: "onChange", // valida a cada mudança
    reValidateMode: "onChange", // revalida a cada mudança
  });

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  async function signIn(formData: LoginFormData) {
    if (isLoggingInRef.current) return;
    isLoggingInRef.current = true;
    try {
      const identifier = formData.telefone.includes("@")
        ? formData.telefone
        : formData.telefone.replace(/\D/g, "");

      const response = await LoginRequest(identifier, formData.senha);

      // Evita reload do SW logo após o login para não perder o toast
      sessionStorage.setItem("skipReloadForToast", "1");

      authenticate(response);
      reset(initialValues);

      // Mostrar toast após a navegação ser iniciada
      setTimeout(() => {
        addToast({
          title: "Login",
          description: response.message,
          color: "success",
          timeout: 4000,
        });
      }, 400);
    } catch {
      addToast({
        title: "Erro de Auntenticação",
        description: "Credenciais inválidas!",
        color: "danger",
      });
    } finally {
      isLoggingInRef.current = false;
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <section className="border border-gray-800 bg-zinc-950 rounded-lg px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8 flex flex-col items-center justify-center gap-8 shadow-2xl">
        <Helmet title="Login" />

        {/* Header com Logo */}
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="relative flex items-center justify-center">
            <Image
              alt="Logo Balata Barbearia"
              className="drop-shadow-lg object-contain"
              height={200}
              radius="full"
              src="/logo_balata.jpeg"
              width={300}
            />
          </div>
        </div>

        {/* Formulário */}
        <form
          autoComplete="on"
          className="flex flex-col w-80 gap-4"
          onSubmit={handleSubmit(signIn)}
        >
          {/* Campos de Input com espaçamento reduzido */}
          <div className="flex flex-col gap-2">
            <Controller
              control={control}
              name="telefone"
              render={({ field, fieldState }) => {
                const hasLettersOrAt = /[A-Za-z@]/.test(field.value || "");
                const digits = (field.value || "")
                  .replace(/\D/g, "")
                  .slice(0, 11);
                const displayValue = hasLettersOrAt
                  ? field.value
                  : formatPhone(digits);

                return (
                  <Input
                    isRequired
                    autoComplete="username"
                    className="w-full p-3 rounded-lg focus:outline-none transition-colors duration-300"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      borderColor: "var(--input-border)",
                      color: "var(--input-text)",
                    }}
                    description={
                      hasLettersOrAt
                        ? "Informe seu e-mail cadastrado"
                        : "Informe seu número de telefone com DDD"
                    }
                    errorMessage={fieldState.error?.message}
                    id="telefone"
                    inputMode="text"
                    isInvalid={!!fieldState.error}
                    label="E-mail ou Telefone"
                    maxLength={60}
                    size="sm"
                    type="text"
                    {...field}
                    value={displayValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value;

                      if (/[A-Za-z@]/.test(val)) {
                        field.onChange(val);
                      } else {
                        const onlyDigits = val.replace(/\D/g, "").slice(0, 11);

                        field.onChange(formatPhone(onlyDigits));
                      }
                    }}
                  />
                );
              }}
              rules={{
                required: "Informe e-mail ou nº de contato",
                validate: (value) => {
                  const v = value || "";

                  if (/[A-Za-z@]/.test(v)) {
                    return /.+@.+\..+/.test(v) || "E-mail inválido";
                  }
                  const digits = v.replace(/\D/g, "");

                  return (
                    digits.length === 11 ||
                    "O nº de contato deve ter 11 dígitos"
                  );
                },
              }}
            />

            <Controller
              control={control}
              name="senha"
              render={({ field, fieldState }) => (
                <Input
                  isRequired
                  autoComplete="current-password"
                  className="w-full p-3 rounded-lg text-black focus:outline-none"
                  description="Digite sua senha de acesso"
                  endContent={
                    field.value && (
                      <button
                        aria-label="toggle password visibility"
                        className="focus:outline-none transition-opacity hover:opacity-70"
                        type="button"
                        onClick={toggleVisibility}
                      >
                        {isVisible ? (
                          <Image
                            alt="Ocultar senha"
                            src={eye_slash}
                            width={30}
                          />
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
                  {...field}
                />
              )}
              rules={{
                required: "A senha é obrigatória",
                validate: (value) =>
                  value.length < 6
                    ? "A senha deve conter no mínimo 6 caracteres."
                    : true,
              }}
            />
          </div>

          <div className="flex items-center justify-end -mt-2">
            <Link
              className="text-gray-400 hover:text-yellow-400 transition-colors text-sm"
              href="../recovery"
              size="sm"
              onPress={show}
            >
              Esqueceu sua senha?
            </Link>
          </div>

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
            {isSubmitting ? "Entrando..." : "ENTRAR"}
          </Button>

          <div className="flex items-center my-4">
            <Divider className="flex-1 bg-gray-800" />
            <span className="mx-4 text-gray-600 text-sm">Ou</span>
            <Divider className="flex-1 bg-gray-800" />
          </div>

          <div className="flex items-center justify-center">
            <p className="text-gray-400 text-sm mr-2">Não tem uma conta?</p>
            <Link
              className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold text-sm"
              href="../register"
              onPress={show}
            >
              Criar conta
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
