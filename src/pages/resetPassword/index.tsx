import { Button, Divider, Image, Input, Link } from "@heroui/react";
import { button as buttonStyles } from "@heroui/theme";
import { Helmet } from "react-helmet-async";
import { ChangeEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import barberImage from "../../assets/barber.png";

import { formatPhone } from "@/utils/format-Cpf-Phone";

type SignInFormData = {
  email: string;
};

export function ResetPassword() {
  const [contactNumber, setContactNumber] = useState<string>("");
  const [isCode, setIsCode] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const data = {
    description: "Balata Barbearia",
    image: barberImage,
  };

  const initialValues = { email: "" };

  const schema = yup.object().shape({
    email: yup.string().email().required("O CPF é obrigatório"),
  });

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignInFormData>({
    resolver: yupResolver(schema),
    defaultValues: initialValues,
  });

  async function SignIn(data: SignInFormData) {}

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <section className="border border-gray-800 bg-zinc-950 rounded-lg px-28 py-6 flex flex-col items-center justify-center gap-10">
        <Helmet title="Recovery" />

        <div className="max-w-lg text-center">
          <Image
            alt="HeroUI hero Image"
            height={200}
            src={data.image}
            width={200}
          />
          <h6 className="mt-2">{data.description}</h6>
        </div>
        {!isCode && !isSuccess && (
          <form className="flex flex-col  w-80" onSubmit={handleSubmit(SignIn)}>
            <Input
              isRequired
              className={"w-auto p-3 rounded-lg text-black focus:outline-none"}
              errorMessage="Por favor, insira um número de contato."
              id="email"
              label="Nº de contato"
              size="sm"
              type="text"
              {...register("email")}
              description="Informe seu número para recuperação de senha."
              value={contactNumber}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setContactNumber(formatPhone(e.target.value))
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
              ENVIAR
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
        )}

        {isCode && (
          <>
            <Input
              isRequired
              className={"w-auto p-3 rounded-lg text-black focus:outline-none"}
              errorMessage="Por favor insira um e-mail válido"
              id="email"
              label="Nº de contato"
              size="sm"
              type="text"
              {...register("email")}
              description="Informe seu número para recuperação de senha."
              value={contactNumber}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setContactNumber(e.target.value)
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
              ENVIAR
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
