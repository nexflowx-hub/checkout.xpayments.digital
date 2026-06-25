# XPayments — Hosted Checkout (Frontend Client)

> Checkout White-Label Multi-Tenant que consome o **Master Backend (Spaceship)** via API REST.
> Não contém base de dados, rotas de API próprias, nem lógica de roteamento de pagamentos.
> Construído com Next.js 16, TypeScript, Tailwind CSS 4 e shadcn/ui.

---

## Visão Geral

O `checkout.xpayments.digital` é um **frontend client puro**. Todas as decisões de roteamento, criação de transações e gestão de gateways são feitas pelo Master Backend. O Checkout apenas:

1. Recebe um `urlCode` na URL
2. Faz fetch ao Master Backend para obter dados da loja e do produto
3. Aplica branding dinâmico (cor, logo, nome)
4. Coleta dados do cliente e envia ao Master Backend para iniciar o pagamento
5. Renderiza o gateway retornado (Stripe ou PIX)

---

## Arquitetura

```
src/
├── app/
│   ├── page.tsx                              # Landing page (informacional)
│   ├── layout.tsx                            # Root layout
│   ├── globals.css                           # Tailwind CSS 4 + tema shadcn/ui
│   └── pay/
│       └── [urlCode]/
│           └── page.tsx                      # Checkout (client-side fetch ao Master Backend)
├── components/
│   ├── checkout/
│   │   ├── OrderSummary.tsx                  # Resumo do pedido + branding da loja
│   │   ├── CustomerDetailsForm.tsx           # Step 1: Nome, Email, País
│   │   ├── StripePaymentForm.tsx             # Step 2: Stripe Elements + PaymentElement
│   │   └── PixPaymentForm.tsx                # Step 2: QR Code + PIX Copia e Cola
│   └── ui/                                   # shadcn/ui components
├── lib/
│   ├── api-client.ts                         # API Client (fetchPaymentLink + initiateCheckout)
│   └── utils.ts                              # Utility functions (cn)
└── types/
    └── checkout.ts                           # TypeScript types + helpers
```

### Fluxo de Dados

```
Browser (Checkout)                    Master Backend (Spaceship)
     │                                          │
     ├─ GET /api/v1/payment-links/:urlCode ───→│  Devolve: { id, storeId, amountFiat, currency, branding }
     │                                          │
     ├─ POST /api/v1/checkout/initiate ───────→│  Recebe: { storeId, amountFiat, currency, customerDetails }
     │                                          │  Devolve: { gateway, checkoutData: { clientSecret | pixCode } }
     │←─────────────────────────────────────────│
     │                                          │
     ├─ Stripe: stripe.confirmPayment() ──────→│  Webhook confirma nos bastidores
     │                                          │
     └─ PIX: QR Code gerado pelo backend ──────│  Webhook confirma nos bastidores
```

---

## Fluxo de Checkout

### Passo 1 — Carregar Dados

```
GET ${NEXT_PUBLIC_MASTER_API}/api/v1/payment-links/:urlCode
```

```json
{
  "success": true,
  "data": {
    "id": "pl_01",
    "storeId": "store_pt_001",
    "name": "Sapatilhas Nike Air Max 90",
    "amountFiat": 150.00,
    "currency": "EUR",
    "branding": {
      "storeName": "Nike Store",
      "logo": "https://cdn.example.com/logo.png",
      "color": "#C8A84E"
    }
  }
}
```

A `branding.color` é injetada via inline styles no header, botões e step indicator.

---

### Passo 2 — Iniciar Pagamento

```
POST ${NEXT_PUBLIC_MASTER_API}/api/v1/checkout/initiate
```

```json
{
  "storeId": "store_pt_001",
  "amountFiat": 150.00,
  "currency": "EUR",
  "customerDetails": {
    "fullName": "João Silva",
    "email": "joao@email.com",
    "country": "PT"
  }
}
```

O Master Backend devolve o gateway escolhido (Smart Routing):

```json
{
  "success": true,
  "data": {
    "gateway": "STRIPE_PT_002",
    "checkoutData": {
      "clientSecret": "pi_3MtwBwLkdIwHu7ix...",
      "providerTxId": "txn_stripe_..."
    }
  }
}
```

---

### Passo 3 — Renderizar Gateway

- Se `gateway` contém `"STRIPE"` → `<StripePaymentForm>` com `<Elements>` + `<PaymentElement>`
- Se `gateway` contém `"MISTIC"` ou `"PIX"` → `<PixPaymentForm>` com QR Code

---

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_MASTER_API` | **Sim** | URL do Master Backend. Default: `https://api.xpayments.digital` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **Sim** | Stripe publishable key. Usada para inicializar o Stripe.js |

### `.env.local`

```env
NEXT_PUBLIC_MASTER_API="https://api.xpayments.digital"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_TUA_CHAVE_PUBLICA_AQUI"
```

> **Vercel:** Adicionar estas variáveis nas Settings do projeto.

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

O `StripePaymentForm` funciona em duas camadas:

1. **Wrapper** — Carrega `loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)` e configura `<Elements>` com `appearance.colorPrimary` = `brandColor`
2. **Inner Form** — Usa `useStripe()` + `<PaymentElement layout="tabs" />`, chama `stripe.confirmPayment()` com `return_url` que aponta para `?status=success`

O Master Backend trata da confirmação real via webhook — o frontend apenas redireciona.

---

## Stack Tecnológica

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| [Next.js](https://nextjs.org/) | 16 | App Router (client components) |
| [React](https://react.dev/) | 19 | UI |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Styling |
| [shadcn/ui](https://ui.shadcn.com/) | New York | Components |
| [@stripe/stripe-js](https://stripe.com/docs/stripe-js) | 9.x | Stripe.js loader |
| [@stripe/react-stripe-js](https://stripe.com/docs/stripe-js/react) | 6.x | Elements, PaymentElement |
| [qrcode.react](https://github.com/zpao/qrcode.react) | 4.x | QR Code SVG |
| [Lucide React](https://lucide.dev/) | 0.525+ | Icons |

---

## Deploy (Vercel)

1. Fazer push para `main`
2. No Vercel, importar o repositório `checkout.xpayments.digital`
3. Adicionar variáveis de ambiente:
   - `NEXT_PUBLIC_MASTER_API` = `https://api.xpayments.digital`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
4. Deploy

---

## Segurança

- O `clientSecret` do Stripe é usado apenas via Stripe.js — nunca exposto
- O `pixCode` é gerado server-side pelo Master Backend
- HTTPS obrigatório (Stripe requirement)
- O frontend não tem acesso a chaves secretas

---

## Notas Técnicas

- `amountFiat` é um valor decimal exato (ex: `150.00`). A função `formatCurrency()` formata diretamente sem divisão por centavos.
- O branding é aplicado via **inline styles** para suportar qualquer cor hex sem compilação CSS.
- O `return_url` do `stripe.confirmPayment()` aponta para a própria página com `?status=success`.

---

## Licença

Propriedade da **NexFlowX Hub**. Todos os direitos reservados.