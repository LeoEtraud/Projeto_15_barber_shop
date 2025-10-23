import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

import { Header } from "@/components/Header";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";
import { formatPrice } from "@/utils/format-price";

// ---- helpers de ordenação ----
const KEY_ORDER = [
  "corte de cabelo",
  "barba",
  "pe de cabelo",
  "limpeza de pele",
];

const normalize = (s: string) =>
  (s ?? "")
    .normalize("NFD")
    // remove acentos
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const rankByName = (nome: string) => {
  const n = normalize(nome);
  const idx = KEY_ORDER.findIndex((k) => n.includes(k));

  // não encontrados vão para o fim
  return idx === -1 ? KEY_ORDER.length + 1 : idx;
};

export function ChoiceServicePage() {
  const navigate = useNavigate();
  const { fetchServices, services } = useSchedule();
  const location = useLocation() as {
    state?: { barber?: { id: string; nome: string } };
  };
  const barber = location.state?.barber;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchServices();
  }, []);

  // Ordena no front conforme prioridade desejada
  const sortedServices = useMemo(() => {
    const list = Array.isArray(services) ? [...services] : [];

    return list.sort((a, b) => {
      const ra = rankByName(a.nome);
      const rb = rankByName(b.nome);

      if (ra !== rb) return ra - rb;

      // desempate estável: por nome (sem acento/caixa)
      return normalize(a.nome).localeCompare(normalize(b.nome), "pt-BR", {
        sensitivity: "base",
      });
    });
  }, [services]);

  // FUNÇÃO DE ESCOLHA DE SERVIÇOS
  function toggleService(id: string, nome: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      const nomeNormalizado = normalize(nome);

      const isCorte = nomeNormalizado.includes("corte de cabelo");
      const isPe = nomeNormalizado.includes("pe de cabelo");

      // Se já estava selecionado → remove
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Se for Corte, remove Pé antes de adicionar
        if (isCorte) {
          services.forEach((s) => {
            if (normalize(s.nome).includes("pe de cabelo")) {
              next.delete(s.id);
            }
          });
        }

        // Se for Pé, remove Corte antes de adicionar
        if (isPe) {
          services.forEach((s) => {
            if (normalize(s.nome).includes("corte de cabelo")) {
              next.delete(s.id);
            }
          });
        }

        next.add(id);
      }

      return next;
    });
  }

  const selectedServices = sortedServices.filter((s) => selectedIds.has(s.id));

  function handleProceed() {
    navigate("/choice-schedule", {
      state: {
        barber,
        selectedServices, // array de serviços
      },
    });
  }

  return (
    <section className="min-h-screen bg-gray-800">
      <Header />

      <div className="p-4 md:px-8">
        <Helmet title="Selecionar serviço" />

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

          {/* Banner */}
          <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 h-40 mb-6">
            <img
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-100"
              src="/image-1.png"
            />
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                Selecione o(s) serviço(s)
              </h1>
            </div>
          </div>

          {/* Lista de serviços (multi-seleção) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {sortedServices.map((service) => {
              const isSelected = selectedIds.has(service.id);

              return (
                <button
                  key={service.id}
                  aria-pressed={isSelected}
                  className={[
                    "rounded-lg p-4 text-left shadow transition-all border",
                    isSelected
                      ? "bg-gray-600 border-green-400 hover:bg-gray-700"
                      : "bg-gray-900 border-transparent hover:shadow-md",
                  ].join(" ")}
                  type="button"
                  onClick={() => toggleService(service.id, service.nome)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-white font-medium">{service.nome}</div>
                    {isSelected && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-600 text-white border border-green-300/50">
                        Selecionado
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-1">
                    <span className="text-green-300 font-semibold">
                      {/* se preferir manter ",00", troque pela linha de baixo */}
                      {/* R$ {service.preco},00 */}
                      {formatPrice(Number(service.preco))}
                    </span>
                    <span className="text-green-200 text-sm">
                      {service.duracao} min
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Toque para {isSelected ? "remover" : "selecionar"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Botão de prosseguir */}
          {selectedServices.length > 0 && (
            <div className="mt-6">
              <button
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                type="button"
                onClick={handleProceed}
              >
                Prosseguir no agendamento
              </button>
              <p className="text-xs text-gray-300 mt-2">
                {selectedServices.length} serviço(s) selecionado(s).
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
