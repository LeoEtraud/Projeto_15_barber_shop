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

export function Login() {
  const [isVisible, setIsVisible] = useState(false);
  const isLoggingInRef = useRef(false);

  const initialValues = { telefone: "", senha: "" };
  const { authenticate } = useAuth();

  const schema = yup.object().shape({
    telefone: yup.string().required("O nº de telefone é obrigatório"),
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
      const response = await LoginRequest(formData.telefone, formData.senha);

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
      <section className="border border-gray-800 bg-zinc-950 rounded-lg px-28 py-6 flex flex-col items-center justify-center gap-10">
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

        <form className="flex flex-col w-80" onSubmit={handleSubmit(signIn)}>
          <Controller
            control={control}
            name="telefone"
            render={({ field }) => (
              <Input
                isRequired
                className="w-auto p-3 rounded-lg text-black focus:outline-none"
                id="telefone"
                inputMode="numeric"
                label="Nº de telefone"
                maxLength={15}
                size="sm"
                type="tel"
                {...field}
                value={formatPhone(field.value)}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  field.onChange(formatPhone(e.target.value))
                }
              />
            )}
            rules={{
              required: "O nº de telefone é obrigatório",
              validate: (value) => {
                const phoneNumber = value.replace(/\D/g, "");

                if (phoneNumber.length < 11) {
                  return "O nº de celular deve conter no mínimo 11 números.";
                }
                if (phoneNumber.length > 11) {
                  return "O nº de celular deve conter no máximo 11 números.";
                }

                return true;
              },
            }}
          />

          <Controller
            control={control}
            name="senha"
            render={({ field }) => (
              <Input
                isRequired
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
            <Link className="text-gray-400 pl-4" href="../recovery" size="sm">
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
            <Link className="text-gray-400" href="../register" size="sm">
              Criar uma conta
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
