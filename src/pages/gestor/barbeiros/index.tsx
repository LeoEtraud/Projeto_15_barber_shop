import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Button, Card, CardBody } from "@heroui/react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthProvider/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/PermissionGate";

/**
 * Página de Gerenciamento de Barbeiros - Apenas para Gestores
 *
 * Funcionalidades:
 * - Listar barbeiros
 * - Adicionar novo barbeiro
 * - Editar barbeiro
 * - Desativar/Ativar barbeiro
 */
export function GestorBarbeirosPage() {
  const { user } = useAuth();
  const { isGestor } = usePermissions();
  const [barbeiros] = useState([
    // Exemplo de dados - substituir por chamada à API
    { id: "1", nome: "João Silva", email: "joao@email.com", status: "ativo" },
    {
      id: "2",
      nome: "Maria Santos",
      email: "maria@email.com",
      status: "ativo",
    },
  ]);

  if (!isGestor) {
    return (
      <section className="min-h-screen bg-gray-800 flex flex-col text-white items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
        <p className="text-gray-400">
          Apenas gestores podem acessar esta página.
        </p>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-800 flex flex-col text-white">
      <Header />

      <div className="px-4 py-8 md:px-8 flex-1">
        <Helmet title="Gerenciar Barbeiros - Gestor" />

        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Gerenciar Barbeiros
              </h1>
              <p className="text-gray-400">
                Gerencie os profissionais da barbearia
              </p>
            </div>
            <PermissionGate requiredPermissions={["manage_barbers"]}>
              <Button color="primary" size="lg">
                + Adicionar Barbeiro
              </Button>
            </PermissionGate>
          </div>

          {/* Lista de Barbeiros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {barbeiros.map((barbeiro) => (
              <Card
                key={barbeiro.id}
                className="bg-gray-900 border border-gray-700"
              >
                <CardBody className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {barbeiro.nome}
                      </h3>
                      <p className="text-gray-400 text-sm">{barbeiro.email}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        barbeiro.status === "ativo"
                          ? "bg-green-600 text-white"
                          : "bg-gray-600 text-gray-300"
                      }`}
                    >
                      {barbeiro.status}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <PermissionGate requiredPermissions={["manage_barbers"]}>
                      <Button
                        fullWidth
                        color="primary"
                        size="sm"
                        variant="flat"
                      >
                        Editar
                      </Button>
                    </PermissionGate>
                    <PermissionGate requiredPermissions={["manage_barbers"]}>
                      <Button fullWidth color="danger" size="sm" variant="flat">
                        {barbeiro.status === "ativo" ? "Desativar" : "Ativar"}
                      </Button>
                    </PermissionGate>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Mensagem quando não há barbeiros */}
          {barbeiros.length === 0 && (
            <div className="bg-gray-900 rounded-lg p-12 text-center border border-gray-700">
              <p className="text-gray-400 text-lg mb-4">
                Nenhum barbeiro cadastrado
              </p>
              <PermissionGate requiredPermissions={["manage_barbers"]}>
                <Button color="primary">Adicionar Primeiro Barbeiro</Button>
              </PermissionGate>
            </div>
          )}

          {/* Informações do Gestor */}
          <Card className="bg-gray-900 border border-gray-700 mt-6">
            <CardBody className="p-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Informações
              </h2>
              <p className="text-gray-400 text-sm">
                Você está logado como:{" "}
                <span className="text-yellow-400 font-semibold">
                  {user?.user?.nome}
                </span>
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Role:{" "}
                <span className="text-blue-400 font-semibold">GESTOR</span>
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      <Footer />
    </section>
  );
}
