# SaaS para Agendamento de Serviços de Barbearias

Este é um sistema SaaS para o agendamento de serviços de barbearias, projetado para facilitar o gerenciamento de barbearias e a experiência do cliente. O sistema permite que as barbearias criem contas, cadastrem serviços e profissionais, e que os clientes agendem serviços com pagamento integrado.

## Estrutura do Banco de Dados

### Tabelas Principais

#### **Barbearias**

- `id` (PK)
- `nome`
- `endereco`
- `telefone`
- `email`
- `imagem_logo`
- `horario_funcionamento`
- `status` (ativo/inativo)
- `data_criacao`
- `data_atualizacao`

#### **Serviços**

- `id` (PK)
- `id_barbearia` (FK para Barbearias)
- `nome`
- `descricao`
- `preco`
- `duracao` (em minutos)
- `imagem`
- `data_criacao`
- `data_atualizacao`

#### **Profissionais**

- `id` (PK)
- `id_barbearia` (FK para Barbearias)
- `nome`
- `telefone`
- `email`
- `data_nascimento`
- `especialidade`
- `status` (ativo/inativo)
- `data_criacao`
- `data_atualizacao`

#### **Clientes**

- `id` (PK)
- `nome`
- `data_nascimento`
- `email`
- `telefone`
- `senha`
- `data_criacao`
- `data_atualizacao`

#### **Agendamentos**

- `id` (PK)
- `id_cliente` (FK para Clientes)
- `id_servico` (FK para Serviços)
- `id_profissional` (FK para Profissionais)
- `id_barbearia` (FK para Barbearias)
- `data_agendamento`
- `status` (confirmado, pendente, cancelado)
- `valor_pago`
- `data_criacao`
- `data_atualizacao`

#### **Pagamentos**

- `id` (PK)
- `id_agendamento` (FK para Agendamentos)
- `valor`
- `metodo_pagamento`
- `status_pagamento` (pendente, pago, falhado)
- `data_pagamento`
- `data_criacao`
- `data_atualizacao`

#### **Avaliações**

- `id` (PK)
- `id_agendamento` (FK para Agendamentos)
- `id_cliente` (FK para Clientes)
- `id_servico` (FK para Serviços)
- `id_profissional` (FK para Profissionais)
- `id_barbearia` (FK para Barbearias)
- `nota_da_avaliacao` (1 a 5)
- `data_criacao`
- `data_atualizacao`

### Relacionamentos

- Cada barbearia pode ter múltiplos profissionais e serviços.
- Cada agendamento é vinculado a um cliente, serviço, profissional e barbearia.
- Cada pagamento é vinculado a um agendamento específico.

## Fluxo de Processos

### 1. **Criação da Conta da Barbearia**

#### Cadastro da Barbearia

- A barbearia se registra no sistema com nome, endereço, telefone, e-mail e horários de funcionamento.
- Um perfil de barbearia é criado no banco de dados.

#### Cadastro de Profissionais e Serviços

- A barbearia cadastra seus profissionais (nome, especialidade, horários de trabalho).
- A barbearia também cadastra os serviços que serão oferecidos (nome, preço, duração).

#### Configuração de Pagamentos

- A barbearia configura as formas de pagamento (cartão de crédito, débito, Pix, etc.) e vincula à sua conta de pagamento.

### 2. **Cadastro e Login de Clientes**

#### Cadastro do Cliente

- O cliente cria uma conta com nome, e-mail, telefone e senha.

#### Login e Perfil do Cliente

- O cliente pode acessar seu perfil, histórico de agendamentos e agendar novos serviços.

### 3. **Agendamento do Serviço**

#### Escolha da Barbearia e Serviço

- O cliente escolhe a barbearia, o serviço desejado, o profissional (se houver preferência) e o horário disponível.

#### Seleção de Data e Hora

- O sistema verifica a disponibilidade do profissional e do serviço na data e hora escolhidas. Se o horário estiver ocupado, o cliente será notificado.

#### Confirmação do Agendamento

- O cliente confirma o agendamento e o sistema gera o agendamento com o status "pendente".

### 4. **Pagamento**

#### Método de Pagamento

- O cliente escolhe o método de pagamento (cartão de crédito, débito, etc.).

#### Pagamento

- O sistema processa o pagamento e, caso seja aprovado, o status do agendamento é alterado para "confirmado". Caso contrário, ele permanece "pendente".

#### Notificação para a Barbearia

- Após a confirmação do pagamento, a barbearia recebe uma notificação sobre o agendamento confirmado.

### 5. **Realização do Serviço**

#### Serviço Realizado

- Na data e hora do agendamento, o cliente comparece à barbearia e o profissional realiza o serviço.

#### Feedback do Cliente

- Após a realização do serviço, o cliente pode avaliar o serviço e o profissional.

#### Encerramento do Agendamento

- O agendamento é marcado como "concluído", e o pagamento é registrado como "pago".

### 6. **Cancelamento de Agendamento**

- O cliente pode cancelar o agendamento com antecedência e o status será alterado para "cancelado".
- Se o pagamento já foi realizado, a barbearia pode processar o reembolso, e o pagamento será atualizado no banco de dados.

## Considerações Finais

Com essa estrutura de banco de dados e fluxo de processos, seu SaaS pode oferecer uma solução eficiente para o agendamento de serviços de barbearias. A plataforma pode ser expandida para incluir funcionalidades adicionais como promoções, fidelização de clientes e integrações com outros sistemas de pagamento e CRM.

---

**Tecnologias Utilizadas:**

- Backend: Node.js, Express
- Banco de Dados: MySQL/PostgreSQL
- Frontend: React, Vite
- Pagamentos: Stripe, Pix, Cartão de Crédito/Débito

### FUNCIONALIDADES A SEREM IMPLEMENTADAS (20/11/2025) (✅ ❌)

- Mecanismo de autenticação de usuário através de Login Social (Conta Google).
- Ajustar o meu front para permitir agendamento de 2 serviços com horários fracionados como das 15:30 às 16:30
- Refatorar lógica de exibição de horários de agendamentos conforme o tempo dos serviços selecionados
- Implementar upload de imagens dos usuários utilizando o serviço da AWS S3 de armazenamento na nuvem
- Corrigir erro apresentado ao enviar código para recuperação de senha ❌
