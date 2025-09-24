import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";

export default function ChoiceBarberPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { barberId?: string } };
  const barberId = location.state?.barberId;

  return (
    <section className="min-h-screen bg-gray-800 px-4 py-8 md:px-8">
      <Helmet title="Selecionar serviço" />
      <div className="mx-auto max-w-2xl">
        <button
          className="text-sm text-gray-300 hover:text-white"
          type="button"
          onClick={() => navigate(-1)}
        >
          Voltar
        </button>

        <h1 className="mt-4 text-2xl font-bold text-white">
          Selecione o serviço {barberId ? `(Barbeiro #${barberId})` : ""}
        </h1>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { id: "haircut", label: "Corte de cabelo" },
            { id: "beard", label: "Barba" },
            { id: "line", label: "Pé de cabelo" },
            { id: "skin", label: "Limpeza de pele" },
          ].map((service) => (
            <button
              key={service.id}
              className="rounded-lg bg-gray-900 p-4 text-left shadow hover:shadow-md transition-shadow"
              type="button"
              onClick={() => navigate("/dashboard")}
            >
              <div className="text-white font-medium">{service.label}</div>
              <div className="text-xs text-gray-400">Toque para selecionar</div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
