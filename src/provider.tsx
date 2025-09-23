import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

import { LoadingProvider } from "@/contexts/LoadingProvider";
import { useLoading } from "@/contexts/LoadingProvider";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Hook do LoadingProvider só pode ser usado dentro dele;
  // criamos um wrapper interno para controlar efeitos globais.
  function WithGlobalLoading({ children }: { children: React.ReactNode }) {
    const { hide, show } = useLoading();
    const isFirstRenderRef = useRef(true);

    useEffect(() => {
      if (isFirstRenderRef.current) {
        isFirstRenderRef.current = false;
        show();
        const id = setTimeout(() => hide(), 800);

        return () => clearTimeout(id);
      }
    }, [hide, show]);

    useEffect(() => {
      const id = setTimeout(() => hide(), 300);

      return () => clearTimeout(id);
    }, [location, hide]);

    return <>{children}</>;
  }

  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      <LoadingProvider>
        <WithGlobalLoading>{children}</WithGlobalLoading>
      </LoadingProvider>
    </HeroUIProvider>
  );
}
