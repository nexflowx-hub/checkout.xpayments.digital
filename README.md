# XPayments — Hosted Checkout

> Plataforma de checkout **White-Label Multi-Tenant** com **Smart Routing** para Stripe e PIX (MISTIC).
> Construída com Next.js 16, TypeScript, Tailwind CSS 4 e shadcn/ui.

---

## Visão Geral

O `checkout.xpayments.digital` é um frontend de checkout hospedado (hosted checkout) que se adapta dinamicamente à identidade visual de cada comerciante (seller). A página assume automaticamente as cores, logótipo e nome da loja com base nos dados devolvidos pela API da gateway.

### Características Principais

- **White-Label Multi-Tenant** — Branding dinâmico (cor, logo, nome) injetado via inline styles
- **Smart Routing** — Roteamento automático entre gateways (Stripe para EUR, PIX/MISTIC para BRL)
- **Layout Responsivo** — 2 colunas (desktop) / empilhado (mobile), mobile-first
- **Stripe Payment Element** — Integração completa com `@stripe/react-stripe-js` e theming dinâmico
- **PIX com QR Code** — Geração de QR Code via `qrcode.react`, countdown de expiração, copy-to-clipboard
- **Type-Safe** — TypeScript strict com tipos definidos para toda a API contract
- **Mock APIs** — Rotas de mock para desenvolvimento sem backend

---

## Arquitetura

```
src/
├── app/
│   ├── page.tsx                              # Landing page com demonstrações
│   ├── layout.tsx                            # Root layout (Geist font, metadata)
│   ├── globals.css                           # Tailwind CSS 4 + tema shadcn/ui
│   ├── pay/
│   │   └── [urlCode]/
│   │       └── page.tsx                      # Página principal do checkout (rota dinâmica)
│   └── api/
│       ├── payment-links/
│       │   └── [urlCode]/
│       │       └── route.ts                  # GET /api/payment-links/:urlCode  (Mock)
│       └── checkout/
│           └── initiate/
│               └── route.ts                  # POST /api/checkout/initiate    (Mock)
├── components/
│   ├── checkout/
│   │   ├── OrderSummary.tsx                  # Painel esquerdo: resumo do pedido + branding
│   │   ├── CustomerDetailsForm.tsx           # Step 1: Nome, Email, País
│   │   ├── StripePaymentForm.tsx             # Step 2: Stripe Elements + PaymentElement
│   │   └── PixPaymentForm.tsx                # Step 2: QR Code + PIX Copia e Cola
│   └── ui/                                   # shadcn/ui component library
└── types/
    └── checkout.ts                           # Tipos TypeScript + helper functions
```

---

## Fluxo de Checkout (3 Passos)

### PASSO A — Carregar Link de Pagamento

```
GET ${NEXT_PUBLIC_API_URL}/api/v1/payment-links/:urlCode
```

**Request:** `urlCode` (path param)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "pl_01",
    "storeId": "store_pt_001",
    "name": "Sapatilhas Nike Air Max 90",
    "amountFiat": 15000,
    "currency": "EUR",
    "branding": {
      "storeName": "Nike Store",
      "logo": "https://cdn.example.com/logo.png",
      "color": "#111111"
    }
  }
}
```

A cor `branding.color` é aplicada em:
- Header do checkout (border-bottom)
- Botão principal de pagamento (background)
- Step indicator (bolinha ativa)
- Ícones do OrderSummary

---

### PASSO B — Dados do Cliente + Smart Routing

```
POST ${NEXT_PUBLIC_API_URL}/api/v1/checkout/initiate
```

**Request:**
```json
{
  "storeId": "store_pt_001",
  "amountFiat": 15000,
  "currency": "EUR",
  "customerDetails": {
    "fullName": "João Silva",
    "email": "joao@email.com",
    "country": "PT"
  }
}
```

---

### PASSO C — Renderizar Gateway

**Response (Stripe):**
```json
{
  "success": true,
  "data": {
    "gateway": "STRIPE_PT_002",
    "checkoutData": {
      "clientSecret": "pi_3MtwBwLkdIwHu7ix0l4t3W8Q_secret_...",
      "providerTxId": "txn_stripe_1718400000000",
      "publishableKey": "pk_live_..."
    }
  }
}
```

**Response (PIX/MISTIC):**
```json
{
  "success": true,
  "data": {
    "gateway": "MISTIC_BR_001",
    "checkoutData": {
      "pixCode": "00020126580014br.gov.bcb.pix0136...",
      "providerTxId": "txn_pix_1718400000000",
      "expiresAt": "2025-06-15T22:00:00.000Z"
    }
  }
}
```

**Lógica de Routing:**
- Se `gateway` contém `"STRIPE"` → Renderiza `StripePaymentForm`
- Se `gateway` contém `"MISTIC"` ou `"PIX"` → Renderiza `PixPaymentForm`

---

## Tipos TypeScript

Todos os tipos encontram-se em [`src/types/checkout.ts`](src/types/checkout.ts):

```typescript
// Entidades principais
interface Branding       { storeName: string; logo?: string; color: string }
interface PaymentLinkData { id: string; storeId: string; name: string; amountFiat: number; currency: string; branding: Branding }
interface CustomerDetails { fullName: string; email: string; country: string }

// Gateway responses
interface StripeCheckoutData { clientSecret: string; providerTxId: string; publishableKey?: string }
interface PixCheckoutData    { pixCode: string; providerTxId: string; qrCodeBase64?: string; expiresAt?: string }

// Helpers
isStripeGateway(gateway: string): boolean    // "STRIPE_PT_002" → true
isPixGateway(gateway: string): boolean        // "MISTIC_BR_001" → true
isStripeCheckoutData(data): boolean           // Type guard
formatCurrency(amount: number, currency: string): string  // 15000, "EUR" → "€150.00"
```

> **Nota:** `amountFiat` é sempre em centavos (integer). A função `formatCurrency()` divide por 100.

---

## Componentes

### `OrderSummary`
Painel lateral esquerdo (desktop) ou inline (mobile) com:
- Avatar/Logo da loja (ou iniciais com `brandColor`)
- Nome do item, quantidade e preço total
- Badges: "Pagamento seguro" + moeda

### `CustomerDetailsForm`
Formulário Step 1 com validação client-side:
- **Nome Completo** — mínimo 2 caracteres
- **Email** — validação regex
- **País** — Select com 12 países (PT, BR, ES, FR, DE, IT, GB, US, AO, MZ, CV, Outro)
- Botão "Continuar para Pagamento" com `brandColor`

### `StripePaymentForm`
Integração Stripe em duas camadas:
- **Wrapper** — Carrega `loadStripe(publishableKey)`, configura `<Elements>` com `appearance` dinâmico (`colorPrimary: brandColor`)
- **Inner Form** — Usa `useStripe()` + `useElements()` + `<PaymentElement layout="tabs" />`, chama `stripe.confirmPayment()`
- **Fallback Demo** — Se não houver `publishableKey`, mostra modo demonstração com botão "Simular Pagamento"

### `PixPaymentForm`
Pagamento PIX completo:
- **QR Code** — `<QRCodeSVG>` 200px, nível H, com overlay de expiração
- **Countdown** — Timer `MM:SS` com `setInterval(1000ms)`, muda para "Expirado" quando `expiresAt` passa
- **Copia e Cola** — `navigator.clipboard.writeText()` com fallback `execCommand("copy")`
- **Estado visual** — Feedback "Copiado" com check verde

---

## Variáveis de Ambiente

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `NEXT_PUBLIC_API_URL` | `string` | URL base da API de produção (ex: `https://api.xpayments.digital`). Se omitido, usa mock APIs locais. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `string` | Chave publishable do Stripe. Pode também ser devolvida pela API no campo `publishableKey`. |
| `API_URL` | `string` | URL da API para proxy server-side (usada nas API routes como fallback). |

### Exemplo `.env.local`

```env
NEXT_PUBLIC_API_URL=https://api.xpayments.digital
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
API_URL=https://api.xpayments.digital
```

---

## Instalação e Desenvolvimento

### Pré-requisitos

- **Bun** (recomendado) ou **Node.js** >= 18
- **Git**

### Setup

```bash
# Clonar o repositório
git clone https://github.com/nexflowx-hub/checkout.xpayments.digital.git
cd checkout.xpayments.digital

# Instalar dependências
bun install

# Iniciar em modo desenvolvimento
bun run dev
```

A aplicação fica disponível em `http://localhost:3000`.

### Scripts

| Comando | Descrição |
|---------|-----------|
| `bun run dev` | Servidor de desenvolvimento (Turbopack) na porta 3000 |
| `bun run build` | Build de produção (standalone output) |
| `bun run start` | Servir build de produção |
| `bun run lint` | ESLint (zero errors) |

---

## Demonstração

A homepage (`/`) contém um launcher com 3 cenários de teste:

| Link | Loja | Gateway | Moeda | Valor | Cor |
|------|------|---------|-------|-------|-----|
| `/pay/demo_eur` | Nike Store | Stripe | EUR | €150.00 | `#111111` |
| `/pay/demo_brl` | Loja do Brasil | PIX (MISTIC) | BRL | R$89.90 | `#16a34a` |
| `/pay/demo_red` | Azores Surf School | Stripe | EUR | €45.00 | `#dc2626` |

### Testar um código personalizado

A homepage tem um campo "Código Personalizado" que navega para `/pay/{código}`.

---

## Stack Tecnológica

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| [Next.js](https://nextjs.org/) | 16.1+ | App Router, API Routes, Turbopack |
| [React](https://react.dev/) | 19 | UI Components |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | New York | Component library (Button, Card, Input, Select, Badge, etc.) |
| [@stripe/stripe-js](https://stripe.com/docs/stripe-js) | 9.x | Stripe.js loader |
| [@stripe/react-stripe-js](https://stripe.com/docs/stripe-js/react) | 6.x | React components (Elements, PaymentElement) |
| [qrcode.react](https://github.com/zpao/qrcode.react) | 4.x | QR Code SVG generation |
| [Lucide React](https://lucide.dev/) | 0.525+ | Icon library |
| [Radix UI](https://www.radix-ui.com/) | latest | Headless primitives (via shadcn) |

---

## Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
bun add -g vercel

# Deploy
vercel --prod
```

Variáveis de ambiente a configurar no dashboard da Vercel:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Docker / Standalone

O `next.config.ts` usa `output: "standalone"`. Para Docker:

```dockerfile
FROM node:20-alpine AS installer
WORKDIR /app
COPY package.json bun.lock ./
RUN corepack enable && bun install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY . .
RUN corepack enable && bun run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Integração com API de Produção

Quando `NEXT_PUBLIC_API_URL` está definido, o frontend faz pedidos diretamente à API de produção em vez das mock APIs:

```
Cliente (Browser)                     API de Produção
      │                                      │
      ├─ GET /api/v1/payment-links/abc123 ──→│
      │                                      │
      ├─ POST /api/v1/checkout/initiate ────→│  (Smart Routing)
      │                                      │
      ├─ Stripe: PaymentElement ────────────→│  (stripe.confirmPayment)
      │                                      │
      └─ PIX: QR Code + Copy ──────────────→│  (aguarda webhook)
```

As API routes locais (`/api/*`) servem como **proxy fallback** — se `API_URL` (server-side) estiver definido, elas fazem proxy para a API de produção. Se não, retornam dados mock.

---

## Segurança

- **Stripe** — O `clientSecret` é usado apenas no client-side via Stripe.js; a chave de API secreta nunca toca o frontend
- **PIX** — O `pixCode` é gerado server-side e devolvido via API; não há dados sensíveis no frontend
- **CORS** — A API de produção deve configurar CORS para permitir o domínio `checkout.xpayments.digital`
- **HTTPS** — Obrigatório em produção (Stripe requer HTTPS)

---

## Estrutura de Branding Dinâmico

A injeção de cor é feita via **inline styles** para garantir que qualquer cor hex funcione sem necessidade de compilação CSS:

```tsx
// Botão principal
<Button style={{ backgroundColor: brandColor, color: "#fff" }}>

// Header
<header style={{ borderBottomColor: `${brandColor}20` }}>

// Step indicator
<div style={{ backgroundColor: isActive ? brandColor : "var(--muted)" }}>

// Avatar fallback
<div style={{ backgroundColor: brandColor }}>
  {storeName.slice(0, 2).toUpperCase()}
</div>
```

---

## Licença

Propriedade da **NexFlowX Hub**. Todos os direitos reservados.

---

## Autor

**NexFlowX** — [github.com/nexflowx-hub](https://github.com/nexflowx-hub)