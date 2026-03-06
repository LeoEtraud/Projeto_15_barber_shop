# 📋 Regras de Negócio e Padrões de Desenvolvimento

## 📌 Visão Geral do Sistema

Sistema de gerenciamento de barbearia que permite:
- Agendamento de serviços por clientes
- Gerenciamento de profissionais (barbeiros)
- Controle de horários de funcionamento
- Processamento de pagamentos via Mercado Pago
- Dashboard para gestores
- Sistema de avaliações

---

## 🛠️ Stack Tecnológico

### Backend
- **Runtime**: Node.js 20.x
- **Framework**: Express.js
- **Linguagem**: TypeScript
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL (Neon)
- **Autenticação**: JWT (jsonwebtoken)
- **Validação**: express-validator
- **Upload de Arquivos**: Multer
- **Processamento de Imagens**: Sharp
- **Email**: Nodemailer
- **Pagamentos**: Mercado Pago SDK
- **WebSocket**: Socket.io
- **Rate Limiting**: express-rate-limit
- **Build**: TypeScript Compiler (tsc)

### Frontend
- **Framework**: React 18.3.1
- **Linguagem**: TypeScript
- **Build Tool**: Vite 5.2.x
- **Roteamento**: React Router DOM 6.23.0
- **Estilização**: TailwindCSS 3.4.17
- **UI Components**: HeroUI (@heroui/react)
- **Formulários**: React Hook Form + Yup + @hookform/resolvers
- **HTTP Client**: Axios
- **Animações**: Framer Motion, Lottie (lottie-react, @lottiefiles/dotlottie-react)
- **Ícones**: Heroicons, Phosphor Icons, React Icons
- **PWA**: Vite Plugin PWA
- **Cookies**: js-cookie
- **Pagamentos (UI)**: @mercadopago/sdk-react
- **SEO/Head**: react-helmet-async

### DevOps & Deploy
- **Backend**: Render.com
- **Frontend**: Vercel
- **Banco de Dados**: Neon PostgreSQL
- **Versionamento**: Git

---

## 📐 Estrutura de Pastas

### Backend (`back_barber_shop/`)
```
src/
├── app.ts                    # Configuração do Express
├── server.ts                 # Inicialização do servidor
├── config/                   # Configurações (SMTP, JWT, etc.)
├── controllers/              # Lógica de negócio
│   ├── BarberController/
│   ├── DashboardController/
│   ├── HoursFunctionmentController/
│   ├── MercadoPagoController/
│   ├── SchedulesController/
│   ├── ServicesController/
│   └── UserController/
├── database/                 # Cliente Prisma
├── events/                   # Eventos Socket.io
├── lib/                      # Bibliotecas auxiliares
├── middlewares/              # Middlewares (auth, validação)
├── routes/                   # Definição de rotas
└── templateEmail/            # Templates de email
prisma/
├── schema.prisma             # Schema do banco
└── migrations/               # Migrations do Prisma
scripts/
├── build.sh                  # Script de build
└── start.sh                  # Script de inicialização
```

### Frontend (`front_barber_shop/`)
```
src/
├── App.tsx                   # Componente raiz
├── index.tsx                 # Entry point
├── provider.tsx              # Providers globais
├── components/               # Componentes reutilizáveis (ex: GerenciarAgendamentos, PermissionGate)
├── contexts/                 # Context API (Auth, Schedule, Loading)
├── hooks/                    # Custom hooks (ex: usePermissions)
├── pages/                    # Páginas (choiceBarber, choiceService, choiceSchedule, confirmAppointment, gestor/*, profissional/dashboard, etc.)
├── routes/                   # Router, PrivateRoute, RoleProtectedRoute
├── services/                 # apiServer (Axios + interceptors)
├── types/                    # Tipos TypeScript (roles, etc.)
├── utils/                    # Funções utilitárias
├── styles/                   # Estilos globais
└── docs/                     # PERMISSIONS.md
```
**Rotas principais**: `/`, `/register`, `/recovery`, `/home`, `/choice-barber`, `/choice-service`, `/choice-schedule`, `/confirm-appointment`, `/history-appointments`, `/user-profile/:id`, `/profissional/dashboard`, `/gestor/dashboard`, `/gestor/barbeiros`, `/gestor/servicos`, `/gestor/horarios`, `/gestor/agendamentos`

---

## 🎯 Regras de Negócio

### 1. Sistema de Agendamentos

#### 1.1. Criação de Agendamento
- **Cliente**
  - Pode criar agendamentos apenas para horários futuros
  - Pode selecionar quantos serviços desejar (um ou mais)
  - A seleção de data e horários se ajusta conforme a quantidade e a duração total dos serviços
  - Fluxo: escolher barbeiro → serviços → data → horário → pagamento PIX
- **Gestor**
  - Pode criar agendamentos em nome de clientes (página de agendamentos do gestor)
  - Mesmas regras de horários disponíveis e múltiplos serviços
- Um agendamento pode conter múltiplos serviços
- A duração total é a soma das durações dos serviços (snapshot no momento do agendamento)
- O valor total é a soma dos preços dos serviços (snapshot no momento do agendamento)
- **Criação via API**: o agendamento é criado no endpoint de pagamento PIX (`createPixPayment`): primeiro cria o agendamento com status **PENDENTE** e o pagamento **PENDENTE**, depois o webhook/polling atualiza para **CONFIRMADO** quando o PIX for aprovado

#### 1.2. Horários Disponíveis
- **Geração de slots**: feita no **frontend** (páginas `choiceSchedule`, `GerenciarAgendamentos`, gestor/agendamentos) com base nos horários de funcionamento da API e nos agendamentos **CONFIRMADOS** do barbeiro (API `get-schedules/:id`)
- Horários são gerados em intervalos de **30 minutos**
- Considera horário de abertura e fechamento da barbearia (regra efetiva do dia: exceção da data ou padrão do dia da semana)
- Respeita intervalo de almoço (se configurado) — slots no intervalo de almoço não são oferecidos
- Não permite agendamentos em horários já ocupados (sobreposição com agendamentos CONFIRMADOS)
- Não permite agendamentos em horários passados (para o dia atual)
- Não permite agendamentos em feriados ou dias com exceção marcada como `is_feriado: true`
- **Validação no backend**: no `createPixPayment` o backend valida se o barbeiro trabalha no dia, se não é feriado, se o horário está dentro do funcionamento e fora do almoço antes de criar o agendamento

#### 1.3. Status de Agendamento
- **PENDENTE**: Agendamento criado, aguardando confirmação/pagamento
- **CONFIRMADO**: Agendamento confirmado e pago
- **REALIZADO**: Serviço foi executado
- **CANCELADO**: Agendamento foi cancelado

#### 1.4. Reagendamento
- Apenas agendamentos **CONFIRMADOS** podem ser reagendados
- Deve respeitar as mesmas regras de horários disponíveis
- Pode alterar data, horário e/ou barbeiro
- Mantém os mesmos serviços do agendamento original

#### 1.5. Conversão de Timezone
**REGRA CRÍTICA**:
- **Backend**: Sempre salva datas/horários em **UTC** no banco de dados (Prisma `DateTime`)
- **Frontend**: Sempre exibe datas/horários no horário local do usuário (UTC-3, horário de Brasília)
- **Conversão Backend**: Ao receber horário local do frontend, adiciona 3 horas para converter para UTC (ex.: em `rescheduleAppointment` e em `createPixPayment` com string `selectedDate` + `selectedTime` ou ISO com offset `-03:00`)
  - Exemplo: Frontend envia `09:00` (UTC-3) → Backend salva `12:00 UTC`
- **Conversão Frontend**: Usar `parseUTCDate()` (ScheduleProvider): se a string não tiver timezone (Z ou ±HH:MM), adiciona `Z` e usa `new Date(dateString)` para exibir com métodos locais (`getDate()`, `getHours()`, etc.)
  - Exemplo: API retorna `12:00 UTC` → Frontend exibe `09:00` (UTC-3)

#### 1.6. Cancelamento
- A permissão `cancel_appointments` existe para CLIENTE e GESTOR; no código atual não há endpoint dedicado de cancelamento (alterar status para CANCELADO). Cancelamentos podem ser implementados via PATCH em agendamento ou rota específica.

### 2. Horários de Funcionamento

#### 2.1. Tipos de Regras
- **PADRAO**: Regra padrão para um dia da semana (ex: Segunda-feira 09:00-19:00)
- **EXCECAO**: Regra específica para uma data (ex: 25/12/2026 - Fechado)

#### 2.2. Prioridade de Regras
Ao verificar horário disponível para uma data:
1. **Primeiro**: Busca exceção específica para a data
2. **Segundo**: Busca regra padrão com profissionais associados
3. **Terceiro**: Busca regra padrão sem profissionais específicos
4. **Último**: Busca qualquer regra padrão não-feriado para o dia da semana

#### 2.3. Configuração de Horários
- **horario_abertura**: Horário de início (formato HH:MM)
- **horario_fechamento**: Horário de fim (formato HH:MM)
- **tem_almoco**: Boolean indicando se há intervalo de almoço
- **horario_almoco_inicio**: Início do almoço (formato HH:MM)
- **horario_almoco_fim**: Fim do almoço (formato HH:MM)
- **is_feriado**: Boolean indicando se é feriado (não permite agendamentos)

#### 2.4. Associação com Profissionais
- Um horário pode ter profissionais específicos associados
- Se houver profissionais associados, apenas eles podem atender nesse horário
- Se não houver profissionais associados, qualquer profissional ativo pode atender

### 3. Sistema de Usuários e Permissões

#### 3.1. Roles (Papéis)
- **CLIENTE**: Usuário que agenda serviços
- **PROFISSIONAL**: Barbeiro que presta serviços
- **GESTOR**: Administrador com acesso total

#### 3.2. Permissões por Role

**CLIENTE:**
- `view_own_appointments`: Ver próprios agendamentos
- `create_appointments`: Criar agendamentos
- `cancel_appointments`: Cancelar agendamentos
- `view_appointments`: Ver agendamentos (próprios)

**PROFISSIONAL:**
- `view_own_appointments`: Ver próprios agendamentos
- `view_appointments`: Ver agendamentos
- `manage_schedules`: Gerenciar horários
- `view_dashboard`: Ver dashboard

**GESTOR:**
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

#### 3.3. Autenticação
- Usa JWT (JSON Web Token) para autenticação
- Token armazenado em cookie (`barberToken`) via js-cookie no frontend; envio em header `Authorization: Bearer <token>`
- O backend pode retornar novo token no header `new-token`; o interceptor do Axios atualiza o cookie
- Middleware `checkToken` (backend) valida token em rotas protegidas (ex.: create-service, update-service, delete-service)
- Token contém `id` do usuário
- Rotas públicas: `/auth`, `/register-user`, `/recover-password`, `/reset-password`, `/get-services`, `/get-barbers`, `/get-horarios-funcionamento/:id`, `/mercado-pago/*` (payment/pix/webhook)

### 4. Pagamentos

#### 4.1. Integração Mercado Pago
- **PIX** (fluxo principal): endpoint `POST /mercado-pago/pix` cria o pagamento no MP e, em sequência, o agendamento (PENDENTE) e o registro de pagamento (PENDENTE) no banco; o front exibe QR Code e faz polling em `GET /mercado-pago/pix/:id/status`; quando o MP aprova, o backend atualiza pagamento para PAGO e agendamento para CONFIRMADO (também via webhook `POST /mercado-pago/webhook-pix`)
- **Checkout Pro** (legado): `POST /mercado-pago/payment` cria preferência e redireciona; `GET /mercado-pago/pending` verifica pagamento pendente
- Metadata obrigatória no PIX: `barberId`, `userId`, `selectedDate`, `selectedTime`, `services` (array com id, preco, duracao); opcional `totalDuration`
- Webhook e polling usam `processApprovedPixPayment`: buscam pagamento por `id_pagamento_mp`, atualizam status e agendamento (idempotente se já PAGO)

#### 4.2. Status de Pagamento
- **PENDENTE**: Pagamento aguardando confirmação (PIX gerado, agendamento PENDENTE)
- **PAGO**: Pagamento confirmado (agendamento CONFIRMADO)
- **FALHADO**: Pagamento falhou

#### 4.3. Fluxo de Pagamento (PIX)
1. Front envia `POST /mercado-pago/pix` com valor, payer, metadata (barberId, userId, selectedDate, selectedTime, services)
2. Backend valida horário (funcionamento, feriado, almoço, barbeiro no dia), cria pagamento no MP, cria agendamento PENDENTE e pagamento PENDENTE no banco
3. Backend retorna `id`, `qr_code_base64`, `qr_code` para o front exibir
4. Cliente paga via PIX; front faz polling em `GET /mercado-pago/pix/:id/status` ou MP chama webhook
5. Quando status `approved`, backend atualiza pagamento para PAGO e agendamento para CONFIRMADO

### 5. Profissionais (Barbeiros)

#### 5.1. Status
- **ATIVO**: Profissional pode receber agendamentos
- **INATIVO**: Profissional não recebe novos agendamentos

#### 5.2. Funções
- **Barbeiro**: Presta serviços de corte/barba
- **Atendente**: Atende clientes
- **Gestor**: Administra a barbearia

#### 5.3. Avaliações
- Cliente pode avaliar após agendamento **REALIZADO**
- Nota de 1 a 5 estrelas
- Comentário opcional
- Média de avaliações calculada automaticamente

### 6. Serviços

#### 6.1. Campos
- **nome**: Nome do serviço
- **descricao**: Descrição detalhada
- **preco**: Preço em Decimal (10,2)
- **duracao**: Duração em minutos
- **imagem**: URL da imagem (opcional)

#### 6.2. Regras
- Serviços são específicos por barbearia
- Um agendamento pode ter múltiplos serviços
- Preço e duração são salvos no momento do agendamento (snapshot)

---

## 📝 Padrões de Desenvolvimento

### 1. Nomenclatura

#### Arquivos e Pastas
- **Controllers**: PascalCase com sufixo `Controller` (ex: `SchedulesController`)
- **Components**: PascalCase (ex: `Header.tsx`)
- **Hooks**: camelCase com prefixo `use` (ex: `useAuth.tsx`)
- **Utils**: camelCase (ex: `formatDate.ts`)
- **Types**: PascalCase (ex: `types.ts`)
- **Routes**: camelCase com sufixo `Routes` (ex: `schedulesRoutes.ts`)

#### Variáveis e Funções
- **Variáveis**: camelCase (ex: `userName`, `agendamentos`)
- **Funções**: camelCase (ex: `getAppointments`, `createSchedule`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `API_URL`, `MAX_DURATION`)
- **Interfaces/Types**: PascalCase (ex: `IAppointments`, `UserRole`)
- **Enums**: PascalCase (ex: `StatusAgendamento`, `Role`)

#### Banco de Dados
- **Tabelas**: PascalCase singular (ex: `Agendamento`, `Usuario`)
- **Campos**: snake_case (ex: `hora_inicio`, `id_cliente`)
- **Relacionamentos**: camelCase (ex: `cliente`, `profissional`)

### 2. Estrutura de Código

#### Controllers (Backend)
```typescript
export class ControllerName {
  async methodName(request: Request, response: Response): Promise<void> {
    try {
      // Validação de entrada
      // Lógica de negócio
      // Resposta
    } catch (error) {
      console.error("Erro:", error);
      response.status(500).json({ message: "Erro ao processar" });
    }
  }
}
```

#### Components (Frontend)
```typescript
export function ComponentName() {
  // Hooks
  // Estados
  // Funções
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

#### Contexts (Frontend)
```typescript
// Estrutura padrão:
// contexts/ContextName/
//   ├── index.tsx        # Provider e lógica
//   ├── types.ts         # Tipos e interfaces
//   ├── useContext.tsx   # Hook customizado (ex: useAuth)
//   └── util.ts          # Funções utilitárias e chamadas API (ex: ScheduleProvider/util.ts)
```

#### Proteção de Rotas (Frontend)
- **PrivateRoute**: exige usuário autenticado (token); redireciona para `/` se não autenticado
- **RoleProtectedRoute**: exige autenticação e role/permissão; props: `allowedRoles`, `requiredPermissions`, `requireAllPermissions`, `accessDeniedMessage`, `redirectTo`
- Uso: rotas de gestor usam `allowedRoles={[UserRole.GESTOR]}` e opcionalmente `requiredPermissions={["manage_barbers"]}` etc.; profissional usa `[UserRole.PROFISSIONAL, UserRole.GESTOR]`
- Permissões e roles vêm de `usePermissions()` e `src/types/roles.ts` (RolePermissions, Permission, UserRole)

### 3. Tratamento de Datas e Timezone

#### Backend - Salvar em UTC
```typescript
// ✅ CORRETO: Converter horário local para UTC
const horaUTC = horaLocal + 3; // UTC-3 → UTC
const timestampUTC = Date.UTC(ano, mes - 1, dia, horaUTC, minuto, 0, 0);
const horaInicio = new Date(timestampUTC);

// ❌ ERRADO: Salvar horário local como se fosse UTC
const horaInicio = new Date(ano, mes - 1, dia, horaLocal, minuto, 0, 0);
```

#### Frontend - Exibir em Local
```typescript
// ✅ CORRETO: Converter UTC para local
function parseUTCDate(dateString: string): Date {
  const hasTimezone = dateString.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateString);
  if (!hasTimezone) {
    dateString = `${dateString}Z`;
  }
  return new Date(dateString); // Automaticamente converte para local
}

// Usar métodos locais para exibição
const day = String(date.getDate()).padStart(2, "0");
const month = String(date.getMonth() + 1).padStart(2, "0");
const hours = String(date.getHours()).padStart(2, "0");
```

### 4. Validação de Dados

#### Backend
- Usar `express-validator` para validação de rotas
- Validar tipos, formatos e regras de negócio
- Retornar erros descritivos (status 400)

#### Frontend
- Usar `react-hook-form` + `yup` para validação de formulários
- Validação em tempo real
- Mensagens de erro claras

### 5. Tratamento de Erros

#### Backend
```typescript
try {
  // Código
} catch (error) {
  console.error("[CONTEXT] Erro:", error);
  response.status(500).json({ 
    message: "Erro ao processar requisição" 
  });
}
```

#### Frontend
```typescript
try {
  // Código
} catch (error) {
  console.error("Erro:", error);
  addToast({
    title: "Erro",
    description: "Não foi possível processar a ação",
    color: "danger",
  });
}
```

### 6. Logs

#### Backend
- Usar prefixos contextuais: `[RESCHEDULE]`, `[CREATE_APPOINTMENT]`
- Logar dados importantes para debug
- Logar erros com stack trace

#### Frontend
- Logar apenas em desenvolvimento
- Não logar informações sensíveis

### 7. API Responses

#### Sucesso
```typescript
response.status(200).json({ 
  data: result,
  message: "Operação realizada com sucesso" 
});
// Ou diretamente: response.status(200).json({ schedules: agendamentosFuturos });
```

#### Erro
```typescript
response.status(400).json({ 
  message: "Mensagem de erro descritiva" 
});
```

### 7.1. Resumo das Rotas do Backend (sem prefixo /api)
- **User**: `POST /register-user`, `POST /auth`, `POST /recover-password`, `PUT /change-password`, `POST /reset-password`, `GET /get-user/:id`, `PUT /update-user`
- **Barber**: `GET /get-barbers`, `GET /get-professional-all`, `POST /create-professional`, `PATCH /update-professional/:id`, `DELETE /delete-professional/:id`
- **Services**: `GET /get-services`, `POST /create-service` (checkToken), `PATCH /update-service/:id` (checkToken), `DELETE /delete-service/:id` (checkToken)
- **Schedules**: `GET /get-schedules/:id` (agendamentos CONFIRMADOS do barbeiro), `GET /get-appointments/:id` (cliente), `GET /get-appointments-professional/:id`, `PATCH /confirm-appointment/:id`, `PATCH /reschedule-appointment/:id`
- **Hours**: `GET /get-horarios-funcionamento/:barbeariaId`, `PUT /update-horario-funcionamento/:id`, `POST /create-horario-excecao`, `DELETE /delete-horario-excecao/:id`
- **Mercado Pago**: `POST /mercado-pago/payment`, `GET /mercado-pago/pending`, `POST /mercado-pago/pix`, `GET /mercado-pago/pix/:id/status`, `POST /mercado-pago/webhook-pix`
- **Dashboard**: `GET /gestor/dashboard/stats/:id`
- **Health**: `GET /healthz`, `GET /healthz/db`

### 8. Imports

#### Ordem de Imports
1. Bibliotecas externas
2. Bibliotecas internas (@/)
3. Tipos e interfaces
4. Utilitários
5. Componentes
6. Estilos

```typescript
// Exemplo
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/react";

import { useAuth } from "@/contexts/AuthProvider";
import { IAppointments } from "@/contexts/ScheduleProvider/types";
import { formatDate } from "@/utils/formatDate";
```

### 9. TypeScript

#### Tipos
- Sempre tipar funções e variáveis
- Usar interfaces para objetos complexos
- Usar enums para valores fixos
- Evitar `any`, usar `unknown` quando necessário

#### Interfaces
```typescript
interface IAppointment {
  id: string;
  hora_inicio: string;
  hora_fim: string;
  status: StatusAgendamento;
}
```

### 10. CSS/TailwindCSS

#### Classes
- Usar classes utilitárias do Tailwind
- Evitar CSS inline quando possível
- Usar variantes do Tailwind para estados
- Mobile-first: classes base para mobile, `md:` para desktop

#### Exemplo
```tsx
<div className="flex flex-col md:flex-row gap-4 p-4">
  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
    Salvar
  </button>
</div>
```

### 11. Git Commits

#### Formato
```
tipo: descrição curta

Descrição detalhada (opcional)
```

#### Tipos
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Tarefas de manutenção

---

## 🔒 Segurança

### 1. Autenticação
- Tokens JWT com expiração
- Cookies httpOnly para tokens
- Validação de token em rotas protegidas

### 2. Validação
- Validar todos os inputs (backend: express-validator onde aplicável; controllers validam parâmetros e body)
- Sanitizar dados do usuário
- Validar permissões antes de operações sensíveis (front: RoleProtectedRoute e usePermissions; backend: checkToken em rotas de criação/edição)

### 3. Rate Limiting
- Implementar rate limiting em rotas sensíveis
- Prevenir ataques de força bruta

### 4. CORS
- Configurar CORS adequadamente
- Permitir apenas origens confiáveis

---

## 🚀 Deploy

### Backend (Render)
- Build: `npm run render-build`
- Start: `bash scripts/start.sh`
- Migrations: Executadas automaticamente no start
- Retry logic para migrations em caso de lock

### Frontend (Vercel)
- Build: `npm run build`
- Deploy automático via Git

### Variáveis de Ambiente
- Documentar todas as variáveis necessárias
- Não commitar `.env` files
- Usar `.env.example` como referência

---

## 📚 Referências Importantes

### Documentação Adicional
- `front_barber_shop/src/docs/PERMISSIONS.md` - Sistema de permissões (roles, PermissionGate, RoleProtectedRoute, usePermissions)
- `front_barber_shop/MELHORIAS-AGENDAMENTO.md` - Melhorias no agendamento (slots ocupados, passados, interface)
- `back_barber_shop/SOLUCAO-BANCO-DADOS-RENDER.md` - Configuração do banco no Render

### Enums do Sistema
- `Role`: CLIENTE, PROFISSIONAL, GESTOR
- `StatusAgendamento`: PENDENTE, CONFIRMADO, REALIZADO, CANCELADO
- `StatusPagamento`: PENDENTE, PAGO, FALHADO
- `DiaSemana`: SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA, SABADO, DOMINGO
- `TipoRegraHorario`: PADRAO, EXCECAO
- `FuncaoProfissional`: Barbeiro, Atendente, Gestor

---

## ⚠️ Pontos de Atenção

1. **Timezone**: Sempre converter corretamente entre UTC (banco) e local (frontend)
2. **Validações**: Validar horários disponíveis antes de criar agendamento
3. **Permissões**: Verificar permissões antes de operações sensíveis
4. **Status**: Respeitar fluxo de status (PENDENTE → CONFIRMADO → REALIZADO)
5. **Cascatas**: Entender relações de cascata no banco (onDelete: Cascade)
6. **Logs**: Manter logs detalhados para debug em produção
7. **Migrations**: Testar migrations localmente antes de deploy

---

**Última atualização**: 2026-03-06
**Versão do documento**: 1.1.0

