import { Button } from "@heroui/button";
import { Helmet } from "react-helmet-async";
import { button as buttonStyles } from "@heroui/theme";

import { useAuth } from "@/contexts/AuthProvider/useAuth";

export function HomePage() {
  const { logout } = useAuth();

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10  bg-gray-800">
      <Helmet title="Documentos" />
      <div className="inline-block max-w-lg text-center justify-center  bg-black">
        <h1 className="text-white">Página Inicial</h1>
      </div>
      <Button
        className={`${buttonStyles({
          color: "danger",
          radius: "full",
          variant: "shadow",
        })} w-40 mx-auto mt-5 font-extrabold`}
        onPress={() => logout()}
      >
        Sair
      </Button>
    </section>
  );
}
