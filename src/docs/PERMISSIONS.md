# Sistema de Permissões e Roles

Este documento descreve o sistema de permissões baseado em roles implementado no projeto.

## Roles Disponíveis

O sistema possui três roles principais:

- **CLIENTE**: Usuário comum que agenda serviços
- **PROFISSIONAL**: Barbeiro que presta serviços
- **GESTOR**: Administrador da barbearia com acesso total

## Permissões

### Permissões do CLIENTE
- `view_own_appointments`: Ver próprios agendamentos
- `create_appointments`: Criar agendamentos
- `cancel_appointments`: Cancelar agendamentos
- `view_appointments`: Ver agendamentos (próprios)

### Permissões do PROFISSIONAL
- `view_own_appointments`: Ver próprios agendamentos
- `view_appointments`: Ver agendamentos
- `manage_schedules`: Gerenciar horários
- `view_dashboard`: Ver dashboard

### Permissões do GESTOR
- `view_all_appointments`: Ver todos os agendamentos
- `manage_barbers`: Gerenciar barbeiros
- `manage_services`: Gerenciar serviços
- `manage_schedules`: Gerenciar horários
- `view_reports`: Ver relatórios
- `manage_users`: Gerenciar usuários
- `view_dashboard`: Ver dashboard
- `manage_barbearia`: Gerenciar configurações da barbearia
- `create_appointments`: Criar agendamentos
- `cancel_appointments`: Cancelar agendamentos

## Como Usar

### 1. Hook usePermissions

```tsx
import { usePermissions } from "@/hooks/usePermissions";

function MyComponent() {
  const {
    userRole,
    isCliente,
    isProfissional,
    isGestor,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
  } = usePermissions();

  // Verificar role
  if (isGestor) {
    // Código apenas para gestores
  }

  // Verificar permissão específica
  if (checkPermission("manage_barbers")) {
    // Código para quem pode gerenciar barbeiros
  }

  return <div>...</div>;
}
```

### 2. Componente PermissionGate

Renderiza conteúdo condicionalmente baseado em permissões:

```tsx
import { PermissionGate } from "@/components/PermissionGate";

function MyComponent() {
  return (
    <div>
      {/* Botão apenas para gestores */}
      <PermissionGate allowedRoles={[UserRole.GESTOR]}>
        <Button>Gerenciar Barbeiros</Button>
      </PermissionGate>

      {/* Botão com permissão específica */}
      <PermissionGate requiredPermissions={["manage_services"]}>
        <Button>Gerenciar Serviços</Button>
      </PermissionGate>

      {/* Múltiplas permissões (qualquer uma) */}
      <PermissionGate
        requiredPermissions={["manage_barbers", "manage_services"]}
      >
        <Button>Gerenciar</Button>
      </PermissionGate>

      {/* Todas as permissões necessárias */}
      <PermissionGate
        requiredPermissions={["manage_barbers", "view_reports"]}
        requireAllPermissions={true}
      >
        <Button>Relatório de Barbeiros</Button>
      </PermissionGate>
    </div>
  );
}
```

### 3. Proteção de Rotas

Use `RoleProtectedRoute` para proteger rotas inteiras:

```tsx
import { RoleProtectedRoute } from "@/routes/roleProtectedRoute";
import { UserRole } from "@/types/roles";

// Rota apenas para gestores
<Route
  element={
    <RoleProtectedRoute allowedRoles={[UserRole.GESTOR]}>
      <GestorDashboardPage />
    </RoleProtectedRoute>
  }
  path="/gestor/dashboard"
/>

// Rota para profissionais e gestores
<Route
  element={
    <RoleProtectedRoute
      allowedRoles={[UserRole.PROFISSIONAL, UserRole.GESTOR]}
    >
      <ProfissionalDashboardPage />
    </RoleProtectedRoute>
  }
  path="/profissional/dashboard"
/>

// Rota com permissão específica
<Route
  element={
    <RoleProtectedRoute
      requiredPermissions={["manage_barbers"]}
      accessDeniedMessage="Apenas gestores podem acessar esta página."
    >
      <ManageBarbersPage />
    </RoleProtectedRoute>
  }
  path="/gestor/barbeiros"
/>
```

## Estrutura de Pastas Sugerida

```
src/
  pages/
    cliente/          # Páginas para clientes
      dashboard/
      appointments/
    profissional/     # Páginas para barbeiros
      dashboard/
      appointments/
      schedule/
      profile/
    gestor/           # Páginas para gestores
      dashboard/
      barbeiros/
      servicos/
      agendamentos/
      relatorios/
      configuracoes/
```

## Exemplos de Páginas

### Dashboard do Profissional
- Ver agendamentos do dia
- Histórico de atendimentos
- Gerenciar horários disponíveis
- Estatísticas pessoais

### Dashboard do Gestor
- Visão geral da barbearia
- Gerenciar barbeiros
- Gerenciar serviços
- Relatórios e estatísticas
- Gerenciar todos os agendamentos
- Configurações da barbearia

## Boas Práticas

1. **Sempre verifique permissões no frontend E no backend**
2. **Use PermissionGate para elementos visuais**
3. **Use RoleProtectedRoute para rotas completas**
4. **Documente permissões necessárias em cada página**
5. **Mantenha o mapeamento de permissões atualizado**

## Adicionando Novas Permissões

1. Adicione a permissão no enum `Permission` em `src/types/roles.ts`
2. Adicione a permissão ao mapeamento `RolePermissions`
3. Atualize esta documentação

