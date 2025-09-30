import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid"; // << ADICIONE

import { Header } from "@/components/Header";

export function ChoiceBarberPage() {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-gray-800">
      {/* COMPONENTE CABEÇALHO */}
      <Header />

      {/* Conteúdo principal */}
      <div className="px-4 py-6 md:px-8">
        <Helmet title="Selecionar barbeiro" />

        <div className="mx-auto max-w-2xl">
          <button
            className="text-sm bg-gray-800 hover:bg-gray-900 mb-4 
             w-8 h-8 flex items-center justify-center 
             border border-gray-400 rounded-full"
            type="button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="w-6 h-6 text-yellow-400" />
          </button>

          {/* Banner com imagem de fundo */}
          <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 h-40 mb-6">
            <img
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-100"
              src="/image-1.png"
            />
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                Escolha um barbeiro
              </h1>
            </div>
          </div>

          {/* Lista de barbeiros */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                id: "1",
                firstName: "Léo",
                lastName: "Balata",
                services: 128,
                img: "/barber-1.png",
              },
              {
                id: "2",
                firstName: "Felipe",
                lastName: "Souza",
                services: 73,
                img: "/barber-2.png",
              },
              {
                id: "3",
                firstName: "João",
                lastName: "Pereira",
                services: 99,
                img: "/barber-3.png",
              },
              {
                id: "4",
                firstName: "Henrique",
                lastName: "Oliveira",
                services: 85,
                img: "/barber-4.png",
              },
            ].map((barber) => (
              <button
                key={barber.id}
                className="flex items-center gap-3 rounded-lg bg-gray-900 p-4 shadow hover:shadow-md transition-shadow text-left relative"
                type="button"
                onClick={() =>
                  navigate("/choice-service", {
                    state: { barberId: barber.id },
                  })
                }
              >
                <img
                  alt={`Barbeiro ${barber.firstName}`}
                  className="h-16 w-14 rounded-md object-cover"
                  src={barber.img}
                />
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {barber.firstName} {barber.lastName}
                  </div>
                  <div className="text-xs text-gray-400">
                    {barber.services} atendimentos
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span key={i} aria-hidden className="text-yellow-400">
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                {/* Seta amarela, mais cheia e maior */}
                <ArrowRightIcon className="absolute right-4 text-yellow-400 w-8 h-8" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
