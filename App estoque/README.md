# 📦 Conferência de Estoque — v2.0

Sistema de conferência de estoque com importação CSV, contagem manual, e geração de relatório PDF com impacto financeiro.

---

## 🏗️ Arquitetura

```
estoque/
├── index.html          # Shell HTML semântica — apenas estrutura, zero lógica
├── style.css           # Design system completo com tokens CSS
└── src/
    ├── app.js          # Orquestrador: liga eventos → módulos
    ├── store.js        # Estado centralizado (Observer pattern)
    ├── parser.js       # Parsing de CSV — funções puras, sem side effects
    ├── renderer.js     # Camada de UI — recebe dados, produz DOM
    └── pdf-exporter.js # Geração de PDF isolada
```

### Princípios aplicados

| Princípio | Aplicação |
|-----------|-----------|
| **Single Responsibility** | Cada módulo tem 1 razão para mudar |
| **Observer Pattern** | `Store.subscribe()` — UI reage a estado |
| **Event Delegation** | 1 listener por lista, não por item |
| **Pure Functions** | `parser.js` — determinístico, testável |
| **Separation of Concerns** | HTML = estrutura, CSS = visual, JS = lógica |
| **ES Modules** | Import/export nativo, sem bundler |

---

## 🧠 Fluxo de dados

```
Usuário interage
      │
      ▼
  app.js (Event Handler)
      │
      ▼
  store.js (State.set)
      │
      ├──► persist() → localStorage
      │
      └──► notify() → subscribers
                │
                ▼
          renderer.js (renderizarLista)
                │
                ▼
            DOM atualizado
```

---

## ⚡ Melhorias de performance

- **DocumentFragment** na renderização: batch de DOM, 1 reflow
- **Event delegation** na lista: 1 listener para N cards
- **Atualização inline de diff**: sem re-render da lista inteira
- **Lazy cache** do elemento `#lista`: 1 query por sessão

---

## 📋 Formato CSV esperado

Separador: `;`

| Coluna | Campo |
|--------|-------|
| `des_item` | Nome do produto |
| `qtd_saldo` | Saldo em sistema |
| `cod_barra` | Código de barras (usa últimos 4 dígitos) |
| `cod_item` | ID interno |
| `val_custo_unitario` | Custo unitário (formato BR: `1.234,56`) |

---

## 🚀 Como usar

1. Abra `index.html` em um servidor local (necessário para ES Modules)
2. Importe o CSV via botão "Importar CSV"
3. Filtre por categoria ou pesquise pelo nome/código
4. Preencha a contagem real nos campos
5. Gere o relatório PDF ao finalizar

> **Dica:** O estado persiste automaticamente em `localStorage` — pode fechar e continuar depois.
