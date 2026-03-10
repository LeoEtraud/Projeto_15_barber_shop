import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { useEffect } from "react";

import { Header } from "@/components/Header";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";
import { getDefaultBarberImage } from "@/utils/defaultImages";

// Função para obter selo de avaliação baseado na nota
function getRatingBadge(rating: number): string {
  if (rating >= 5) {
    return "🏅 Perfil aprovado pelos clientes";
  }

  if (rating >= 4) {
    return "👌 Muito bem avaliado";
  }

  if (rating >= 3) {
    return "👍 Clientes satisfeitos";
  }

  return "";
}

export function ChoiceBarberPage() {
  const navigate = useNavigate();
  const { fetchBarbers, barbers } = useSchedule();

  useEffect(() => {
    fetchBarbers();
  }, []);

  return (
    <section className="min-h-screen transition-colors duration-300" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* COMPONENTE CABEÇALHO */}
      <Header />

      {/* Conteúdo principal */}
      <div className="px-4 py-4 md:px-8">
        <Helmet title="Selecionar barbeiro" />

        {/* Banner: mesma largura da página Meus Agendamentos (max-w-4xl) */}
        <div className="mx-auto max-w-4xl mb-6">
          <button
            className="text-sm mb-4 min-w-[44px] min-h-[44px] px-3 flex items-center justify-center gap-2 border-2 rounded-full transition-all duration-300 hover:opacity-90 hover:scale-105 active:scale-100"
            style={{ backgroundColor: "var(--client-card-bg)", borderColor: "var(--client-card-border)", color: "var(--client-card-text)" }}
            type="button"
            onClick={() => navigate(-1)}
            title="Voltar"
          >
            <ArrowLeftIcon className="w-5 h-5 shrink-0" style={{ color: "var(--back-arrow-color)" }} />
            <span className="hidden sm:inline font-medium">Voltar</span>
          </button>
          <div
            className="relative rounded-xl overflow-hidden shadow-lg h-48 transition-colors duration-300"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <img
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              src="/image-1.png"
            />
            {/* Overlay para legibilidade e área reservada ao título */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 45%, transparent 100%)",
              }}
            />
            {/* Título: área com padding suficiente para não recortar; sem seleção/contorno */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pt-6 pb-5">
              <h1
                className="banner-title text-2xl font-bold drop-shadow-lg leading-tight select-none outline-none transition-colors duration-300"
                style={{ color: "var(--text-primary)" }}
              >
                Escolha um profissional
              </h1>
            </div>
          </div>
        </div>

        {/* Opções: mesma largura do banner para botões mais largos */}
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {barbers.map((barber) => (
              <button
                key={barber.id}
                className="flex items-center gap-3 rounded-lg p-4 border-2 transition-all duration-300 shadow-lg md:hover:shadow-xl md:hover:scale-[1.02] text-left relative"
                style={{ backgroundColor: "var(--client-card-bg)", borderColor: "var(--client-card-border)" }}
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
                onMouseEnter={(e) => {
                  if (window.innerWidth >= 768) {
                    e.currentTarget.style.backgroundColor = "var(--client-card-bg-hover)";
                    e.currentTarget.style.borderColor = "var(--client-card-border)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (window.innerWidth >= 768) {
                    e.currentTarget.style.backgroundColor = "var(--client-card-bg)";
                    e.currentTarget.style.borderColor = "var(--client-card-border)";
                  }
                }}
              >
                {(() => {
                  const avatarUrl =
                    barber.avatar && barber.avatar.trim() !== ""
                      ? barber.avatar.startsWith("data:image")
                        ? barber.avatar
                        : `${import.meta.env.VITE_API}/barbeiros/avatar/${encodeURIComponent(
                            barber.avatar,
                          )}`
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
                        const fallback =
                          target.nextElementSibling as HTMLElement;

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
                  <div className="font-medium transition-colors duration-300" style={{ color: "var(--client-card-text)" }}>{barber.nome}</div>
                  {barber.nota_avaliacao >= 3 && (
                    <div className="mt-1 text-xs transition-colors duration-300" style={{ color: "var(--client-card-text-secondary)" }}>
                      {getRatingBadge(barber.nota_avaliacao)}
                    </div>
                  )}
                </div>
                <ArrowRightIcon className="absolute right-4 text-black dark:text-amber-300 w-8 h-8" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
