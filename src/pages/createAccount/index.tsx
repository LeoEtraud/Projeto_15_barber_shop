import { button as buttonStyles } from "@heroui/theme";
import { Helmet } from "react-helmet-async";
import { Input } from "@heroui/input";
import { ChangeEvent, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { addToast, Divider, ToastProvider, Image, Link } from "@heroui/react";
import { Button } from "@heroui/react";
import { useLoading } from "@/contexts/LoadingProvider";

import eye_slash from "../../assets/eye-slash.svg";
import eye from "../../assets/eye.svg";

import { formatPhone } from "@/utils/format-Cpf-Phone";
import { SendCreateUser } from "@/contexts/AuthProvider/util";

export type SignInFormData = {
  nome: string;
  data_nascimento: string;
  email: string;
  telefone: string;
  senha: string;
};

export function CreateAccount() {
  const [nomeUser, setNomeUser] = useState<string>("");
  const [dataNascimento, setDataNascimento] = useState<string>("");
  const [telefoneUser, setTelefoneUser] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [senha, setSenha] = useState<string>("");

  const [isVisible, setIsVisible] = useState(false);
  const { show, hide } = useLoading();

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
      .min(11)
      .required("O número de contato é obrigatório"),
    senha: yup.string().required("A senha é obrigatória"),
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

  // FUNÇÃO DE CRIAÇÃO DE USUÁRIO DA BARBEARIA
  async function CreateUser(data: SignInFormData) {
    try {
      show();
      await SendCreateUser(data);
      addToast({
        title: "Sucesso",
        description: "Usuário registrado com sucesso.",
        color: "success",
        timeout: 5000,
      });
      reset();

      setNomeUser("");
      setDataNascimento("");
      setTelefoneUser("");
      setEmail("");
      setSenha("");
    } catch (error) {
      addToast({
        title: "Falha no envio do formulário!",
        description:
          (error as any).response?.data?.error ||
          "Erro ao criar conta de usuário",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      hide();
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
          {/* NOME */}
          <Input
            isRequired
            className={"w-auto p-3 rounded-lg text-black focus:outline-none"}
            id="nome"
            label="Nome"
            maxLength={60}
            size="sm"
            type="text"
            validate={(value) => {
              if (value.length < 3) {
                return "O nome deve conter no mínimo 3 caracteres.";
              }
            }}
            {...register("nome")}
            value={nomeUser}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNomeUser(e.target.value)
            }
          />

          {/* DATA DE NASCIMENTO */}
          <Input
            isRequired
            className={"w-auto p-3 rounded-lg text-black focus:outline-none"}
            id="data_nascimento"
            label="Data de Nascimento"
            size="sm"
            type="date"
            {...register("data_nascimento")}
            value={dataNascimento}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setDataNascimento(e.target.value)
            }
          />

          {/* EMAIL */}
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

          {/* TELEFONE */}
          <Input
            isRequired
            className={"w-auto p-3 rounded-lg text-black focus:outline-none"}
            id="telefone"
            inputMode="numeric"
            label="Nº de contato"
            size="sm"
            type="tel"
            {...register("telefone")}
            maxLength={15}
            validate={(value) => {
              if (value.length < 14) {
                return "O contato deve conter no mínimo 11 números.";
              }
            }}
            value={telefoneUser}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setTelefoneUser(formatPhone(e.target.value))
            }
          />

          {/* SENHA */}
          <Input
            isRequired
            className="w-full p-3 rounded-lg focus:outline-none"
            description="A senha deve conter no mínimo 6 caracteres."
            endContent={
              senha && (
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
            validate={(value) => {
              if (value.length < 6) {
                return "A senha deve conter no mínimo 6 caracteres.";
              }
            }}
            value={senha}
            {...register("senha")}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSenha(e.target.value)
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
            <span className="mx-4 text-gray-600">Ou</span>
            <Divider className="flex-1 bg-gray-800" />
          </div>
          <div className="flex items-center justify-center">
            <Link className="text-gray-400" href="/" size="sm" onPress={show}>
              Realizar login
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
