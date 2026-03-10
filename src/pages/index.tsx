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
import { motion } from "framer-motion";

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

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
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

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
    defaultValues: initialValues,
    mode: "onChange",
    reValidateMode: "onChange",
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

      sessionStorage.setItem("skipReloadForToast", "1");

      authenticate(response);
      reset(initialValues);

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
        title: "Erro de Autenticação",
        description: "Credenciais inválidas!",
        color: "danger",
      });
    } finally {
      isLoggingInRef.current = false;
    }
  }

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen text-white bg-[#6666ff]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <motion.section
        className="border border-gray-800 bg-zinc-950 rounded-2xl md:rounded-3xl px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-8 flex flex-col items-center justify-center gap-8 max-w-md lg:max-w-lg w-[calc(100%-2rem)] mx-4"
        style={{
          boxShadow:
            "0 25px 50px -12px rgba(102, 102, 255, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Helmet title="Login" />

        {/* Header com Logo */}
        <motion.div
          className="flex flex-col items-center gap-4 w-full"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="relative flex items-center justify-center"
            variants={item}
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Image
              alt="Logo Balata Barbearia"
              className="drop-shadow-lg object-contain"
              height={200}
              radius="full"
              src="/logo_balata.jpeg"
              width={300}
            />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Formulário */}
        <motion.form
          autoComplete="on"
          className="login-form flex flex-col w-full gap-4"
          onSubmit={handleSubmit(signIn)}
          variants={container}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col gap-2">
            <motion.div variants={item}>
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
                    classNames={{
                      input:
                        "!text-[var(--input-text)] placeholder:!text-[var(--input-placeholder)] !text-lg",
                      inputWrapper:
                        "!bg-[var(--input-bg)] !border-[var(--input-border)] !min-h-12",
                    }}
                    className="w-full p-4 rounded-lg focus:outline-none transition-colors duration-300"
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
                    size="lg"
                    type="text"
                    {...field}
                    value={displayValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value;

                      if (/[A-Za-z@]/.test(val)) {
                        field.onChange(val);
                      } else {
                        const onlyDigits = val
                          .replace(/\D/g, "")
                          .slice(0, 11);

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
            </motion.div>

            <motion.div variants={item}>
              <Controller
                control={control}
                name="senha"
              render={({ field, fieldState }) => (
                <Input
                  isRequired
                  autoComplete="current-password"
                  classNames={{
                    input:
                      "!text-[var(--input-text)] placeholder:!text-[var(--input-placeholder)] !text-lg",
                    inputWrapper:
                      "!bg-[var(--input-bg)] !border-[var(--input-border)] !min-h-12",
                  }}
                  className="w-full p-4 rounded-lg focus:outline-none"
                  description="Digite sua senha de acesso"
                  endContent={
                    field.value && (
                      <button
                        aria-label="toggle password visibility"
                        className="focus:outline-none transition-opacity hover:opacity-70"
                        title={
                          isVisible ? "Ocultar senha" : "Mostrar senha"
                        }
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
                          <Image
                            alt="Mostrar senha"
                            src={eye}
                            width={30}
                          />
                        )}
                      </button>
                    )
                  }
                  errorMessage={fieldState.error?.message}
                  id="senha"
                  isInvalid={!!fieldState.error}
                  label="Senha"
                  size="lg"
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
            </motion.div>
          </div>

          <motion.div
            className="flex items-center justify-end -mt-2"
            variants={item}
          >
            <Link
              className="text-gray-400 hover:text-yellow-400 transition-colors text-sm"
              href="../recovery"
              size="sm"
              onPress={show}
            >
              Esqueceu sua senha?
            </Link>
          </motion.div>

          <motion.div variants={item} className="flex justify-center">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
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
            </motion.div>
          </motion.div>

          <motion.div
            className="flex items-center my-4"
            variants={item}
          >
            <Divider className="flex-1 bg-gray-800" />
            <span className="mx-4 text-gray-600 text-sm">Ou</span>
            <Divider className="flex-1 bg-gray-800" />
          </motion.div>

          <motion.div
            className="flex items-center justify-center"
            variants={item}
          >
            <p className="text-gray-400 text-sm mr-2">Não tem uma conta?</p>
            <Link
              className="text-yellow-400 hover:text-yellow-300 transition-colors font-semibold text-sm"
              href="../register"
              onPress={show}
            >
              Criar conta
            </Link>
          </motion.div>
        </motion.form>
      </motion.section>
    </motion.div>
  );
}
