import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import animation from "@/assets/animation.gif";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-gray-800 flex flex-col items-center justify-center text-white px-4">
      <Helmet title="Erro 404" />

      <div className="flex flex-col items-center justify-center gap-6 max-w-lg text-center">
        <img
          alt="Animação de página não encontrada"
          className="max-w-80 w-60 h-auto border-gray-500 border-2 bg-gray-100 rounded-3xl"
          src={animation}
        />

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white">
            Página não encontrada
          </h1>

          <p className="text-gray-300 text-lg">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button
            className="px-6 py-3 bg-blue-600 hover:bg-blue-800 text-white rounded-lg transition-colors duration-200 font-medium"
            onClick={() => navigate("/home")}
          >
            Ir para Home
          </button>
        </div>
      </div>
    </section>
  );
}
