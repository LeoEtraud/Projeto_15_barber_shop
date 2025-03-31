import { Helmet, HelmetProvider } from "react-helmet-async";

import { Router } from "./routes";

function App() {
  return (
    <HelmetProvider>
      <Helmet titleTemplate="%s | Barber Shop" />
      <Router />
    </HelmetProvider>
  );
}

export default App;
