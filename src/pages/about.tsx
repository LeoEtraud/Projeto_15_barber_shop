import { Helmet } from "react-helmet-async";

import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export function AboutPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <Helmet title="Sobre" />
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>About</h1>
        </div>
      </section>
    </DefaultLayout>
  );
}
