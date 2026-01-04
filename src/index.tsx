import { registerSW } from "virtual:pwa-register";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import "@/styles/globals.css";

// Import do helper do vite-plugin-pwa

// Inicializa o SW com atualização automática
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Força atualização imediata quando há nova versão
    updateSW(true);
  },
  onOfflineReady() {
    // eslint-disable-next-line no-console
    console.log("Aplicativo pronto para uso offline 🚀");
  },
});

// Listener: quando o SW assume, recarrega a página (com guarda para não interferir no toast pós-login)
if ("serviceWorker" in navigator) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // Se o login acabou de ocorrer, pulamos um reload para não perder o toast
    const skipOnce = sessionStorage.getItem("skipReloadForToast");
    if (skipOnce === "1") {
      sessionStorage.removeItem("skipReloadForToast");
      return;
    }

    if (!reloaded) {
      reloaded = true;
      window.location.reload();
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Provider>
      <App />
    </Provider>
  </BrowserRouter>
);
