import { Helmet } from "react-helmet-async";

export function NotFound() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <Helmet title="Erro 404" />

      <div className="inline-block max-w-lg text-center justify-center">
        <h1>Página não encontrada</h1>
      </div>
    </section>
  );
}
