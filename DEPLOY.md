# 🚀 Guia de Deploy - Barber Shop

## 📋 Configuração de Variáveis de Ambiente

### Problema Comum: Imagens não carregam em produção

Se as imagens dos barbeiros não estiverem aparecendo no ambiente de produção, é porque a variável de ambiente `VITE_API` não está configurada corretamente.

---

## 🔧 Configuração no Vercel

### Passo 1: Acessar as Configurações do Projeto

1. Acesse [vercel.com](https://vercel.com)
2. Selecione seu projeto
3. Clique em **Settings** (Configurações)

### Passo 2: Adicionar Variável de Ambiente

1. No menu lateral, clique em **Environment Variables**
2. Adicione a seguinte variável:

   ```
   Nome: VITE_API
   Valor: https://barber-shop-api-i1me.onrender.com
   ```

3. Selecione os ambientes onde a variável deve estar disponível:

   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. Clique em **Save**

### Passo 3: Fazer Redeploy

Após adicionar a variável de ambiente, você precisa fazer um novo deploy:

**Opção 1: Pelo Dashboard**

1. Vá na aba **Deployments**
2. Clique nos três pontos (⋮) do último deploy
3. Selecione **Redeploy**

**Opção 2: Pelo Git**

1. Faça qualquer alteração no código (ou commit vazio)
2. Faça push para o repositório
   ```bash
   git commit --allow-empty -m "chore: trigger redeploy"
   git push
   ```

---

## 🔍 Verificação

Após o redeploy, você pode verificar se está funcionando:

1. Abra o console do navegador (F12)
2. Verifique se há o aviso: `"VITE_API não está configurada..."`
3. Se não houver o aviso, a configuração está correta ✅
4. As imagens dos barbeiros devem carregar normalmente

---

## 📝 Variáveis de Ambiente Disponíveis

### Desenvolvimento Local

```env
VITE_API=http://localhost:4003
```

### Produção (Render - Atual)

```env
VITE_API=https://barber-shop-api-i1me.onrender.com
```

### Produção (Vercel - Alternativa)

```env
VITE_API=https://back-end-barber-shop.vercel.app
```

---

## 🛠️ Comandos Úteis

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

---

## 📌 Notas Importantes

1. **Variáveis de ambiente no Vite** devem começar com `VITE_` para serem acessíveis no frontend
2. Após alterar variáveis de ambiente, sempre faça um **novo build/deploy**
3. O arquivo `.env` não é enviado para o Git (está no `.gitignore`)
4. Use `.env.local` para desenvolvimento local
5. Configure as variáveis diretamente na plataforma de deploy (Vercel, Netlify, etc.)

---

## 🐛 Troubleshooting

### Imagens ainda não aparecem após configurar VITE_API

1. **Verifique se o redeploy foi feito** após adicionar a variável
2. **Limpe o cache do navegador** (Ctrl + Shift + Delete)
3. **Verifique o console** do navegador para erros
4. **Teste a URL da API** diretamente no navegador:
   ```
   https://barber-shop-api-i1me.onrender.com/barbeiros/avatar/[nome-do-arquivo]
   ```

### Como testar localmente

```bash
# 1. Certifique-se de ter o arquivo .env.local
echo 'VITE_API=https://barber-shop-api-i1me.onrender.com' > .env.local

# 2. Reinicie o servidor de desenvolvimento
npm run dev
```

---

## 📞 Suporte

Se o problema persistir:

1. Verifique se a API está online e respondendo
2. Verifique os logs do Vercel na aba "Deployments"
3. Verifique se há erros de CORS na API

---

**Última atualização:** Outubro 2024
