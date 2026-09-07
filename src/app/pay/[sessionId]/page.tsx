import type { Metadata } from "next";

import { CheckoutExperience, type CheckoutQuery } from "@/components/checkout/CheckoutExperience";
import { getSession } from "@/lib/api-client";
import type { CheckoutSession } from "@/types/checkout";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type SearchValue = string | string[] | undefined;
type SearchParams = Record<string, SearchValue>;

function first(value: SearchValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { sessionId } = await params;
  const incoming = await searchParams;

  const query: CheckoutQuery = {
    embedded: first(incoming.embedded),
    return: first(incoming.return),
    status: first(incoming.status),
    parent_origin: first(incoming.parent_origin),
    theme: first(incoming.theme),
  };

  let initialSession: CheckoutSession | null = null;
  let initialError: string | null = null;

  try {
    initialSession = await getSession(sessionId);
  } catch (error) {
    initialError =
      error instanceof Error
        ? error.message
        : "Não foi possível carregar o checkout.";
  }

  return (
    <CheckoutExperience
      sessionId={sessionId}
      initialSession={initialSession}
      initialError={initialError}
      query={query}
    />
  );
}
