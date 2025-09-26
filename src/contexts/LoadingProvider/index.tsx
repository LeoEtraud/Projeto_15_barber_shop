import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { CircularProgress } from "@heroui/react";

type LoadingContextValue = {
  isLoading: boolean;
  show: () => void;
  hide: () => void;
  withLoading: <T>(promise: Promise<T>) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | undefined>(
  undefined,
);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const show = useCallback(() => setIsLoading(true), []);
  const hide = useCallback(() => setIsLoading(false), []);

  const withLoading = useCallback(async <T,>(promise: Promise<T>) => {
    setIsLoading(true);
    try {
      return await promise;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ isLoading, show, hide, withLoading }),
    [isLoading, show, hide, withLoading],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <CircularProgress
              aria-label="Loading..."
              color="primary"
              size="md"
            />
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);

  if (!ctx) {
    throw new Error("useLoading deve ser usado dentro de LoadingProvider");
  }

  return ctx;
}
