
# ⚛️ Principais Princípios para Obter um Sistema React de Alta Performance (2025)

Com base nas melhores práticas atualizadas de **2025**, aqui estão os principais princípios e técnicas para construir aplicações **React** de **alta performance**.

---

## 1. 🧩 Controle de Re-renderizações

### 🎯 Entendimento

* Mudanças em **props**, **state** ou **context** disparam re-renders.
* Re-render do componente pai ou uso de `forceUpdate()` também causam re-renderizações.

### ⚙️ Técnicas de Prevenção

* **`React.memo()`**: Memoiza componentes funcionais para evitar re-renders desnecessários.
* **`PureComponent`**: Para componentes de classe, faz comparação superficial (shallow comparison) de props e state.

```jsx
const MeuComponente = React.memo(({ dados }) => {
  return <div>{dados}</div>;
});
```

---

## 2. 🧠 Memoização Inteligente

| Hook          | Função                                                    | Aplicação                                                |
| ------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `useMemo`     | Cacheia resultados de cálculos custosos entre re-renders. | Cálculos complexos e pesados.                            |
| `useCallback` | Memoiza funções para manter estabilidade de referência.   | Funções passadas como props para componentes memoizados. |

```jsx
// Exemplo useMemo
const resultadoCaro = useMemo(() => calcularAlgoComplexo(dados), [dados]);

// Exemplo useCallback
const handleClick = useCallback(() => {
  fazerAlgo(valor);
}, [valor]);
```

---

## 3. ⚡ Code Splitting e Lazy Loading

| Técnica                   | Descrição                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| `React.lazy` e `Suspense` | Carregam componentes sob demanda para reduzir o bundle inicial.                                     |
| Divisão de Bundles        | Separe código de vendors do código da aplicação. Use Webpack Bundle Analyzer ou Next.js (por rota). |

```jsx
const ComponentePesado = React.lazy(() => import('./ComponentePesado'));

function App() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ComponentePesado />
    </Suspense>
  );
}
```

---

## 4. 🧑‍🔀 Otimização de Context API

### Problema

Por padrão, qualquer atualização no Context causa re-render em **todos os componentes consumidores**.

### Soluções

* Divida Contexts em partes menores.
* Memoize o valor do Provider com `useMemo`.
* Considere bibliotecas como **Zustand** ou **Jotai** que evitam re-renders desnecessários.

```jsx
const value = useMemo(() => ({ user, settings }), [user, settings]);
return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
```

---

## 5. 🔄 Gerenciamento de Estado Eficiente

* Escolha o **nível adequado de estado** (local, compartilhado ou global).
* Evite estado global desnecessário.
* Use **React Query** ou **SWR** para cache e dedupe de dados externos.
* Para estados complexos: **Redux Toolkit**, **Zustand** ou **Jotai**.
* Prefira **estado local** (`useState`) sempre que possível.

---

## 6. ⚙️ Otimização do Virtual DOM

* Divida componentes grandes (princípio da responsabilidade única).
* Use **keys únicas e estáveis** em listas (evite usar o índice).
* Minimize manipulações diretas do DOM.

---

## 7. 📜 Virtualização de Listas Longas

Renderize apenas os itens visíveis em listas grandes.

**Bibliotecas recomendadas:**

* [`react-window`](https://www.npmjs.com/package/react-window) (leve)
* [`react-virtualized`](https://www.npmjs.com/package/react-virtualized) (mais recursos)

```jsx
import { FixedSizeList } from 'react-window';

<FixedSizeList height={500} itemCount={1000} itemSize={35} width={300}>
  {Row}
</FixedSizeList>
```

---

## 8. 🕹️ Recursos Concurrent do React

| Hook               | Função                                                      |
| ------------------ | ----------------------------------------------------------- |
| `useTransition`    | Atualizações de baixa prioridade, mantendo a UI responsiva. |
| `useDeferredValue` | Adia atualizações para manter a fluidez da UI.              |

```jsx
const [isPending, startTransition] = useTransition();

startTransition(() => {
  setQuery(input);
});
```

---

## 9. 🚀 Otimizações em Produção

* **Build otimizado**: minificação, tree shaking, compressão Gzip/Brotli.
* **SSR / SSG** com **Next.js** para melhor SEO e tempo de carregamento.
* **React Server Components** para reduzir JS no cliente.

---

## 10. ⚠️ Evite Anti-Padrões

| ❌ Anti-Padrão                  | ✅ Correto                        |
| ------------------------------ | -------------------------------- |
| Funções anônimas em JSX        | Declare funções fora do render   |
| Objetos/arrays inline em props | Defina fora do componente        |
| Estado desnecessário           | Derive dados quando possível     |
| Context muito abrangente       | Limite escopo e divida contextos |

---

## 11. 🖼️ Lazy Loading de Imagens e Assets

* Use `loading="lazy"` nativo do HTML.
* Ou use bibliotecas como `react-lazy-load-image-component`.

```html
<img src="imagem.jpg" loading="lazy" alt="descrição" />
```

---

## 12. 🧵 Web Workers para Tarefas Pesadas

Transfira **processamento intensivo de CPU** (como cálculos ou manipulação de dados) para **threads separadas**, mantendo a **UI fluida**.

---

## 13. 📈 Medição e Monitoramento Contínuos

Ferramentas recomendadas:

* **React DevTools Profiler**
* **Chrome Lighthouse / Web Vitals (LCP, FID, CLS)**
* **LogRocket**
* **webpack-bundle-analyzer**

---

## 14. 🔁 Imutabilidade e Estruturas de Dados

* Sempre use **atualizações imutáveis** (`...spread` ou **Immer**).
* Evite **objetos aninhados profundamente** no estado.

```jsx
// ✅ Correto
setState(prev => ({ ...prev, count: prev.count + 1 }));

// ❌ Errado
state.count++;
setState(state);
```

---

## ✅ Checklist de Performance React 2025

* [x] Entendo o que dispara re-renders e os controlo
* [x] Uso `React.memo()`, `useCallback` e `useMemo`
* [x] Implementei code splitting com `React.lazy`
* [x] Otimizei Context API
* [x] Uso recursos concurrent (`useTransition`, `useDeferredValue`)
* [x] Virtualizo listas longas
* [x] Evito funções anônimas/objetos inline em props
* [x] Monitoro performance com Web Vitals e Profiler
* [x] Uso Server Components no Next.js
* [x] Implementei lazy loading de imagens e componentes

> ⚠️ **Dica final:** Evite otimização prematura — meça primeiro, identifique gargalos com o **React DevTools Profiler** e otimize com propósito.
