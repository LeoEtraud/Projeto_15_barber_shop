import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Hook para fazer scroll para o topo da página quando a rota muda
 */
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname]);
}

