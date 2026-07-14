# XPayments — Smart Drop-in Checkout V3

> Checkout white-label multi-tenant em ecrã único (Single-Screen Smart Drop-in).
> Consome o **Master Backend** via API REST V3 — não contém base de dados nem lógica de roteamento.
> Construído com **Next.js 16**, **TypeScript 5**, **Tailwind CSS 4** e **shadcn/ui**.

---

## Visão Geral

O `checkout.xpayments.digital` é um **frontend client puro** que implementa o padrão **Smart Drop-in / Dynamic Checkout**: toda a experiência de pagamento acontece num único ecrã, sem navegação entre steps. O Master Backend é responsável por todas as decisões de roteamento, criação de transações e gestão de gateways.

### Fluxo num Ecrã Único

```
┌─────────────────────────────────────┐
│  Header: Logo / StoreName    Lang  │
├─────────────────────────────────────┤
│                                     │
│  ┌─ Block A: Order Summary ──────┐  │
│  │  Store Name                   │  │
│  │  € 150.00    EUR              │  │
│  │  Ref: #ORD-2025-001          │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─ Block B: Customer ──────────┐  │
│  │  Nome *  │  Email *          │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─ Block C: Payment Wall ─────┐   │
│  │  [Card]  [MB WAY]           │   │
│  │  [Bizum] [Multibanco]       │   │
│  │  [PIX]   [USDT - Em breve]  │   │
│  └───────────────────────────────┘  │
│                                     │
│  ┌─ Method Expander ───────────┐   │
│  │  (Stripe / Phone / QR)      │   │
│  └───────────────────────────────┘  │
│                                     │
│  Powered by XPayments               │
└─────────────────────────────────────┘
```

### Responsabilidades do Checkout

1. Recebe um `sessionId` na URL (`/pay/:sessionId`)
2. Faz `GET /api/v1/checkout/session/:sessionId` ao Master Backend
3. Aplica **branding dinâmico** (logo, cor primária, nome da loja)
4. Aplica **tema** (Light por padrão; Dark apenas se `session.metadata.theme === 'dark'`)
5. Coleta `name` e `email` do pagador
6. Mostra **Payment Wall** filtrado por moeda (Smart Routing)
7. Inicia o pagamento via `POST /api/v1/checkout/initiate` (V3 contract)
8. Renderiza o gateway retornado (Stripe, PIX, Multibanco, MB WAY, Bizum)
9. Comunica status ao parent via **PostMessage** (`XPAYMENTS_STATUS`)

---

## Arquitetura

```
src/
├── app/
│   ├── layout.tsx                            # Root layout, ThemeProvider (light default, no system)
│   ├── globals.css                           # Tailwind CSS 4 + shadcn/ui theme vars
│   ├── page.tsx                              # Root page (auth redirect)
│   └── pay/
│       └── [sessionId]/
│           └── page.tsx                      # Smart Drop-in Checkout (single-screen)
├── components/
│   ├── checkout/
│   │   ├── OrderBlock.tsx                    # Block A: amount, currency, reference
│   │   ├── CustomerBlock.tsx                 # Block B: compact name + email validation
│   │   ├── PaymentWall.tsx                   # Block C: currency-filtered method grid
│   │   ├── LanguageSelector.tsx              # PT / EN / ES dropdown
│   │   ├── StripeErrorBoundary.tsx           # Error boundary for Stripe Elements crashes
│   │   ├── methods/
│   │   │   ├── CardPayment.tsx               # Stripe Payment Element (dynamic publicKey)
│   │   │   ├── PhonePayment.tsx              # MB WAY / Bizum: phone input + waiting state
│   │   │   └── AsyncPayment.tsx              # PIX (QR + copy) / Multibanco (entity + ref)
│   │   ├── OrderSummary.tsx                  # Legacy (V2) — kept for reference
│   │   ├── CustomerDetailsForm.tsx           # Legacy (V2) — kept for reference
│   │   ├── StripePaymentForm.tsx             # Legacy (V2) — kept for reference
│   │   ├── PixPaymentForm.tsx                # Legacy (V2) — kept for reference
│   │   ├── ThemeToggle.tsx                   # Legacy — not used in V3 checkout
│   │   └── PaymentTabs.tsx                   # Legacy — deleted
│   └── ui/                                   # shadcn/ui components (New York style)
├── lib/
│   ├── api-client.ts                         # V3 API: getSession() + initiatePayment()
│   ├── api/
│   │   └── xpApi.ts                          # Re-exports api-client + loginRequest
│   ├── i18n.tsx                              # I18n context (PT/EN/ES), country detection
│   ├── utils.ts                              # Utility functions (cn)
│   └── db.ts                                 # Legacy — not used in V3
├── types/
│   └── checkout.ts                           # V3 TypeScript types, type guards, helpers
└── public/
    ├── icons/                                # Payment method SVG icons
    │   ├── visa.svg
    │   ├── mastercard.svg
    │   ├── mbway.svg
    │   ├── bizum.svg
    │   ├── pix.svg
    │   └── apple-pay.svg
    └── favicon.svg
```

---

## Fluxo de Dados

```
Browser (Checkout)                          Master Backend (API)
     │                                            │
     ├─ GET /api/v1/checkout/session/:id ───────→│  Devolve: {
     │                                            │    sessionId, storeName, amount,
     │                                            │    currency, reference, logoUrl?,
     │                                            │    primaryColor?, metadata? }
     │←───────────────────────────────────────────│
     │                                            │
     │  [User fills name + email]                 │
     │  [User clicks payment method]              │
     │                                            │
     ├─ POST /api/v1/checkout/initiate ─────────→│  Recebe: {
     │                                            │    sessionId, paymentMethod,
     │                                            │    customer: { name, email, phone? }
     │                                            │  }
     │                                            │  Devolve: {
     │                                            │    gateway,
     │                                            │    checkoutData: { ... }
     │                                            │  }
     │←───────────────────────────────────────────│
     │                                            │
     ├─ Stripe: stripe.confirmPayment() ────────→│  Webhook confirma nos bastidores
     │  PIX: QR Code exibido                     │
     │  MB WAY/Bizum: waiting state               │
     │  Multibanco: entity + reference            │
     └─ PostMessage → parent: XPAYMENTS_STATUS   │
```

---

## Contrato V3 da API

### GET — Obter Sessão de Checkout

```
GET ${NEXT_PUBLIC_MASTER_API}/api/v1/checkout/session/:sessionId
```

**Response esperado:**

```json
{
  "success": true,
  "data": {
    "sessionId": "cs_abc123",
    "storeName": "Nike Store",
    "amount": 150.00,
    "currency": "EUR",
    "reference": "ORD-2025-001",
    "logoUrl": "https://cdn.example.com/logo.png",
    "primaryColor": "#C8A84E",
    "metadata": {
      "theme": "light"
    }
  }
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `sessionId` | `string` | Sim | Identificador único da sessão |
| `storeName` | `string` | Sim | Nome da loja para branding |
| `amount` | `number` | Sim | Valor do pagamento (decimal, ex: `150.00`) |
| `currency` | `string` | Sim | Código ISO 4217 (`EUR`, `BRL`, `USD`) |
| `reference` | `string` | Não | Referência do pedido para exibição |
| `logoUrl` | `string` | Não | URL do logo da loja (exibido no header) |
| `primaryColor` | `string` | Não | Cor primária hex para branding (`#C8A84E`) |
| `storeId` | `string` | Não | ID da loja (herança V2) |
| `metadata` | `object` | Não | Metadados opcionais (controle de tema, etc.) |
| `metadata.theme` | `string` | Não | Se `"dark"`, ativa modo escuro; qualquer outro valor = light |

---

### POST — Iniciar Pagamento

```
POST ${NEXT_PUBLIC_MASTER_API}/api/v1/checkout/initiate
```

**Sem headers de autenticação** — a validação é feita via `sessionId`.

**Request body:**

```json
{
  "sessionId": "cs_abc123",
  "paymentMethod": "card",
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "+351 912 345 678"
  }
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `sessionId` | `string` | Sim | ID da sessão de checkout |
| `paymentMethod` | `string` | Sim | Método de pagamento selecionado |
| `customer.name` | `string` | Sim | Nome completo do pagador |
| `customer.email` | `string` | Sim | Email do pagador |
| `customer.phone` | `string` | Não | Telefone (obrigatório para MB WAY/Bizum) |

**Valores aceites para `paymentMethod`:**

| Valor | Moedas | Comportamento |
|-------|--------|---------------|
| `card` | EUR, BRL, USD | Inicia imediatamente → Stripe Payment Element |
| `mbway` | EUR | Pede telefone → confirmação via app |
| `bizum` | EUR | Pede telefone → confirmação via app |
| `multibanco` | EUR | Inicia imediatamente → Entidade + Referência |
| `pix` | BRL | Inicia imediatamente → QR Code + PIX Copia e Cola |
| `usdt` | USD | Placeholder (Coming Soon) |

---

### Response do Initiate — por Gateway

**Stripe (card):**

```json
{
  "success": true,
  "data": {
    "gateway": "STRIPE",
    "data": {
      "gateway": "STRIPE",
      "checkoutData": {
        "clientSecret": "pi_3MtwBwLkdIwHu7ix...",
        "providerTxId": "txn_stripe_001",
        "publicKey": "pk_live_..."
      }
    }
  }
}
```

**PIX (MISTICPAY):**

```json
{
  "success": true,
  "data": {
    "gateway": "MISTICPAY",
    "data": {
      "gateway": "MISTICPAY",
      "checkoutData": {
        "pixString": "00020126...",
        "qrCode": "https://api.misticpay.com/qr/...",
        "expiresAt": "2025-01-15T12:30:00Z",
        "providerTxId": "txn_pix_001"
      }
    }
  }
}
```

**Multibanco:**

```json
{
  "success": true,
  "data": {
    "gateway": "MULTIBANCO",
    "data": {
      "gateway": "MULTIBANCO",
      "checkoutData": {
        "entity": "12345",
        "reference": "678901234",
        "amount": 150.00,
        "providerTxId": "txn_mb_001"
      }
    }
  }
}
```

**MB WAY / Bizum (phone):**

```json
{
  "success": true,
  "data": {
    "gateway": "MBWAY",
    "data": {
      "gateway": "MBWAY",
      "checkoutData": {
        "providerTxId": "txn_mbway_001",
        "status": "pending"
      }
    }
  }
}
```

---

## Smart Routing por Moeda

A Payment Wall filtra automaticamente os métodos disponíveis consoante a moeda da sessão:

| Moeda | Métodos Disponíveis |
|-------|---------------------|
| **EUR** | Cartão, MB WAY, Bizum, Multibanco |
| **BRL** | PIX, Cartão |
| **USD** | Cartão, USDT (Coming Soon) |

A filtragem é feita via `getPaymentMethodsForCurrency(currency)` em `src/types/checkout.ts`.

---

## Comportamento por Método de Pagamento

### Cartão (Stripe)
1. Utilizador clica em "Cartão" na Payment Wall
2. Checkout faz `POST /initiate` imediatamente com `paymentMethod: "card"`
3. Backend devolve `clientSecret` + `publicKey`
4. Renderiza **Stripe Payment Element** (dinâmico, `layout: "tabs"`)
5. Stripe appearance adapta-se ao tema (light/dark) e à `primaryColor` do merchant
6. Após confirmação, Stripe redireciona para `?status=success`

### MB WAY / Bizum (Phone-based)
1. Utilizador clica no método na Payment Wall
2. É exibido campo de **número de telemóvel** com validação
3. Após submit, faz `POST /initiate` com `customer.phone`
4. Entra em estado **"A aguardar aprovação"** com animação indeterminada
5. O backend confirma via webhook; o frontend aguarda redirecionamento

### PIX (QR Code)
1. Utilizador clica em "PIX" na Payment Wall
2. Checkout faz `POST /initiate` imediatamente
3. Backend devolve `pixString` + `qrCode` (URL ou base64) + `expiresAt`
4. Renderiza **QR Code** (via `qrcode.react` ou `<img>` se URL) + código "Copia e Cola"
5. Contagem decrescente até expiração
6. Botão "Gerar novo QR Code" quando expirado

### Multibanco (Voucher)
1. Utilizador clica em "Multibanco" na Payment Wall
2. Checkout faz `POST /initiate` imediatamente
3. Backend devolve `entity`, `reference`, `amount`
4. Renderiza dados com botões de **copiar** para cada campo
5. O pagamento é feito offline (ATM ou homebanking)

---

## Tema (Theming)

### Regras
- **Default: Light Mode** (sempre)
- **Dark Mode: apenas** se `session.metadata.theme === 'dark'` (da API) ou `?theme=dark` (URL param)
- **Sem toggle do utilizador** — o tema é 100% controlado pelo Merchant via API
- **Sem system preference** — `enableSystem={false}` no `ThemeProvider`

### Configuração no Backend

Para ativar dark mode, o endpoint de sessão deve incluir:

```json
{
  "metadata": {
    "theme": "dark"
  }
}
```

Qualquer outro valor (ou ausência do campo) resulta em Light Mode.

### Implementação

```tsx
// layout.tsx — ThemeProvider
<ThemeProvider
  attribute="class"
  defaultTheme="light"
  enableSystem={false}        // ← Nunca segue preferência do SO
  disableTransitionOnChange
>

// page.tsx — Theme control
useEffect(() => {
  const forced = searchParams.get("theme");
  if (forced === "dark") { setTheme("dark"); return; }
  if (session?.metadata?.theme?.toLowerCase() === "dark") { setTheme("dark"); return; }
  setTheme("light"); // ← Reset explícito para light
}, [searchParams, session?.metadata?.theme, setTheme]);
```

---

## Header — Logo e Branding

### Comportamento
1. Se a API devolver `logoUrl` no GET /session → exibe a imagem (`<img>`) com `max-w-[140px]`
2. Se não existir `logoUrl` → faz fallback para **texto do storeName** com iniciais coloridas

### Implementação

```tsx
{session.logoUrl ? (
  <img src={session.logoUrl} alt={session.storeName} className="h-7 w-auto max-w-[140px]" />
) : (
  <div className="flex items-center gap-2">
    <div style={{ backgroundColor: brandColor }} className="h-7 w-7 rounded-md flex items-center justify-center text-white font-bold text-xs">
      {session.storeName.slice(0, 2).toUpperCase()}
    </div>
    <span className="font-semibold text-sm truncate">{session.storeName}</span>
  </div>
)}
```

---

## Comunicação PostMessage (Iframe)

Quando o checkout é embutido via iframe, comunica o status ao parent window:

```typescript
// Eventos enviados:
window.parent.postMessage({ type: "XPAYMENTS_STATUS", status: "SUCCESS" }, "*");
window.parent.postMessage({ type: "XPAYMENTS_STATUS", status: "CLOSED" }, "*");
window.parent.postMessage({ type: "XPAYMENTS_STATUS", status: "CANCELLED" }, "*");
```

| Status | Quando é enviado |
|--------|-----------------|
| `SUCCESS` | Pagamento confirmado (após `?status=success`) |
| `CLOSED` | Utilizador clica no botão de fechar (X) |
| `CANCELLED` | Pagamento cancelado pelo utilizador |

---

## Internacionalização (i18n)

Suporta 3 idiomas com deteção automática via `navigator.language`:

| Código | Idioma | Deteção |
|--------|--------|---------|
| `pt` | Português | `pt-PT`, `pt-BR` |
| `en` | English | `en-US`, `en-GB` |
| `es` | Español | `es-ES`, `es-MX` |

- O idioma é persistido em `localStorage` (`xpayments-locale`)
- O utilizador pode alterar via dropdown no header (`LanguageSelector`)
- Traduções definidas em `src/lib/i18n.tsx` (60+ keys por idioma)
- Locale selecionado via **hook** `useI18n()` — sem router, sem middleware

---

## Tipos TypeScript (V3)

Definidos em `src/types/checkout.ts`:

```typescript
// Session
interface CheckoutSession {
  sessionId: string;
  storeName: string;
  amount: number;           // ← V3 (replaces amountFiat)
  currency: string;
  reference?: string;       // ← V3 (new)
  logoUrl?: string;
  primaryColor?: string;
  metadata?: { theme?: string };
}

// Payment Methods
type PaymentMethodType = "card" | "mbway" | "bizum" | "multibanco" | "pix" | "usdt";

// Initiate Payload (V3 contract — NO auth headers)
interface InitiatePaymentRequest {
  sessionId: string;
  paymentMethod: string;
  customer: { name: string; email: string; phone?: string };
}

// Gateway Responses
interface StripeCheckoutData { clientSecret: string; providerTxId: string; publicKey: string; }
interface PixCheckoutData { pixString?: string; pixCode?: string; qrCode?: string; expiresAt?: string; }
interface MultibancoCheckoutData { entity: string; reference: string; amount: number; }
interface PhoneCheckoutData { providerTxId: string; status?: string; }
```

---

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_MASTER_API` | **Sim** | URL do Master Backend. Default: `https://api.xpayments.digital` |

### `.env.local`

```env
NEXT_PUBLIC_MASTER_API="https://api.xpayments.digital"
```

> **Nota:** O `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` foi **removido** no V3. A chave pública do Stripe é agora devolvida dinamicamente pelo backend no response do `/initiate` (campo `publicKey`), permitindo que cada merchant use a sua própria chave.

---

## Instalação

```bash
git clone https://github.com/nexflowx-hub/checkout.xpayments.digital.git
cd checkout.xpayments.digital
bun install
bun run dev
```

### Scripts

| Comando | Descrição |
|---------|-----------|
| `bun run dev` | Dev server (Turbopack) na porta 3000 |
| `bun run build` | Build de produção (standalone) |
| `bun run start` | Servir build de produção |
| `bun run lint` | ESLint |

---

## Stripe Integration

O `CardPayment` funciona em duas camadas:

1. **Dynamic Key Loading** — Carrega `loadStripe(response.publicKey)` com a chave pública recebida do backend (V3). Não há chave hard-coded no frontend.
2. **Inner Form** — Usa `useStripe()` + `<PaymentElement layout="tabs" />`, chama `stripe.confirmPayment()` com `return_url` que aponta para `?status=success`

### Appearance

O Stripe appearance adapta-se ao tema:
- **Light**: `theme: "stripe"`, fundo branco, texto escuro
- **Dark**: `theme: "night"`, fundo `#09090b`, texto claro, custom rules para Label/Input/Tab

A `colorPrimary` é injetada com a `primaryColor` do merchant.

### Error Boundary

O `StripeErrorBoundary` (class component) envolve o `<Elements>` para evitar white-screen caso o Stripe SDK falhe (ex: `clientSecret` inválido, chave ausente).

---

## Stack Tecnológica

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| [Next.js](https://nextjs.org/) | 16 | App Router (client components) |
| [React](https://react.dev/) | 19 | UI |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Type safety rigoroso |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Styling (CSS-first) |
| [shadcn/ui](https://ui.shadcn.com/) | New York | Component library |
| [@stripe/stripe-js](https://stripe.com/docs/stripe-js) | 9.x | Stripe.js loader (dynamic key) |
| [@stripe/react-stripe-js](https://stripe.com/docs/stripe-js/react) | 6.x | Elements, PaymentElement |
| [qrcode.react](https://github.com/zpao/qrcode.react) | 4.x | QR Code SVG (PIX) |
| [next-themes](https://github.com/pacocoursey/next-themes) | 0.4 | Theme management (merchant-controlled) |
| [Lucide React](https://lucide.dev/) | 0.525+ | Icon library |
| [Framer Motion](https://www.framer.com/motion/) | 12 | Animations |

---

## Deploy (Vercel)

1. Fazer push para `main`
2. No Vercel, importar o repositório `checkout.xpayments.digital`
3. Adicionar variável de ambiente:
   - `NEXT_PUBLIC_MASTER_API` = `https://api.xpayments.digital`
4. Deploy

> **Nota:** Não é necessário configurar `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — a chave é dinâmica via backend.

---

## Segurança

- O `clientSecret` do Stripe é usado apenas via Stripe.js — nunca exposto em logs
- O `pixCode` é gerado server-side pelo Master Backend
- A `POST /initiate` **não envia headers de autenticação** — validação via `sessionId`
- HTTPS obrigatório (Stripe requirement)
- O frontend não tem acesso a chaves secretas
- Stripe Error Boundary impede white-screen em caso de crash

---

## Notas Técnicas

- `amount` é um valor decimal exato (ex: `150.00`). A função `formatCurrency()` formata com `Intl.NumberFormat("pt-BR", ...)` sem divisão por centavos.
- O branding é aplicado via **inline styles** para suportar qualquer cor hex sem compilação CSS.
- O `return_url` do `stripe.confirmPayment()` aponta para a própria página com `?status=success`.
- O Payment Wall é **desativado** até que o formulário do cliente (Block B) tenha `name` e `email` válidos.
- A validação do cliente usa `useMemo` para computação pura de erros e `useEffect` para notificar o parent via callback.
- O i18n usa `FALLBACK_CONTEXT` para evitar crashes quando `useI18n()` é chamado fora do `I18nProvider`.

---

## Licença

Propriedade da **NexFlowX Hub**. Todos os direitos reservados.