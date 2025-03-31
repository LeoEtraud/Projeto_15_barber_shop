import { Helmet } from "react-helmet-async";

import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export function DocsPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <Helmet title="Documentos" />
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Docs</h1>
        </div>
      </section>
    </DefaultLayout>
  );
}
