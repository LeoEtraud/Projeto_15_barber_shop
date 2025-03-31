import { Route, Routes } from "react-router-dom";

import { DocsPage } from "@/pages/docs";
import { PricingPage } from "@/pages/pricing";
import { BlogPage } from "@/pages/blog";
import { AboutPage } from "@/pages/about";
import { NotFound } from "@/pages/404";
import { Login } from "@/pages";
import { ResetPassword } from "@/pages/resetPassword";
import { CreateAccount } from "@/pages/createAccount";

export function Router() {
  return (
    <Routes>
      {/* ROTA DA PÁGINA NÃO ENCONTRADA  */}
      <Route element={<NotFound />} path="*" />
      <Route element={<Login />} path="/" />
      <Route element={<CreateAccount />} path="/register" />
      <Route element={<ResetPassword />} path="/recovery" />
      <Route element={<DocsPage />} path="/docs" />
      <Route element={<PricingPage />} path="/pricing" />
      <Route element={<BlogPage />} path="/blog" />
      <Route element={<AboutPage />} path="/about" />
    </Routes>
  );
}
