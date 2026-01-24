import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";

import { LoadingProvider } from "@/contexts/LoadingProvider";
import { ThemeProvider } from "@/contexts/ThemeProvider";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <ThemeProvider>
      <HeroUIProvider navigate={navigate} useHref={useHref}>
        <LoadingProvider>{children}</LoadingProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}
