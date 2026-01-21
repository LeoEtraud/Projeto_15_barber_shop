import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid"; // << ADICIONE
import { useEffect } from "react";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { StarIcon as StarIconOutline } from "@heroicons/react/24/outline";

import { Header } from "@/components/Header";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";
import { getDefaultBarberImage } from "@/utils/defaultImages";

export function ChoiceBarberPage() {
  const navigate = useNavigate();
  const { fetchBarbers, barbers } = useSchedule();

  useEffect(() => {
    fetchBarbers();
  }, []);

  return (
    <section className="min-h-screen bg-gray-800">
      {/* COMPONENTE CABEÇALHO */}
      <Header />

      {/* Conteúdo principal */}
      <div className="px-4 py-4 md:px-8">
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
            {barbers.map((barber) => (
              <button
                key={barber.id}
                className="flex items-center gap-3 rounded-lg bg-gray-900 p-4 shadow hover:shadow-md transition-shadow text-left relative"
                type="button"
                onClick={() =>
                  navigate("/choice-service", {
                    state: {
                      barber: {
                        id: barber.id,
                        nome: barber.nome,
                        id_barbearia: barber.id_barbearia,
                      },
                    },
                  })
                }
              >
                {(() => {
                  const avatarUrl = barber.avatar && barber.avatar.trim() !== ""
                    ? barber.avatar.startsWith("data:image")
                      ? barber.avatar
                      : `${import.meta.env.VITE_API}/barbeiros/avatar/${encodeURIComponent(barber.avatar)}`
                    : null;
                  
                  return avatarUrl ? (
                    <img
                      alt={`Barbeiro ${barber.nome}`}
                      className="h-16 w-14 rounded-md object-cover"
                      src={avatarUrl}
                      onError={(e) => {
                        // Se a imagem falhar, mostra o ícone de usuário
                        const target = e.currentTarget;
                        target.style.display = "none";
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.classList.remove("hidden");
                        }
                      }}
                    />
                  ) : null;
                })()}
                {(() => {
                  if (barber.avatar && barber.avatar.trim() !== "") return null;
                  
                  return (
                    <img
                      alt={`Barbeiro ${barber.nome}`}
                      className="h-16 w-14 rounded-md object-cover"
                      src={getDefaultBarberImage(barber.nome)}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  );
                })()}
                <div className="flex-1">
                  <div className="text-white font-medium">{barber.nome}</div>
                  <div className="text-xs text-gray-400">
                    {barber.qtd_atendimentos} atendimentos
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) =>
                      i < barber.nota_avaliacao ? (
                        <StarIconSolid
                          key={i}
                          aria-hidden="true"
                          className="w-3 h-3 text-yellow-400"
                        />
                      ) : (
                        <StarIconOutline
                          key={i}
                          aria-hidden="true"
                          className="w-3 h-3 text-gray-500"
                        />
                      )
                    )}
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
