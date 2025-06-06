import { Helmet } from "react-helmet-async";

export function AboutPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <Helmet title="Sobre" />
      <div className="inline-block max-w-lg text-center justify-center">
        <h1>Sobre o proprietário</h1>
      </div>
    </section>
  );
}
