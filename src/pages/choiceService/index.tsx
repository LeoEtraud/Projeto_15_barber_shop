import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

import { Header } from "@/components/Header";

type Service = {
  id: string;
  label: string;
  price: string;
  duration: string;
};

const SERVICES: Service[] = [
  {
    id: "haircut",
    label: "Corte de cabelo",
    price: "R$ 35,00",
    duration: "30 min",
  },
  { id: "beard", label: "Barba", price: "R$ 35,00", duration: "30 min" },
  { id: "line", label: "Pé de cabelo", price: "R$ 15,00", duration: "10 min" },
  {
    id: "skin",
    label: "Limpeza de pele",
    price: "R$ 20,00",
    duration: "15 min",
  },
];

export function ChoiceServicePage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { barberId?: string } };
  const barberId = location.state?.barberId;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggleService(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  }

  const selectedServices = SERVICES.filter((s) => selectedIds.has(s.id));

  function handleProceed() {
    navigate("/choice-schedule", {
      state: {
        barberId,
        selectedServices, // array de { id, label, price, duration }
      },
    });
  }

  return (
    <section className="min-h-screen bg-gray-800">
      {/* COMPONENTE CABEÇALHO */}
      <Header />

      {/* Conteúdo principal */}
      <div className="px-4 py-8 md:px-8">
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

          {/* Banner com imagem de fundo */}
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
            {SERVICES.map((service) => {
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
                  onClick={() => toggleService(service.id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-white font-medium">
                      {service.label}
                    </div>
                    {isSelected && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-600 text-white border border-green-300/50">
                        Selecionado
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-1">
                    <span className="text-green-300 font-semibold">
                      {service.price}
                    </span>
                    <span className="text-green-200 text-sm">
                      {service.duration}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Toque para {isSelected ? "remover" : "selecionar"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Botão de prosseguir (aparece quando há seleção) */}
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
