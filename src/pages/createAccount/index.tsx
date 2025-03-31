import { button as buttonStyles } from "@heroui/theme";
import { Helmet } from "react-helmet-async";
import { Input } from "@heroui/input";
import { ChangeEvent, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { addToast, Divider, Image, Link } from "@heroui/react";
import { Button } from "@heroui/react";

import eye_slash from "../../assets/eye-slash.svg";
import eye from "../../assets/eye.svg";
import barberImage from "../../assets/barber.png";

import { formatCpf, formatPhone } from "@/utils/format-Cpf-Phone";
import { LoginRequest } from "@/contexts/AuthProvider/util";
import { useAuth } from "@/contexts/AuthProvider/useAuth";

type SignInFormData = {
  contact_number: string;
  cpf: string;
  password: string;
  confirm_password: string;
};

export function CreateAccount() {
  const auth = useAuth();
  const [contactNumber, setContactNumber] = useState<string>("");
  const [cpf, setCpf] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [isVisible, setIsVisible] = useState(false);
  const [isVisibleConfirm, setIsVisibleConfirm] = useState(false);

  const initialValues = {
    contact_number: "",
    cpf: "",
    password: "",
    confirm_password: "",
  };

  const schema = yup.object().shape({
    contact_number: yup.string().required("O número de contato é obrigatório"),
    cpf: yup.string().required("O CPF é obrigatório"),
    password: yup.string().required("A senha é obrigatória"),
    confirm_password: yup
      .string()
      .required("A confirmação de senha é obrigatória"),
  });

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignInFormData>({
    resolver: yupResolver(schema),
    defaultValues: initialValues,
  });

  const data = {
    description: "Balata Barbearia",
    image: barberImage,
  };

  function toggleVisibility() {
    setIsVisible(!isVisible);
  }

  function toggleVisibilityConfirm() {
    setIsVisibleConfirm(!isVisibleConfirm);
  }

  toggleVisibilityConfirm;

  async function SignIn(data: SignInFormData) {
    const response = await LoginRequest(data.cpf, data.password);

    auth;
    if (response.ok) {
      addToast({
        title: "Sucesso",
        description: "Autenticação realizada com sucesso.",
      });
    } else {
      addToast({
        title: "Falha",
        description: "CPF e/ou senha incorretos.",
      });
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <section className="border border-gray-800 bg-zinc-950 rounded-lg px-28 py-6 flex flex-col items-center justify-center gap-10">
        <Helmet title="Cadastro" />

        <div className="max-w-lg text-center">
          <Image
            alt="HeroUI hero Image"
            height={200}
            src={data.image}
            width={200}
          />
          <h6 className="mt-2">{data.description}</h6>
        </div>

        <form className="flex flex-col w-80" onSubmit={handleSubmit(SignIn)}>
          <Input
            isRequired
            className={"w-auto p-3 rounded-lg text-black focus:outline-none"}
            id="contact_number"
            label="Nº de contato"
            size="sm"
            type="text"
            {...register("contact_number")}
            maxLength={14}
            validate={(value) => {
              if (value.length < 14) {
                return "O contato deve conter no mínimo 11 números.";
              }

              return value === "admin" ? "Nice try!" : null;
            }}
            value={contactNumber}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setContactNumber(formatPhone(e.target.value))
            }
          />

          <Input
            isRequired
            className={"w-auto p-3 rounded-lg text-black focus:outline-none"}
            id="cpf"
            label="CPF"
            size="sm"
            type="text"
            {...register("cpf")}
            maxLength={14}
            validate={(value) => {
              if (value.length < 14) {
                return "O CPF deve conter no mínimo 11 números.";
              }

              return value === "admin" ? "Nice try!" : null;
            }}
            value={cpf}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setCpf(formatCpf(e.target.value))
            }
          />

          <Input
            isRequired
            className="w-full p-3 rounded-lg focus:outline-none"
            endContent={
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
            }
            id="password"
            label="Senha"
            size="sm"
            type={isVisible ? "text" : "password"}
            validate={(value) => {
              if (value.length < 8) {
                return "A senha deve conter no mínimo 8 caracteres.";
              }

              return value === "admin" ? "Nice try!" : null;
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
            endContent={
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
            }
            id="confirm_password"
            label="Confirmar senha"
            size="sm"
            type={isVisibleConfirm ? "text" : "password"}
            validate={(value) => {
              if (value.length < 8) {
                return "A confirmação de senha deve conter no mínimo 8 caracteres.";
              }

              return value === "admin" ? "Nice try!" : null;
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
            })} w-40 mx-auto mt-5 font-extrabold`}
            disabled={isSubmitting}
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
              Página de login
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
