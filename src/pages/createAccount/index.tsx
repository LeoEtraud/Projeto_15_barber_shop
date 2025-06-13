import { button as buttonStyles } from "@heroui/theme";
import { Helmet } from "react-helmet-async";
import { Input } from "@heroui/input";
import { ChangeEvent, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { addToast, Divider, ToastProvider, Image, Link } from "@heroui/react";
import { Button } from "@heroui/react";

import eye_slash from "../../assets/eye-slash.svg";
import eye from "../../assets/eye.svg";

import { formatPhone } from "@/utils/format-Cpf-Phone";
import { SendCreateUser } from "@/contexts/AuthProvider/util";

export type SignInFormData = {
  username: string;
  email: string;
  phone_number: string;
  password: string;
  confirm_password: string;
};

export function CreateAccount() {
  const [userName, setUserName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [isVisible, setIsVisible] = useState(false);
  const [isVisibleConfirm, setIsVisibleConfirm] = useState(false);

  const initialValues = {
    username: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
  };

  const schema = yup.object().shape({
    username: yup.string().min(3).required("O Nome é obrigatório"),
    email: yup.string().email().required("O E-mail é obrigatório"),
    phone_number: yup
      .string()
      .min(11)
      .required("O número de contato é obrigatório"),
    password: yup.string().required("A senha é obrigatória"),
    confirm_password: yup
      .string()
      .required("A confirmação de senha é obrigatória"),
  });

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<SignInFormData>({
    resolver: yupResolver(schema),
    defaultValues: initialValues,
  });

  function toggleVisibility() {
    setIsVisible(!isVisible);
  }

  function toggleVisibilityConfirm() {
    setIsVisibleConfirm(!isVisibleConfirm);
  }

  async function CreateUser(data: SignInFormData) {
    try {
      await SendCreateUser(data);
      addToast({
        title: "Sucesso",
        description: "Usuário registrado com sucesso.",
        color: "success",
        timeout: 5000,
      });
      // Resetando os campos
      reset();

      // Resetando os estados dos campos
      setUserName("");
      setPhoneNumber("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      addToast({
        title: "Falha no envio do formulário!",
        description:
          (error as any).response?.data?.error ||
          "Erro ao criar conta de usuário",
        color: "danger",
        timeout: 5000,
      });
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <section className="border border-gray-800 bg-zinc-950 rounded-lg px-28 py-6 flex flex-col items-center justify-center gap-10">
        <Helmet title="Cadastro" />
        <ToastProvider placement={"top-right"} toastOffset={60} />

        <div className="max-h-8 text-center">
          <h1 className="text-2xl">{"Cadastro de Usuário"}</h1>
        </div>

        <form
          className="flex flex-col w-80"
          onSubmit={handleSubmit(CreateUser)}
        >
          <Input
            isRequired
            className={"w-auto p-3 rounded-lg text-black focus:outline-none"}
            id="name"
            label="Nome"
            maxLength={60}
            size="sm"
            type="text"
            validate={(value) => {
              if (value.length < 3) {
                return "O nome deve conter no mínimo 3 caracteres.";
              }
            }}
            {...register("username")}
            value={userName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setUserName(e.target.value)
            }
          />
          <Input
            isRequired
            className={"w-auto p-3 rounded-lg text-black focus:outline-none"}
            errorMessage="Insira um e-mail válido."
            id="email"
            label="E-mail"
            maxLength={60}
            size="sm"
            type="email"
            {...register("email")}
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
          />

          <Input
            isRequired
            className={"w-auto p-3 rounded-lg text-black focus:outline-none"}
            id="contact_number"
            label="Nº de contato"
            size="sm"
            type="text"
            {...register("phone_number")}
            maxLength={15}
            validate={(value) => {
              if (value.length < 14) {
                return "O contato deve conter no mínimo 11 números.";
              }
            }}
            value={phoneNumber}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPhoneNumber(formatPhone(e.target.value))
            }
          />

          <Input
            isRequired
            className="w-full p-3 rounded-lg focus:outline-none"
            description="A senha deve conter no mínimo 6 caracteres."
            endContent={
              password && (
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
            id="password"
            label="Senha"
            size="sm"
            type={isVisible ? "text" : "password"}
            validate={(value) => {
              if (value.length < 6) {
                return "A senha deve conter no mínimo 6 caracteres.";
              }
            }}
            value={password}
            {...register("password")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
          />

          <Input
            isRequired
            className="w-full p-3 rounded-lg focus:outline-none"
            description="A confirmação de senha deve ser igual a senha."
            endContent={
              confirmPassword && (
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
            id="confirm_password"
            label="Confirmar senha"
            size="sm"
            type={isVisibleConfirm ? "text" : "password"}
            validate={(value) => {
              if (value.length < 6) {
                return "A confirmação de senha deve conter no mínimo 6 caracteres.";
              }
              if (value !== password) {
                return "A confirmação de senha deve ser igual a senha.";
              }
            }}
            value={confirmPassword}
            {...register("confirm_password")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setConfirmPassword(e.target.value)
            }
          />

          <Button
            className={`${buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
            })} w-52 mx-auto mt-5 font-extrabold`}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            type="submit"
          >
            CADASTRAR
          </Button>
          {/* LINK DE PÁGINAS */}
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
      </section>
    </div>
  );
}
