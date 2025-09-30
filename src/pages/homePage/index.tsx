import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-gray-800 flex flex-col">
      {/* Header fixo */}
      <Header />

      {/* Conteúdo principal */}
      <div className="px-4 py-8 md:px-8 flex-1">
        <Helmet title="home" />

        <div className="mx-auto max-w-2xl">
          {/* Banner de boas-vindas */}
          <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 h-40 mb-6">
            <img
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-70"
              src="/image-1.png"
            />
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                Bem-vindo à Balata Barbearia
              </h1>
              <span className="text-gray-200">
                Cortamos cabelo e contamos histórias.
              </span>
            </div>
          </div>

          {/* Cards de opções */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Card Realizar Agendamento */}
            <button
              className="flex flex-col items-center gap-4 rounded-lg bg-gray-900 p-6 shadow hover:shadow-md transition-shadow text-center"
              type="button"
              onClick={() => navigate("/choice-barber")}
            >
              <div className="text-4xl">✂️</div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Realizar Agendamento
                </h3>
                <p className="text-sm text-gray-400">
                  Agende seu horário com nossos barbeiros
                </p>
              </div>
            </button>

            {/* Card Histórico de Agendamentos */}
            <button
              className="flex flex-col items-center gap-4 rounded-lg bg-gray-900 p-6 shadow hover:shadow-md transition-shadow text-center"
              type="button"
              onClick={() => {
                // TODO: Implementar página de histórico
                alert("Funcionalidade em desenvolvimento");
              }}
            >
              <div className="text-4xl">📅</div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Histórico de Agendamentos
                </h3>
                <p className="text-sm text-gray-400">
                  Veja seus agendamentos anteriores
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <Footer />
    </section>
  );
}
