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
import barberImage from "../assets/barber.png";

import { formatPhone } from "@/utils/format-Cpf-Phone";
import { useAuth } from "@/contexts/AuthProvider/useAuth";
import { SignInFormData } from "@/contexts/AuthProvider/types";
import { LoginRequest } from "@/contexts/AuthProvider/util";
import { useLoading } from "@/contexts/LoadingProvider";

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
  } = useForm<SignInFormData>({
    resolver: yupResolver(schema),
    defaultValues: initialValues,
    mode: "onChange", // valida a cada mudança
    reValidateMode: "onChange", // revalida a cada mudança
  });

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  async function signIn(formData: SignInFormData) {
    if (isLoggingInRef.current) return;
    isLoggingInRef.current = true;
    try {
      const identifier = formData.telefone.includes("@")
        ? formData.telefone
        : formData.telefone.replace(/\D/g, "");

      const response = await LoginRequest(identifier, formData.senha);

      authenticate(response);
      addToast({
        title: "Login",
        description: response.message,
        color: "success",
        timeout: 3000,
      });
      reset(initialValues);
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
      <section className="border border-gray-800 bg-zinc-950 rounded-lg px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-6 flex flex-col items-center justify-center gap-10">
        <Helmet title="Login" />

        <div className="max-w-lg text-center">
          <Image
            alt="Logo da barbearia"
            height={200}
            src={barberImage}
            width={200}
          />
          <h6 className="mt-2">Balata Barbearia</h6>
        </div>

        <form
          autoComplete="on"
          className="flex flex-col w-80"
          onSubmit={handleSubmit(signIn)}
        >
          <Controller
            control={control}
            name="telefone"
            render={({ field }) => {
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
                  className="w-auto p-3 rounded-lg text-black focus:outline-none"
                  id="telefone"
                  inputMode="text"
                  label="E-mail ou Nº de contato"
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
                  digits.length === 11 || "O nº de contato deve ter 11 dígitos"
                );
              },
            }}
          />

          <Controller
            control={control}
            name="senha"
            render={({ field }) => (
              <Input
                isRequired
                autoComplete="current-password"
                className="w-full p-3 rounded-lg focus:outline-none"
                endContent={
                  field.value && (
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
                id="senha"
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

          <div className="flex items-center mb-6">
            <Link
              className="text-gray-400 pl-4"
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
            })} w-40 mx-auto mt-5 font-extrabold`}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            type="submit"
          >
            ENTRAR
          </Button>

          <div className="flex items-center my-6">
            <Divider className="flex-1 bg-gray-800" />
            <span className="mx-4 text-gray-600">Ou</span>
            <Divider className="flex-1 bg-gray-800" />
          </div>

          <div className="flex items-center justify-center">
            <Link
              className="text-gray-400"
              href="../register"
              size="sm"
              onPress={show}
            >
              Criar uma conta
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
