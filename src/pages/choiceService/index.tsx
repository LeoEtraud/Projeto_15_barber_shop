import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";

export function ChoiceServicePage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { barberId?: string } };
  const barberId = location.state?.barberId;

  return (
    <section className="min-h-screen bg-gray-800 px-4 py-8 md:px-8">
      <Helmet title="Selecionar serviço" />

      <div className="mx-auto max-w-2xl">
        <button
          className="text-sm text-gray-300 hover:text-white mb-4"
          type="button"
          onClick={() => navigate(-1)}
        >
          Voltar
        </button>

        {/* Banner com imagem de fundo */}
        <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 h-32 mb-6">
          <img
            alt="Banner"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            src="/image-1.png"
          />
          <div className="absolute bottom-0 left-0 p-4">
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">
              Selecione o serviço {barberId ? `(Barbeiro #${barberId})` : ""}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            {
              id: "haircut",
              label: "Corte de cabelo",
              price: "R$ 25,00",
              duration: "30 min",
            },
            {
              id: "beard",
              label: "Barba",
              price: "R$ 20,00",
              duration: "25 min",
            },
            {
              id: "line",
              label: "Pé de cabelo",
              price: "R$ 15,00",
              duration: "15 min",
            },
            {
              id: "skin",
              label: "Limpeza de pele",
              price: "R$ 35,00",
              duration: "45 min",
            },
          ].map((service) => (
            <button
              key={service.id}
              className="rounded-lg bg-gray-900 p-4 text-left shadow hover:shadow-md transition-shadow"
              type="button"
              onClick={() =>
                navigate("/choice-schedule", {
                  state: {
                    barberId,
                    serviceId: service.id,
                    serviceName: service.label,
                    servicePrice: service.price,
                    serviceDuration: service.duration,
                  },
                })
              }
            >
              <div className="text-white font-medium mb-2">{service.label}</div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-green-400 font-semibold">
                  {service.price}
                </span>
                <span className="text-blue-400 text-sm">
                  {service.duration}
                </span>
              </div>
              <div className="text-xs text-gray-400">Toque para selecionar</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
