import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import animation from "@/assets/animation.gif";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 transition-colors duration-300" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Helmet title="Erro 404" />

      <div className="flex flex-col items-center justify-center gap-6 max-w-lg text-center">
        <img
          alt="Animação de página não encontrada"
          className="max-w-80 w-60 h-auto border-2 rounded-3xl transition-colors duration-300"
          style={{ borderColor: "var(--border-primary)", backgroundColor: "var(--bg-card)" }}
          src={animation}
        />

        <div className="space-y-4">
          <h1 className="text-3xl font-bold transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
            Página não encontrada
          </h1>

          <p className="text-lg transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
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
